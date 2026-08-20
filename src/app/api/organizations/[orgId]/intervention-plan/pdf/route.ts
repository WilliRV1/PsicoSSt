import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildInterventionData } from "@/lib/reports/intervention-data";
import { compileTypstPdf } from "@/lib/reports/typst";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orgId } = await params;
    const built = await buildInterventionData(orgId, session.user.id, !!session.user.isAdmin);
    if (!built) {
        return NextResponse.json(
            { error: "Esta organización no tiene un plan de intervención, o no tienes acceso" },
            { status: 404 }
        );
    }

    try {
        const pdf = await compileTypstPdf("intervention.typ", built.data, built.assets);
        const slug = built.data.org.name.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40);

        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Plan_intervencion_${slug}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error al generar el plan de intervención:", error);
        return NextResponse.json({ error: "Error interno al generar el PDF" }, { status: 500 });
    }
}
