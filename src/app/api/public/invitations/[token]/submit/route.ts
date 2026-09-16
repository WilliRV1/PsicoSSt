import { NextRequest, NextResponse } from "next/server";
import { extractRequestMeta } from "@/lib/auth/audit";
import { enforcePublicRateLimit } from "@/lib/security/public-guard";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";
import { EntitlementError } from "@/lib/entitlements";
import { QuestionnaireType } from "@/types/battery";
import { getErrorMessage } from "@/lib/utils";

const ERROR_STATUS: Record<string, number> = {
    INVITATION_NOT_FOUND: 404,
    INVITATION_CANCELLED: 410,
    INVITATION_EXPIRED: 410,
    QUESTIONNAIRE_NOT_PLANNED: 400,
    CONSENT_REQUIRED: 400,
    SIGNATURE_REQUIRED: 400,
    INSUFFICIENT_UNITS: 402,
    NO_SUBSCRIPTION: 402,
    SUBSCRIPTION_EXPIRED: 402,
};

const ERROR_MESSAGE: Record<string, string> = {
    INVITATION_NOT_FOUND: "Este enlace no es válido.",
    INVITATION_CANCELLED: "Este enlace fue cancelado.",
    INVITATION_EXPIRED: "Este enlace venció. Pide a tu psicólogo(a) que te envíe uno nuevo.",
    QUESTIONNAIRE_NOT_PLANNED: "Este cuestionario no hace parte de tu invitación.",
    CONSENT_REQUIRED: "Debes aceptar el consentimiento informado para continuar.",
    SIGNATURE_REQUIRED: "Debes firmar el consentimiento antes de continuar.",
    // Al trabajador nunca se le explica el estado comercial de la cuenta del
    // psicólogo: sólo que debe contactarlo.
    INSUFFICIENT_UNITS: "Tu psicólogo(a) no puede recibir esta evaluación en este momento. Contáctalo(a) directamente.",
    NO_SUBSCRIPTION: "Tu psicólogo(a) no puede recibir esta evaluación en este momento. Contáctalo(a) directamente.",
    SUBSCRIPTION_EXPIRED: "Tu psicólogo(a) no puede recibir esta evaluación en este momento. Contáctalo(a) directamente.",
};

/**
 * Ruta pública (sin auth()): autorización por hash del token. La respuesta
 * NUNCA incluye el puntaje/resultado calculado — el trabajador no debe ver
 * su propio nivel de riesgo (Res. 2764/2022, custodia exclusiva del
 * psicólogo).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const limited = enforcePublicRateLimit("write", extractRequestMeta(request).ipAddress);
    if (limited) return limited;

    try {
        const { token } = await params;
        const body = await request.json();

        const questionnaireType = body.questionnaireType as QuestionnaireType;
        if (!questionnaireType || !body.responses) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        const { allDone } = await AssessmentInvitationService.submitSection(token, questionnaireType, {
            consentGranted: body.consentGranted === true,
            consentSignature: body.consentSignature,
            hasCustomerInteraction: body.hasCustomerInteraction,
            hasPeopleInCharge: body.hasPeopleInCharge,
            responses: body.responses,
        });

        return NextResponse.json({ allDone });
    } catch (error: unknown) {
        // Los errores de negocio del servicio viajan como `Error(CODE)`; los de
        // derechos de uso traen el código en una propiedad y un mensaje pensado
        // para el psicólogo, que aquí NO se le muestra al trabajador.
        const code = error instanceof EntitlementError ? error.code : getErrorMessage(error);
        const status = ERROR_STATUS[code] ?? 500;
        const message = ERROR_MESSAGE[code] ?? "Error técnico al guardar tus respuestas.";
        if (status === 500) console.error("[PUBLIC_INVITATIONS] submit error:", error);
        return NextResponse.json({ error: message, code }, { status });
    }
}
