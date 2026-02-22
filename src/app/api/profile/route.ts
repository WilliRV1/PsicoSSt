import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const psych = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                licenseNumber: true,
                professionalCard: true,
                sstCredential: true,
                signature: true,
                status: true,
                isAdmin: true
            }
        });

        if (!psych) {
            return NextResponse.json({ error: "Psychologist not found" }, { status: 404 });
        }

        return NextResponse.json(psych);
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Update only safe fields
        const updated = await prisma.psychologist.update({
            where: { id: session.user.id },
            data: {
                fullName: body.fullName,
                licenseNumber: body.licenseNumber,
                professionalCard: body.professionalCard,
                sstCredential: body.sstCredential,
                signature: body.signature // Base64 string
            }
        });

        return NextResponse.json({
            success: true,
            message: "Perfil actualizado correctamente"
        });
    } catch (error) {
        console.error("Profile PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
