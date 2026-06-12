import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
        }

        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true },
        });

        if (!psychologist) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, psychologist.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { passwordHash: newHash },
        });

        return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
