import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildIndividualData } from "@/lib/reports/individual-data";
import { compileTypstPdf } from "@/lib/reports/typst";

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

    try {
        const pdf = await compileTypstPdf("individual.typ", built.data, built.assets);

        // En modo anónimo el nombre del archivo no puede identificar al
        // trabajador: es justamente lo que el modo intenta evitar.
        const filename = isAnonymous
            ? `Informe_anonimo_${id.slice(0, 8)}.pdf`
            : `Informe_individual_${built.data.worker.document.replace(/\W+/g, "_")}.pdf`;

        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error al generar el informe individual:", error);
        return NextResponse.json({ error: "Error interno al generar el PDF" }, { status: 500 });
    }
}
