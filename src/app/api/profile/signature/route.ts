import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { signatureData, type } = await request.json();

        if (!signatureData) {
            return NextResponse.json({ error: "Datos de firma requeridos" }, { status: 400 });
        }

        // Actualizar o crear la firma del psicólogo
        // Usamos upsert para manejar el registro único por tipo por psicólogo
        await prisma.psychologistSignature.upsert({
            where: {
                psychologistId_signatureType: {
                    psychologistId: session.user.id,
                    signatureType: type || "drawn"
                }
            },
            update: {
                dataUrl: signatureData,
                updatedAt: new Date()
            },
            create: {
                psychologistId: session.user.id,
                signatureType: type || "drawn",
                dataUrl: signatureData
            }
        });

        // También actualizamos el campo legacy 'signature' en el modelo Psychologist
        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { signature: signatureData }
        });

        return NextResponse.json({ success: true, message: "Firma guardada correctamente" });
    } catch (error: any) {
        console.error("Error al guardar firma:", error);
        return NextResponse.json({ error: "Error interno al guardar la firma" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        await prisma.psychologistSignature.deleteMany({
            where: { psychologistId: session.user.id }
        });

        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { signature: null }
        });

        return NextResponse.json({ success: true, message: "Firma eliminada" });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar la firma" }, { status: 500 });
    }
}
