import { NextRequest, NextResponse } from "next/server";
import { OrganizationInvitationLinkService } from "@/lib/services/organization-invitation-link-service";
import { getErrorMessage } from "@/lib/utils";

const ERROR_STATUS: Record<string, number> = {
    LINK_NOT_FOUND: 404,
    WORKER_NOT_FOUND: 404,
    ALREADY_COMPLETED: 409,
    TOO_MANY_ATTEMPTS: 429,
};

const ERROR_MESSAGE: Record<string, string> = {
    LINK_NOT_FOUND: "Este enlace no es válido.",
    WORKER_NOT_FOUND: "Este documento no está registrado en la empresa. Contacta a tu psicólogo(a).",
    ALREADY_COMPLETED: "Ya completaste esta evaluación. Tu psicólogo(a) te avisará cuándo debas repetirla.",
    TOO_MANY_ATTEMPTS: "Demasiados intentos con documentos incorrectos. Espera unos minutos e intenta de nuevo.",
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const body = await request.json();
        const documentId = (body.documentId as string | undefined)?.trim();

        if (!documentId) {
            return NextResponse.json({ error: "Ingresa tu número de cédula." }, { status: 400 });
        }

        const { invitationToken } = await OrganizationInvitationLinkService.identifyWorker(token, documentId);
        return NextResponse.json({ invitationToken });
    } catch (error: unknown) {
        const code = getErrorMessage(error);
        const status = ERROR_STATUS[code] ?? 500;
        const message = ERROR_MESSAGE[code] ?? "Error técnico al validar tu documento.";
        if (status === 500) console.error("[PUBLIC_COMPANY_INVITATIONS] identify error:", error);
        return NextResponse.json({ error: message, code }, { status });
    }
}
