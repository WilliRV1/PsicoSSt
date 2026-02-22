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
                OR: [
                    { documentId: { contains: query, mode: "insensitive" } },
                    { fullName: { contains: query, mode: "insensitive" } }
                ]
            },
            take: 10,
            include: {
                organization: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(workers);
    } catch (error) {
        console.error("Search workers error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
