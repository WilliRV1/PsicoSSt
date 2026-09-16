import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AssessmentService } from "@/lib/services/assessment-service";
import { consumeUnit, refundUnit } from "@/lib/entitlements";
import { FormType, QuestionnaireType, ItemResponses } from "@/types/battery";
import { INSTRUMENT_IDS, getInstrument, sortByOrder } from "@/config/instruments";

const DEFAULT_EXPIRY_DAYS = 7;

/// Orden fijo en que el trabajador diligencia los instrumentos, independiente
/// del orden en que el psicólogo los haya marcado al crear la invitación.
const QUESTIONNAIRE_ORDER: QuestionnaireType[] = sortByOrder(INSTRUMENT_IDS);

function generateToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    return { token, tokenHash };
}

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function assessmentIdField(type: QuestionnaireType) {
    return getInstrument(type).invitationColumn;
}

export interface PublicInvitationView {
    workerFullName: string;
    organizationName: string;
    psychologistFullName: string;
    formType: FormType;
    plannedTypes: QuestionnaireType[];
    doneTypes: QuestionnaireType[];
    effectiveStatus: "PENDING" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NOT_FOUND";
    sociodemographicsCompleted: boolean;
}

export class AssessmentInvitationService {
    /**
     * Crea la invitación y devuelve el token EN CLARO — es la única vez que
     * existe fuera de la memoria del navegador del trabajador. Solo se
     * persiste su hash.
     */
    static async create(data: {
        psychologistId: string;
        workerId: string;
        organizationId: string;
        formType: FormType;
        plannedTypes: QuestionnaireType[];
        contactEmail: string;
        expiresInDays?: number;
    }): Promise<{ id: string; token: string; expiresAt: Date }> {
        const { token, tokenHash } = generateToken();
        const expiresAt = new Date(
            Date.now() + (data.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000
        );

        const invitation = await prisma.assessmentInvitation.create({
            data: {
                workerId: data.workerId,
                psychologistId: data.psychologistId,
                organizationId: data.organizationId,
                formType: data.formType,
                plannedTypes: data.plannedTypes,
                tokenHash,
                expiresAt,
                contactEmail: data.contactEmail,
            },
        });

        return { id: invitation.id, token, expiresAt };
    }

    static async getPublicView(token: string): Promise<PublicInvitationView> {
        const tokenHash = hashToken(token);
        const invitation = await prisma.assessmentInvitation.findUnique({
            where: { tokenHash },
            include: {
                worker: { select: { fullName: true, sociodemographicsCompletedAt: true } },
                organization: { select: { name: true } },
                psychologist: { select: { fullName: true } },
            },
        });

        if (!invitation) {
            return {
                workerFullName: "",
                organizationName: "",
                psychologistFullName: "",
                formType: "A",
                plannedTypes: [],
                doneTypes: [],
                effectiveStatus: "NOT_FOUND",
                sociodemographicsCompleted: false,
            };
        }

        const doneTypes = QUESTIONNAIRE_ORDER.filter(
            (t) => invitation.plannedTypes.includes(t) && invitation[assessmentIdField(t)] != null
        );

        let effectiveStatus: PublicInvitationView["effectiveStatus"] = invitation.status;
        if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
            effectiveStatus = "EXPIRED";
        }

        return {
            workerFullName: invitation.worker.fullName,
            organizationName: invitation.organization.name,
            psychologistFullName: invitation.psychologist.fullName,
            formType: invitation.formType,
            plannedTypes: invitation.plannedTypes as QuestionnaireType[],
            doneTypes,
            effectiveStatus,
            sociodemographicsCompleted: invitation.worker.sociodemographicsCompletedAt != null,
        };
    }

    /**
     * Resuelve el workerId dueño de un token de invitación — usado por la
     * ruta pública de sociodemográficos, que no tiene sesión autenticada.
     */
    static async resolveWorkerId(token: string): Promise<string> {
        const tokenHash = hashToken(token);
        const invitation = await prisma.assessmentInvitation.findUnique({
            where: { tokenHash },
            select: { workerId: true, status: true, expiresAt: true },
        });
        if (!invitation) throw new Error("INVITATION_NOT_FOUND");
        if (invitation.status === "CANCELLED") throw new Error("INVITATION_CANCELLED");
        if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
            throw new Error("INVITATION_EXPIRED");
        }
        return invitation.workerId;
    }

    /**
     * Completa un tipo de cuestionario de la invitación: consume crédito
     * (solo si es el primero en 3 meses para ese trabajador, vía la regla ya
     * existente de CreditService), crea el Assessment real invocando
     * AssessmentService.createAssessment sin modificarla, y deja el
     * checkpoint en la invitación. Idempotente ante reenvíos accidentales.
     */
    static async submitSection(
        token: string,
        questionnaireType: QuestionnaireType,
        payload: {
            consentGranted: boolean;
            consentSignature?: string;
            hasCustomerInteraction?: boolean;
            hasPeopleInCharge?: boolean;
            responses: ItemResponses;
        }
    ): Promise<{ allDone: boolean }> {
        const tokenHash = hashToken(token);
        const invitation = await prisma.assessmentInvitation.findUnique({ where: { tokenHash } });

        if (!invitation) throw new Error("INVITATION_NOT_FOUND");
        if (invitation.status === "CANCELLED") throw new Error("INVITATION_CANCELLED");
        if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
            throw new Error("INVITATION_EXPIRED");
        }
        if (!invitation.plannedTypes.includes(questionnaireType)) {
            throw new Error("QUESTIONNAIRE_NOT_PLANNED");
        }

        const field = assessmentIdField(questionnaireType);

        if (invitation[field]) {
            const allDone = invitation.plannedTypes.every((t) => !!invitation[assessmentIdField(t as QuestionnaireType)]);
            return { allDone };
        }

        if (!payload.consentGranted) throw new Error("CONSENT_REQUIRED");

        // La UI nunca deja avanzar sin firma dibujada — si esto llega vacío
        // o con forma inválida, es una llamada directa a la API saltándose
        // la pantalla de consentimiento, no un trabajador real firmando.
        if (
            !payload.consentSignature ||
            !payload.consentSignature.startsWith("data:image/png;base64,") ||
            payload.consentSignature.length < 100
        ) {
            throw new Error("SIGNATURE_REQUIRED");
        }

        const { consumed: unitConsumed } = await consumeUnit(invitation.psychologistId, {
            workerId: invitation.workerId,
            questionnaireType,
        });

        let assessmentId: string;
        try {
            const result = await AssessmentService.createAssessment({
                workerId: invitation.workerId,
                psychologistId: invitation.psychologistId,
                companyId: invitation.organizationId,
                formType: invitation.formType,
                questionnaireType,
                assessmentDate: new Date(),
                responses: payload.responses,
                hasCustomerInteraction: payload.hasCustomerInteraction,
                hasPeopleInCharge: payload.hasPeopleInCharge,
                inputMethod: "SELF_SERVICE",
                informedConsent: {
                    consentGranted: true,
                    consentMethod: "DIGITAL",
                    consentText:
                        "El trabajador aceptó digitalmente el consentimiento informado " +
                        "presentado antes de diligenciar este cuestionario, vía enlace " +
                        "remoto enviado por su psicólogo(a) tratante.",
                    consentSignature: payload.consentSignature,
                },
            });
            assessmentId = result.id;
        } catch (err) {
            if (unitConsumed) {
                await refundUnit(invitation.psychologistId, {
                    workerId: invitation.workerId,
                    questionnaireType,
                    reason: "Error al guardar el cuestionario diligenciado por el trabajador",
                }).catch((e) => console.error("[INVITATIONS] Refund failed:", e));
            }
            throw err;
        }

        await prisma.assessmentInvitation.update({
            where: { id: invitation.id },
            data: { [field]: assessmentId },
        });

        // Se recalcula `allDone` releyendo la fila DESPUÉS de escribir, no
        // con el `invitation` cargado al inicio de la función: si dos
        // secciones distintas se envían casi al mismo tiempo, ambas parten
        // de una foto vieja donde la otra todavía aparece pendiente y
        // ninguna de las dos marcaría status=COMPLETED aunque las tres ya
        // hayan quedado guardadas. Releer cierra esa ventana de carrera.
        const fresh = await prisma.assessmentInvitation.findUnique({ where: { id: invitation.id } });
        const allDone = !!fresh && invitation.plannedTypes.every(
            (t) => !!fresh[assessmentIdField(t as QuestionnaireType)]
        );

        if (allDone && fresh!.status === "PENDING") {
            await prisma.assessmentInvitation.update({
                where: { id: invitation.id },
                data: { status: "COMPLETED", completedAt: new Date() },
            });
        }

        return { allDone };
    }

    static async cancel(id: string, psychologistId: string): Promise<void> {
        const invitation = await prisma.assessmentInvitation.findFirst({ where: { id, psychologistId } });
        if (!invitation) throw new Error("NOT_FOUND");
        await prisma.assessmentInvitation.update({
            where: { id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
        });
    }

    /**
     * Rota el token (el anterior queda inválido de inmediato, porque solo se
     * guarda el hash) y devuelve el nuevo en claro para reenviar el correo.
     */
    static async rotateAndResend(
        id: string,
        psychologistId: string,
        expiresInDays = DEFAULT_EXPIRY_DAYS
    ): Promise<{ token: string; expiresAt: Date; workerId: string; contactEmail: string }> {
        const invitation = await prisma.assessmentInvitation.findFirst({ where: { id, psychologistId } });
        if (!invitation) throw new Error("NOT_FOUND");
        if (invitation.status !== "PENDING") throw new Error("NOT_PENDING");

        const { token, tokenHash } = generateToken();
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

        await prisma.assessmentInvitation.update({
            where: { id },
            data: { tokenHash, expiresAt },
        });

        return { token, expiresAt, workerId: invitation.workerId, contactEmail: invitation.contactEmail };
    }
}
