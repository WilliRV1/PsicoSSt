import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: "Prohibido: Solo puedes borrar tus propias evaluaciones" }, { status: 403 });
    }

    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Evaluación eliminada correctamente" });
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
