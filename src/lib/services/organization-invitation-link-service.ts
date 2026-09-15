import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AssessmentInvitationService } from "@/lib/services/assessment-invitation-service";
import { FormType, QuestionnaireType } from "@/types/battery";

const RESOLVED_INVITATION_EXPIRY_DAYS = 3;

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
     */
    static async identifyWorker(
        token: string,
        documentId: string
    ): Promise<{ invitationToken: string }> {
        const tokenHash = hashToken(token);
        const link = await prisma.organizationInvitationLink.findUnique({ where: { tokenHash } });

        if (!link || !link.isActive) throw new Error("LINK_NOT_FOUND");

        const worker = await prisma.worker.findFirst({
            where: { organizationId: link.organizationId, documentId },
            select: { id: true, jobLevel: true },
        });

        if (!worker) throw new Error("WORKER_NOT_FOUND");

        const formType = formTypeForJobLevel(worker.jobLevel);

        const existing = await prisma.assessmentInvitation.findFirst({
            where: { workerId: worker.id, organizationId: link.organizationId, status: "PENDING" },
            orderBy: { createdAt: "desc" },
        });

        if (existing) {
            const { token: invitationToken } = await AssessmentInvitationService.rotateAndResend(
                existing.id,
                link.psychologistId,
                RESOLVED_INVITATION_EXPIRY_DAYS
            );
            return { invitationToken };
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
