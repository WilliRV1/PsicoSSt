import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";

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
      select: {
        id: true,
        psychologistId: true,
        workerId: true,
        organizationId: true,
        questionnaireType: true,
        formType: true,
        generatedReports: {
          select: { isFinalized: true, status: true },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: "Prohibido: Solo puedes borrar tus propias evaluaciones" }, { status: 403 });
    }

    // Un informe firmado es un documento profesional y no debe poder borrarse
    // desde la interfaz. Los borradores sí se eliminan junto con la prueba,
    // evitando que su FK bloquee el borrado de evaluaciones de prueba.
    const hasFinalReport = assessment.generatedReports.some(
      report => report.isFinalized || report.status === "SIGNED" || report.status === "DELIVERED"
    );
    if (hasFinalReport) {
      return NextResponse.json(
        { error: "No se puede eliminar una evaluación con informe firmado o entregado." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.generatedReport.deleteMany({ where: { assessmentId: id } });
      // response_sets, scored_results e informed_consents usan onDelete: Cascade.
      await tx.assessment.delete({ where: { id } });
    });

    const { ipAddress, userAgent } = extractRequestMeta(req);
    try {
      await logAudit({
        userId: session.user.id,
        action: "DELETE",
        resourceType: "assessment",
        resourceId: id,
        metadata: {
          workerId: assessment.workerId,
          organizationId: assessment.organizationId,
          questionnaireType: assessment.questionnaireType,
          formType: assessment.formType,
        },
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      // La prueba ya fue eliminada; no reportar un falso fallo al usuario si
      // sólo falló el registro de auditoría.
      console.error("Error registrando auditoría de eliminación:", auditError);
    }

    return NextResponse.json({ success: true, message: "Evaluación eliminada correctamente" });
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { AssessmentService } from "@/lib/services/assessment-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (!data.responses) {
      return NextResponse.json({ error: "Faltan respuestas requeridas" }, { status: 400 });
    }

    const result = await AssessmentService.updateAssessment(
      id,
      session.user.id,
      data.responses
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error actualizando evaluación:", error);
    return NextResponse.json({ 
      error: `Error al actualizar: ${error.message}`, 
      details: error.message 
    }, { status: 500 });
  }
}
