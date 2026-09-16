import { NextRequest, NextResponse } from "next/server";
import { extractRequestMeta } from "@/lib/auth/audit";
import { enforcePublicRateLimit } from "@/lib/security/public-guard";
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
    const { ipAddress, userAgent } = extractRequestMeta(request);

    const limited = enforcePublicRateLimit("identify", ipAddress);
    if (limited) return limited;

    try {
        const { token } = await params;
        const body = await request.json();
        const documentId = (body.documentId as string | undefined)?.trim();

        if (!documentId) {
            return NextResponse.json({ error: "Ingresa tu número de cédula." }, { status: 400 });
        }

        const result = await OrganizationInvitationLinkService.identifyWorker(token, documentId, {
            ipAddress,
            userAgent,
            // Ver api/assessments/invitations/route.ts: APP_URL no existe en Vercel.
            origin: request.nextUrl.origin,
        });

        if (result.outcome === "RESENT_TO_CONTACT") {
            return NextResponse.json({
                outcome: "RESENT_TO_CONTACT",
                // Sin el correo ni una versión enmascarada: quien digitó la
                // cédula no tiene por qué saber a qué buzón quedó asociada.
                message:
                    "Ya tienes una evaluación en curso. Te reenviamos el enlace al correo registrado; " +
                    "revisa tu bandeja de entrada y la carpeta de spam. Si no lo recibes, contacta a tu psicólogo(a).",
            });
        }

        return NextResponse.json({ outcome: "RESOLVED", invitationToken: result.invitationToken });
    } catch (error: unknown) {
        const code = getErrorMessage(error);
        const status = ERROR_STATUS[code] ?? 500;
        const message = ERROR_MESSAGE[code] ?? "Error técnico al validar tu documento.";
        if (status === 500) console.error("[PUBLIC_COMPANY_INVITATIONS] identify error:", error);
        return NextResponse.json({ error: message, code }, { status });
    }
}
