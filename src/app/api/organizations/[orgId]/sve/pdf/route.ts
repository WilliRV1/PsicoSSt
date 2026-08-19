import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSVEData } from "@/lib/reports/sve-data";
import { compileTypstPdf, TypstCompileError } from "@/lib/reports/typst";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Typst compilation of a ~26 page document takes a few hundred ms, but cold
// starts also pay for font indexing.
export const maxDuration = 60;

/** Strips characters that would break the Content-Disposition header. */
function safeSlug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "organizacion";
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const built = await buildSVEData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return NextResponse.json(
            { error: "Organización no encontrada, sin acceso, o sin evaluaciones completadas." },
            { status: 404 }
        );
    }

    const { data, assets } = built;

    try {
        const pdf = await compileTypstPdf("sve.typ", data, assets);
        const filename = `Programa_SVE_${safeSlug(data.org.nit)}.pdf`;

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
            console.error("[SVE] Typst compile failed:", error.diagnostics);
            return NextResponse.json(
                { error: "No se pudo generar el documento.", detail: error.message },
                { status: 500 }
            );
        }
        console.error("[SVE] Unexpected error generating PDF:", error);
        return NextResponse.json({ error: "No se pudo generar el documento." }, { status: 500 });
    }
}
