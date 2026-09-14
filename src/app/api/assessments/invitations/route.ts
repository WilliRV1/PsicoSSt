import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";
import { sendEmail } from "@/lib/email/resend";
import { assessmentInvitationEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { workerId, formType, plannedTypes, contactEmail } = data;

        if (!workerId || !formType || !Array.isArray(plannedTypes) || plannedTypes.length === 0 || !contactEmail) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        // El trabajador debe pertenecer a una organización de este psicólogo
        // — mismo alcance que ya aplica el resto del dashboard.
        const worker = await prisma.worker.findFirst({
            where: { id: workerId, organization: { createdByPsychologist: session.user.id } },
            select: { id: true, fullName: true, organizationId: true },
        });

        if (!worker) {
            return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
        }

        const { id, token, expiresAt } = await AssessmentInvitationService.create({
            psychologistId: session.user.id,
            workerId: worker.id,
            organizationId: worker.organizationId,
            formType,
            plannedTypes,
            contactEmail,
        });

        // Dominio real desde el que opera el psicólogo: APP_URL no está
        // configurada en Vercel y el enlace saldría apuntando a localhost.
        const url = `${request.nextUrl.origin}/e/${token}`;

        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { fullName: true },
        });

        const template = assessmentInvitationEmail(worker.fullName, psychologist?.fullName ?? "Tu psicólogo(a)", url, expiresAt);
        sendEmail({ to: contactEmail, ...template }).catch((err) =>
            console.error("[INVITATIONS] Email send failed:", err)
        );

        return NextResponse.json({ id, url, expiresAt });
    } catch (error: any) {
        console.error("[INVITATIONS] POST error:", error);
        return NextResponse.json({ error: "Error técnico al crear la invitación" }, { status: 500 });
    }
}
