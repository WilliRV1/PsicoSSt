import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { generateIndividualPDF } from "@/lib/pdf/generate-individual-pdf";

const MAX_REPORTS = 100;

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orgId, status } = body as { orgId?: string; status?: string };

    try {
        const assessments = await prisma.assessment.findMany({
            where: {
                psychologistId: session.user.id,
                status: status ? { equals: status as any } : { in: ["SCORED", "REVIEWED", "SIGNED"] },
                ...(orgId && { organizationId: orgId }),
            },
            include: {
                worker: { select: { fullName: true, documentType: true, documentId: true } },
                organization: { select: { name: true } },
                psychologist: { include: { signatures: true } },
                scoredResult: true,
                generatedReports: {
                    take: 1,
                    orderBy: { generatedAt: "desc" },
                },
            },
            orderBy: { assessmentDate: "desc" },
            take: MAX_REPORTS,
        });

        if (assessments.length === 0) {
            return NextResponse.json({ error: "No hay informes para exportar con los filtros seleccionados." }, { status: 404 });
        }

        // Filter out assessments without scored results
        const exportable = assessments.filter(a => a.scoredResult !== null);

        if (exportable.length === 0) {
            return NextResponse.json({ error: "Ningún informe tiene resultados calificados." }, { status: 404 });
        }

        const zip = new JSZip();

        // Generate PDFs in batches of 5 to avoid memory pressure
        const batchSize = 5;
        for (let i = 0; i < exportable.length; i += batchSize) {
            const batch = exportable.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (a) => {
                    try {
                        const buffer = await generateIndividualPDF(a as any);
                        const date = new Date(a.assessmentDate).toISOString().slice(0, 10);
                        const filename = `Informe_${a.worker.documentId}_${date}.pdf`;
                        return { filename, buffer };
                    } catch (err) {
                        console.error(`Error generating PDF for assessment ${a.id}:`, err);
                        return null;
                    }
                })
            );
            for (const result of results) {
                if (result) {
                    zip.file(result.filename, result.buffer);
                }
            }
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });

        const orgName = orgId
            ? (await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }))?.name ?? "informes"
            : "todos";
        const safeOrgName = orgName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
        const dateStr = new Date().toISOString().slice(0, 10);

        return new NextResponse(zipBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="PsicoSST_${safeOrgName}_${dateStr}.zip"`,
                "X-Reports-Count": String(exportable.length),
            },
        });
    } catch (error) {
        console.error("[BULK-EXPORT] Error:", error);
        return NextResponse.json({ error: "Error interno al generar la exportación." }, { status: 500 });
    }
}
