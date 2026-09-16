import { NextRequest, NextResponse } from "next/server";
import { extractRequestMeta } from "@/lib/auth/audit";
import { enforcePublicRateLimit } from "@/lib/security/public-guard";
import { OrganizationInvitationLinkService } from "@/lib/services/organization-invitation-link-service";

/**
 * Ruta pública (sin auth()): igual que /api/public/invitations, la
 * autorización es el propio token de la URL. Ver app/src/proxy.ts.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const limited = await enforcePublicRateLimit("view", extractRequestMeta(request).ipAddress);
    if (limited) return limited;

    try {
        const { token } = await params;
        const view = await OrganizationInvitationLinkService.getPublicView(token);
        if (!view) {
            return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
        }
        return NextResponse.json(view);
    } catch (error) {
        console.error("[PUBLIC_COMPANY_INVITATIONS] GET error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
