import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { buildIndividualData } from "@/lib/reports/individual-data";
import { compileTypstPdf } from "@/lib/reports/typst";

// Mismo motor que la descarga individual: si esta ruta usara otro, el mismo
// informe saldría distinto según por dónde se descargue.
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_REPORTS = 100;

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orgId, status } = body as { orgId?: string; status?: string };

    try {
        const assessments = await prisma.assessment.findMany({
            where: {
                psychologistId: session.user.id,
                status: status
                    ? { equals: status as "SCORED" | "REVIEWED" | "SIGNED" }
                    : { in: ["SCORED", "REVIEWED", "SIGNED"] },
                ...(orgId && { organizationId: orgId }),
                scoredResult: { isNot: null },
            },
            select: {
                id: true,
                assessmentDate: true,
                worker: { select: { documentId: true } },
            },
            orderBy: { assessmentDate: "desc" },
            take: MAX_REPORTS,
        });

        if (assessments.length === 0) {
            return NextResponse.json(
                { error: "No hay informes calificados para exportar con los filtros seleccionados." },
                { status: 404 }
            );
        }

        const zip = new JSZip();
        let generated = 0;
        const failed: string[] = [];

        // Secuencial a propósito: el compilador de Typst es un singleton con
        // estado de archivos virtuales, así que las compilaciones se serializan
        // de todos modos. Paralelizar aquí sólo aumentaría el pico de memoria.
        for (const a of assessments) {
            try {
                const built = await buildIndividualData(a.id, session.user.id, !!session.user.isAdmin, false);
                if (!built) {
                    failed.push(a.id);
                    continue;
                }
                const pdf = await compileTypstPdf("individual.typ", built.data, built.assets);
                const date = new Date(a.assessmentDate).toISOString().slice(0, 10);
                zip.file(`Informe_${a.worker.documentId}_${date}.pdf`, pdf);
                generated++;
            } catch (err) {
                // Un informe que falla no debe tumbar la exportación completa.
                console.error(`[BULK-EXPORT] Falló el informe ${a.id}:`, err);
                failed.push(a.id);
            }
        }

        if (generated === 0) {
            return NextResponse.json(
                { error: "No se pudo generar ninguno de los informes seleccionados." },
                { status: 500 }
            );
        }

        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        const orgName = orgId
            ? ((await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }))
                  ?.name ?? "informes")
            : "todos";
        const safeOrgName = orgName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
        const dateStr = new Date().toISOString().slice(0, 10);

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="PsicoSST_${safeOrgName}_${dateStr}.zip"`,
                "X-Reports-Count": String(generated),
                "X-Reports-Failed": String(failed.length),
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("[BULK-EXPORT] Error:", error);
        return NextResponse.json({ error: "Error interno al generar la exportación." }, { status: 500 });
    }
}
