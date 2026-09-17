import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const workers = await prisma.worker.findMany({
            where: {
                // Sin este filtro, autenticarse bastaba para leer el padrón de
                // TODOS los psicólogos: el buscador acepta fragmentos, así que
                // iterando letras se barría la base entera. Es el mismo
                // acotamiento que ya tenían `workers/route.ts` y
                // `workers/export/route.ts`; aquí faltaba.
                organization: { createdByPsychologist: session.user.id },
                // El buscador alimenta la selección de trabajador para una
                // evaluación nueva; un archivado no debe poder elegirse.
                archivedAt: null,
                OR: [
                    { documentId: { contains: query, mode: "insensitive" } },
                    { fullName: { contains: query, mode: "insensitive" } }
                ]
            },
            take: 10,
            // Sólo lo que el buscador pinta. Devolver la fila entera exponía
            // fecha de nacimiento, ciudad, contrato y demás sin necesidad.
            select: {
                id: true,
                fullName: true,
                documentType: true,
                documentId: true,
                jobLevel: true,
                organizationId: true,
                organization: { select: { name: true } }
            }
        });

        return NextResponse.json(workers);
    } catch (error) {
        console.error("Search workers error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
