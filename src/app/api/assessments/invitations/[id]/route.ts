import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        if (body.action !== "cancel") {
            return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
        }

        await AssessmentInvitationService.cancel(id, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
        }
        console.error("[INVITATIONS] PATCH error:", error);
        return NextResponse.json({ error: "Error técnico" }, { status: 500 });
    }
}
