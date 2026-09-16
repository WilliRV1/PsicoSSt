import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractRequestMeta, logAudit } from "@/lib/auth/audit";
import { buildIndividualData } from "@/lib/reports/individual-data";
import { compileTypstPdf } from "@/lib/reports/typst";
import { fetchArchivedPdf, ReportArchiveError, sha256 } from "@/lib/reports/archive";

// El compilador de Typst es un addon nativo y lee las plantillas y las fuentes
// del disco, así que esta ruta tiene que correr en Node, no en el edge.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const isAnonymous = req.nextUrl.searchParams.get("anon") === "true";

    const built = await buildIndividualData(id, session.user.id, !!session.user.isAdmin, isAnonymous);
    if (!built) {
        return NextResponse.json(
            { error: "Evaluación no encontrada, no calificada, o sin acceso" },
            { status: 404 }
        );
    }

    const anonymized = built.data.meta.isAnonymous;
    const { ipAddress, userAgent } = extractRequestMeta(req);
    const audit = (extra: Record<string, unknown>) =>
        logAudit({
            userId: session.user.id,
            action: "READ",
            resourceType: "individual_report",
            resourceId: id,
            metadata: { viaAdmin: built.viaAdmin, anonymized, ...extra },
            ipAddress,
            userAgent,
        });

    const filename = anonymized
        ? `Informe_anonimo_${id.slice(0, 8)}.pdf`
        : `Informe_individual_${built.data.worker.document.replace(/\W+/g, "_")}.pdf`;

    const pdfResponse = (pdf: Buffer, source: "archived" | "compiled") =>
        new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "X-Report-Source": source,
                "Cache-Control": "private, no-store",
            },
        });

    // ── informe firmado: se devuelve el documento archivado ───────────────
    // Un informe firmado ya no se recompila: el entregable es el archivo que se
    // firmó. Sólo se omite cuando la copia pedida es anónima, porque el
    // archivado lleva el nombre del trabajador y devolverlo rompería la reserva.
    if (!anonymized) {
        const archived = await prisma.generatedReport.findUnique({
            where: { assessmentId: id },
            select: { id: true, status: true, pdfUrl: true, contentHash: true },
        });

        if (
            archived?.pdfUrl &&
            (archived.status === "SIGNED" || archived.status === "DELIVERED")
        ) {
            try {
                const bytes = await fetchArchivedPdf(archived.pdfUrl);
                if (!bytes) {
                    await audit({ source: "archived", outcome: "missing" });
                    return NextResponse.json(
                        {
                            error:
                                "El informe firmado no se encuentra en el archivo. " +
                                "No puede entregarse una recompilación en su lugar: no sería el documento firmado.",
                        },
                        { status: 409 }
                    );
                }

                const actual = sha256(bytes);
                if (archived.contentHash && actual !== archived.contentHash) {
                    await audit({
                        source: "archived",
                        outcome: "hash_mismatch",
                        expectedHash: archived.contentHash,
                        actualHash: actual,
                    });
                    return NextResponse.json(
                        {
                            error:
                                "La huella del informe archivado no coincide con la registrada al firmarlo. " +
                                "El documento no se entrega porque no puede garantizarse que sea el firmado.",
                            expectedHash: archived.contentHash,
                            actualHash: actual,
                        },
                        { status: 409 }
                    );
                }

                await audit({ source: "archived", reportId: archived.id, outcome: "ok" });
                return pdfResponse(bytes, "archived");
            } catch (error) {
                console.error("Error al recuperar el informe archivado:", error);
                await audit({ source: "archived", outcome: "error" });
                return NextResponse.json(
                    {
                        error:
                            error instanceof ReportArchiveError
                                ? error.message
                                : "Error interno al recuperar el informe archivado",
                    },
                    { status: 500 }
                );
            }
        }
    }

    try {
        const pdf = await compileTypstPdf("individual.typ", built.data, built.assets);
        await audit({ source: "compiled", outcome: "ok" });
        return pdfResponse(pdf, "compiled");
    } catch (error) {
        console.error("Error al generar el informe individual:", error);
        return NextResponse.json({ error: "Error interno al generar el PDF" }, { status: 500 });
    }
}
