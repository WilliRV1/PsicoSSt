import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        let settings = await prisma.psychologistSettings.findUnique({
            where: { psychologistId: session.user.id },
        });

        // Initialize settings if they don't exist
        if (!settings) {
            settings = await prisma.psychologistSettings.create({
                data: {
                    psychologistId: session.user.id,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("GET /api/profile/settings error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();

        // Extract allowed fields
        const {
            logoUrl,
            consultingRoomName,
            tradeName,
            primaryColor,
            secondaryColor,
            address,
            city,
            phone,
            website,
            email,
        } = body;

        const updatedSettings = await prisma.psychologistSettings.upsert({
            where: { psychologistId: session.user.id },
            update: {
                logoUrl,
                consultingRoomName,
                tradeName,
                primaryColor,
                secondaryColor,
                address,
                city,
                phone,
                website,
                email,
            },
            create: {
                psychologistId: session.user.id,
                logoUrl,
                consultingRoomName,
                tradeName,
                primaryColor,
                secondaryColor,
                address,
                city,
                phone,
                website,
                email,
            },
        });

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error("PUT /api/profile/settings error:", error);
        return NextResponse.json({ error: "Error al actualizar las configuraciones" }, { status: 500 });
    }
}
