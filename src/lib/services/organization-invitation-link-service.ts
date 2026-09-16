import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AssessmentInvitationService, assessmentIdField } from "@/lib/services/assessment-invitation-service";
import { FormType, QuestionnaireType } from "@/types/battery";

const RESOLVED_INVITATION_EXPIRY_DAYS = 3;

/// Misma ventana que CreditService.consumeCreditForAssessment usa para
/// decidir si a un trabajador ya le toca una evaluación nueva. Se reutiliza
/// aquí para que "cuándo se puede repetir la prueba" sea una sola regla de
/// negocio y no dos que puedan desincronizarse.
const REEVALUATION_WINDOW_MONTHS = 3;

/// El enlace de empresa se comparte ampliamente (cartelera, WhatsApp) y solo
/// pide una cédula — sin límite de intentos, cualquiera podía probar
/// documentos hasta acertar uno real y tomar la evaluación de otra persona.
const MAX_FAILED_IDENTIFY_ATTEMPTS = 8;
const IDENTIFY_LOCKOUT_MINUTES = 10;

/// La forma A/B es propia de cada trabajador (elegida por el psicólogo al
/// registrarlo, codificada en jobLevel — ver comentario en dashboard de
/// organizaciones) y NO del enlace de la empresa: una misma empresa puede
/// tener trabajadores en forma A y B a la vez.
function formTypeForJobLevel(jobLevel: string): FormType {
    return jobLevel === "AUXILIAR" || jobLevel === "OPERATIVO" ? "B" : "A";
}

function generateToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    return { token, tokenHash };
}

function hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export interface PublicCompanyLinkView {
    organizationName: string;
    psychologistFullName: string;
    isActive: boolean;
}

/**
 * Enlace único por empresa: el psicólogo lo genera una vez y lo comparte con
 * toda la organización (cartelera, WhatsApp, correo grupal). Cada trabajador
 * se identifica con su cédula al entrar — no hay token individual previo.
 */
export class OrganizationInvitationLinkService {
    /**
     * Crea un enlace nuevo para la organización y revoca cualquier enlace
     * activo anterior de esa misma organización (un solo enlace vigente a la
     * vez, como se decidió con el psicólogo).
     */
    static async create(data: {
        psychologistId: string;
        organizationId: string;
        formType: FormType;
        plannedTypes: QuestionnaireType[];
    }): Promise<{ id: string; token: string }> {
        const { token, tokenHash } = generateToken();

        const link = await prisma.$transaction(async (tx) => {
            await tx.organizationInvitationLink.updateMany({
                where: { organizationId: data.organizationId, isActive: true },
                data: { isActive: false, revokedAt: new Date() },
            });

            return tx.organizationInvitationLink.create({
                data: {
                    organizationId: data.organizationId,
                    psychologistId: data.psychologistId,
                    formType: data.formType,
                    plannedTypes: data.plannedTypes,
                    tokenHash,
                },
            });
        });

        return { id: link.id, token };
    }

    static async getActiveForOrganization(organizationId: string, psychologistId: string) {
        return prisma.organizationInvitationLink.findFirst({
            where: { organizationId, psychologistId, isActive: true },
        });
    }

    static async getPublicView(token: string): Promise<PublicCompanyLinkView | null> {
        const tokenHash = hashToken(token);
        const link = await prisma.organizationInvitationLink.findUnique({
            where: { tokenHash },
            include: {
                organization: { select: { name: true } },
                psychologist: { select: { fullName: true } },
            },
        });

        if (!link) return null;

        return {
            organizationName: link.organization.name,
            psychologistFullName: link.psychologist.fullName,
            isActive: link.isActive,
        };
    }

    /**
     * Busca al trabajador por documento dentro de la organización del
     * enlace. Si no existe, falla explícito — el psicólogo debe registrar al
     * trabajador antes (decisión tomada: no se crean trabajadores al vuelo
     * desde el enlace público). Si existe, resuelve o crea su
     * AssessmentInvitation puntual y devuelve un token fresco en claro para
     * continuar con el flujo ya existente de /e/[token].
     *
     * Si el trabajador ya tiene una invitación COMPLETED dentro de la
     * ventana de reevaluación, se rechaza en vez de crear una invitación
     * nueva en silencio — sin este bloqueo, cualquiera que conociera la
     * cédula podía volver a entrar indefinidamente e inyectar respuestas
     * sobre un trabajador real ya evaluado.
     */
    static async identifyWorker(
        token: string,
        documentId: string
    ): Promise<{ invitationToken: string }> {
        const tokenHash = hashToken(token);
        const link = await prisma.organizationInvitationLink.findUnique({ where: { tokenHash } });

        if (!link || !link.isActive) throw new Error("LINK_NOT_FOUND");

        if (link.identifyLockedUntil && link.identifyLockedUntil > new Date()) {
            throw new Error("TOO_MANY_ATTEMPTS");
        }

        const worker = await prisma.worker.findFirst({
            where: { organizationId: link.organizationId, documentId },
            select: { id: true, jobLevel: true },
        });

        if (!worker) {
            const attempts = link.failedIdentifyAttempts + 1;
            const lockedOut = attempts >= MAX_FAILED_IDENTIFY_ATTEMPTS;
            await prisma.organizationInvitationLink.update({
                where: { id: link.id },
                data: lockedOut
                    ? {
                          failedIdentifyAttempts: 0,
                          identifyLockedUntil: new Date(Date.now() + IDENTIFY_LOCKOUT_MINUTES * 60 * 1000),
                      }
                    : { failedIdentifyAttempts: attempts },
            });
            throw new Error(lockedOut ? "TOO_MANY_ATTEMPTS" : "WORKER_NOT_FOUND");
        }

        if (link.failedIdentifyAttempts > 0) {
            await prisma.organizationInvitationLink.update({
                where: { id: link.id },
                data: { failedIdentifyAttempts: 0 },
            });
        }

        const formType = formTypeForJobLevel(worker.jobLevel);

        let latest = await prisma.assessmentInvitation.findFirst({
            where: { workerId: worker.id, organizationId: link.organizationId, status: { in: ["PENDING", "COMPLETED"] } },
            orderBy: { createdAt: "desc" },
        });

        if (latest && latest.status === "PENDING") {
            // Caso borde: las tres secciones ya quedaron guardadas (por una
            // condición de carrera entre dos envíos casi simultáneos) pero
            // el status nunca se promovió a COMPLETED. Se corrige aquí antes
            // de decidir, para que la ventana de reevaluación de abajo sí
            // aplique — si no, esta invitación se seguiría rotando y
            // resolviendo como si estuviera en curso para siempre.
            const trulyDone = latest.plannedTypes.every(
                (t) => !!latest![assessmentIdField(t as QuestionnaireType)]
            );
            if (trulyDone) {
                latest = await prisma.assessmentInvitation.update({
                    where: { id: latest.id },
                    data: { status: "COMPLETED", completedAt: latest.completedAt ?? new Date() },
                });
            }
        }

        if (latest && latest.status === "PENDING") {
            const { token: invitationToken } = await AssessmentInvitationService.rotateAndResend(
                latest.id,
                link.psychologistId,
                RESOLVED_INVITATION_EXPIRY_DAYS
            );
            return { invitationToken };
        }

        if (latest && latest.status === "COMPLETED") {
            const windowStart = new Date();
            windowStart.setMonth(windowStart.getMonth() - REEVALUATION_WINDOW_MONTHS);

            const recentAssessments = await prisma.assessment.count({
                where: { workerId: worker.id, createdAt: { gte: windowStart } },
            });

            if (recentAssessments > 0) {
                throw new Error("ALREADY_COMPLETED");
            }
            // Fuera de la ventana: le toca legítimamente un ciclo nuevo, cae
            // al bloque de abajo y crea una invitación desde cero.
        }

        const created = await AssessmentInvitationService.create({
            psychologistId: link.psychologistId,
            workerId: worker.id,
            organizationId: link.organizationId,
            formType,
            plannedTypes: link.plannedTypes as QuestionnaireType[],
            contactEmail: "",
            expiresInDays: RESOLVED_INVITATION_EXPIRY_DAYS,
        });

        return { invitationToken: created.token };
    }
}
