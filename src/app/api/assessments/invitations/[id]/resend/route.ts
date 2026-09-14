import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";
import { sendEmail } from "@/lib/email/resend";
import { assessmentInvitationEmail } from "@/lib/email/templates";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { token, expiresAt, workerId, contactEmail } = await AssessmentInvitationService.rotateAndResend(
            id,
            session.user.id
        );

        // Ver api/assessments/invitations/route.ts: APP_URL no existe en Vercel.
        const url = `${request.nextUrl.origin}/e/${token}`;

        const [worker, psychologist] = await Promise.all([
            prisma.worker.findUnique({ where: { id: workerId }, select: { fullName: true } }),
            prisma.psychologist.findUnique({ where: { id: session.user.id }, select: { fullName: true } }),
        ]);

        const template = assessmentInvitationEmail(
            worker?.fullName ?? "",
            psychologist?.fullName ?? "Tu psicólogo(a)",
            url,
            expiresAt
        );
        sendEmail({ to: contactEmail, ...template }).catch((err) =>
            console.error("[INVITATIONS] Resend email failed:", err)
        );

        return NextResponse.json({ url, expiresAt });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
        }
        if (error.message === "NOT_PENDING") {
            return NextResponse.json({ error: "Esta invitación ya no está pendiente" }, { status: 400 });
        }
        console.error("[INVITATIONS] Resend error:", error);
        return NextResponse.json({ error: "Error técnico" }, { status: 500 });
    }
}
