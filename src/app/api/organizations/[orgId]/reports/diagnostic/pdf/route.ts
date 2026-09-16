import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractRequestMeta, logAudit } from "@/lib/auth/audit";
import { buildDiagnosticData } from "@/lib/reports/diagnostic-data";
import { compileTypstPdf, TypstCompileError } from "@/lib/reports/typst";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeSlug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "organizacion";
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const built = await buildDiagnosticData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return NextResponse.json(
            { error: "Organización no encontrada, sin acceso, o sin evaluaciones calificadas." },
            { status: 404 }
        );
    }

    const { data, assets } = built;

    try {
        const pdf = await compileTypstPdf("diagnostic.typ", data, assets);
        const filename = `Diagnostico_Organizacional_${safeSlug(data.org.nit)}.pdf`;

        const { ipAddress, userAgent } = extractRequestMeta(req);
        await logAudit({
            userId: session.user.id,
            action: "READ",
            resourceType: "diagnostic_report",
            resourceId: orgId,
            // Informe agregado: las áreas bajo el umbral ya salen suprimidas.
            metadata: { viaAdmin: built.viaAdmin, anonymized: true },
            ipAddress,
            userAgent,
        });

        return new NextResponse(new Uint8Array(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": String(pdf.byteLength),
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        if (error instanceof TypstCompileError) {
            console.error("[DIAGNOSTIC] Typst compile failed:", error.diagnostics);
            return NextResponse.json(
                { error: "No se pudo generar el documento.", detail: error.message },
                { status: 500 }
            );
        }
        console.error("[DIAGNOSTIC] Unexpected error generating PDF:", error);
        return NextResponse.json({ error: "No se pudo generar el documento." }, { status: 500 });
    }
}
