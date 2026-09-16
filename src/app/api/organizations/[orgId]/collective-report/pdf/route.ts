import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractRequestMeta, logAudit } from "@/lib/auth/audit";
import { buildCollectiveData, type CollectiveVariant } from "@/lib/reports/collective-data";
import { compileTypstPdf } from "@/lib/reports/typst";

export const runtime = "nodejs";
// Puede llamar a un modelo para la lectura consultiva antes de componer el PDF.
export const maxDuration = 120;

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orgId } = await params;
    const variant: CollectiveVariant =
        req.nextUrl.searchParams.get("type") === "technical" ? "technical" : "executive";

    const built = await buildCollectiveData(orgId, session.user.id, !!session.user.isAdmin, variant);
    if (!built) {
        return NextResponse.json(
            { error: "No hay evaluaciones calificadas para esta organización, o no tienes acceso" },
            { status: 404 }
        );
    }

    try {
        const pdf = await compileTypstPdf("collective.typ", built.data, built.assets);
        const slug = built.data.org.name.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40);

        const { ipAddress, userAgent } = extractRequestMeta(req);
        await logAudit({
            userId: session.user.id,
            action: "READ",
            resourceType: "collective_report",
            resourceId: orgId,
            // El informe colectivo es agregado y nunca nombra trabajadores.
            metadata: { viaAdmin: built.viaAdmin, anonymized: true, variant },
            ipAddress,
            userAgent,
        });

        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Informe_colectivo_${variant}_${slug}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error al generar el informe colectivo:", error);
        return NextResponse.json({ error: "Error interno al generar el PDF" }, { status: 500 });
    }
}
