import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { fullName, licenseNumber, professionalCard, sstCredential } = body;

        // Validaciones básicas
        if (!fullName || !licenseNumber) {
            return NextResponse.json({ error: "Nombre y Licencia son obligatorios" }, { status: 400 });
        }

        const updated = await prisma.psychologist.update({
            where: { id: session.user.id },
            data: {
                fullName,
                licenseNumber,
                professionalCard,
                sstCredential,
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Perfil actualizado correctamente",
            user: {
                fullName: updated.fullName,
                licenseNumber: updated.licenseNumber
            }
        });
    } catch (error: any) {
        console.error("Error al actualizar perfil:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "El número de licencia ya está registrado por otro profesional" }, { status: 400 });
        }
        return NextResponse.json({ error: "Error interno al actualizar los datos" }, { status: 500 });
    }
}
