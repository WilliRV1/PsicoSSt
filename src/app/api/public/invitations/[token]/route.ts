import { NextRequest, NextResponse } from "next/server";
import { extractRequestMeta } from "@/lib/auth/audit";
import { enforcePublicRateLimit } from "@/lib/security/public-guard";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";

/**
 * Ruta pública (sin auth()): la autorización es el propio token de la URL,
 * validado por hash dentro del servicio. Ver app/src/proxy.ts, que deja
 * pasar /api/public/* sin exigir cookie de sesión.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const limited = enforcePublicRateLimit("view", extractRequestMeta(request).ipAddress);
    if (limited) return limited;

    try {
        const { token } = await params;
        const view = await AssessmentInvitationService.getPublicView(token);
        return NextResponse.json(view);
    } catch (error: unknown) {
        console.error("[PUBLIC_INVITATIONS] GET error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
