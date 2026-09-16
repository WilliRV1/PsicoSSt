import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/resend";
import { assessmentInvitationEmail } from "@/lib/email/templates";
import { clearFailures, getLockoutSeconds, registerFailure } from "@/lib/security/rate-limit";
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
///
/// El bloqueo es POR IP, no por enlace. Contarlo por enlace (como se hacía
/// antes, en las columnas failedIdentifyAttempts/identifyLockedUntil) permitía
/// una denegación de servicio trivial: ocho cédulas inventadas dejaban a toda
/// la empresa sin poder diligenciar durante diez minutos.
const MAX_FAILED_IDENTIFY_ATTEMPTS = 8;
const IDENTIFY_LOCKOUT_MINUTES = 10;
const IDENTIFY_FAILURE_BUCKET = "company-link-identify";

/// La cédula es dato personal (Ley 1581/2012): en la bitácora se guarda solo
/// un prefijo de su hash, suficiente para correlacionar intentos de un mismo
/// atacante sin dejar el documento en claro en una tabla de auditoría.
function documentFingerprint(documentId: string) {
    return crypto.createHash("sha256").update(documentId).digest("hex").slice(0, 12);
}

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

/** Metadatos de la petición pública, necesarios para auditar y limitar por IP. */
export interface RequestMeta {
    ipAddress: string;
    userAgent: string;
    /** Origen del despliegue, para armar la URL del enlace que se reenvía por correo. */
    origin: string;
}

/**
 * `RESOLVED` = se entrega el token al navegador que se identificó.
 * `RESENT_TO_CONTACT` = ya existía una invitación en curso y el enlace se
 * reenvió al canal registrado; el navegador NO recibe token.
 */
export type IdentifyResult =
    | { outcome: "RESOLVED"; invitationToken: string }
    | { outcome: "RESENT_TO_CONTACT" };

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
     *
     * Si ya existe una invitación PENDING, el enlace NO se entrega a quien
     * digitó la cédula: se reenvía al canal de contacto registrado en esa
     * invitación. La cédula la conocen RR.HH. y cualquier jefe, así que
     * devolverle un token válido a quien la escribe equivalía a entregar la
     * evaluación de otra persona y, de paso, a invalidar el enlace que el
     * trabajador legítimo había recibido por correo.
     */
    static async identifyWorker(
        token: string,
        documentId: string,
        meta: RequestMeta
    ): Promise<IdentifyResult> {
        const tokenHash = hashToken(token);
        const link = await prisma.organizationInvitationLink.findUnique({ where: { tokenHash } });

        if (!link || !link.isActive) throw new Error("LINK_NOT_FOUND");

        const auditBase = {
            resourceType: "OrganizationInvitationLink",
            resourceId: link.id,
            userId: link.psychologistId,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        };

        // El bloqueo se cuenta contra la IP y contra este enlace a la vez, de
        // modo que un atacante no puede castigar a la empresa entera ni saltar
        // entre enlaces reutilizando el mismo cupo.
        const failureKey = `${meta.ipAddress}|${link.id}`;
        if (getLockoutSeconds(IDENTIFY_FAILURE_BUCKET, failureKey) > 0) {
            throw new Error("TOO_MANY_ATTEMPTS");
        }

        // Un trabajador archivado conserva su evidencia pero ya no se evalúa; se
        // trata como inexistente para no revelar por la vía del enlace público
        // que esa cédula estuvo registrada en la empresa.
        const worker = await prisma.worker.findFirst({
            where: { organizationId: link.organizationId, documentId, archivedAt: null },
            select: { id: true, jobLevel: true, fullName: true },
        });

        if (!worker) {
            const lockedOut = registerFailure(
                IDENTIFY_FAILURE_BUCKET,
                failureKey,
                MAX_FAILED_IDENTIFY_ATTEMPTS,
                IDENTIFY_LOCKOUT_MINUTES * 60 * 1000
            );
            await logAudit({
                ...auditBase,
                action: lockedOut ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
                metadata: {
                    event: lockedOut
                        ? "SELF_SERVICE_IDENTIFY_IP_LOCKED"
                        : "SELF_SERVICE_IDENTIFY_FAILED",
                    organizationId: link.organizationId,
                    documentFingerprint: documentFingerprint(documentId),
                    lockoutMinutes: lockedOut ? IDENTIFY_LOCKOUT_MINUTES : 0,
                },
            });
            throw new Error(lockedOut ? "TOO_MANY_ATTEMPTS" : "WORKER_NOT_FOUND");
        }

        clearFailures(IDENTIFY_FAILURE_BUCKET, failureKey);

        await logAudit({
            ...auditBase,
            action: "READ",
            metadata: {
                event: "SELF_SERVICE_IDENTIFY_SUCCESS",
                organizationId: link.organizationId,
                workerId: worker.id,
            },
        });

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
            // El token solo se guarda hasheado, así que "reenviar el enlace"
            // obliga a emitir uno nuevo. La diferencia con el comportamiento
            // anterior —y lo que cierra el secuestro— es a dónde va: al correo
            // ya registrado en la invitación, nunca al navegador que digitó la
            // cédula.
            const { token: invitationToken, expiresAt } = await AssessmentInvitationService.rotateAndResend(
                latest.id,
                link.psychologistId,
                RESOLVED_INVITATION_EXPIRY_DAYS
            );

            const contactEmail = latest.contactEmail?.trim();

            await logAudit({
                ...auditBase,
                action: "UPDATE",
                resourceType: "AssessmentInvitation",
                resourceId: latest.id,
                metadata: {
                    event: "INVITATION_TOKEN_ROTATED",
                    reason: "SELF_SERVICE_IDENTIFY_ON_PENDING",
                    workerId: worker.id,
                    deliveredToRegisteredContact: !!contactEmail,
                },
            });

            if (contactEmail) {
                const psychologist = await prisma.psychologist.findUnique({
                    where: { id: link.psychologistId },
                    select: { fullName: true },
                });
                const template = assessmentInvitationEmail(
                    worker.fullName,
                    psychologist?.fullName ?? "Tu psicólogo(a)",
                    `${meta.origin}/e/${invitationToken}`,
                    expiresAt
                );
                sendEmail({ to: contactEmail, ...template }).catch((err) =>
                    console.error("[COMPANY_LINK] Resend email failed:", err)
                );

                await logAudit({
                    ...auditBase,
                    action: "UPDATE",
                    resourceType: "AssessmentInvitation",
                    resourceId: latest.id,
                    metadata: {
                        event: "INVITATION_RESENT_TO_CONTACT",
                        workerId: worker.id,
                    },
                });

                // La pantalla nunca ve el correo: revelarlo, aunque sea
                // enmascarado, le confirmaría a un tercero que esa cédula
                // existe y a qué buzón está asociada.
                return { outcome: "RESENT_TO_CONTACT" };
            }

            // Sin correo registrado no hay canal al cual reenviar. Esto solo
            // ocurre con invitaciones nacidas del propio enlace de empresa
            // (contactEmail queda vacío), cuyo token jamás salió del navegador
            // del trabajador: bloquear aquí dejaría sin salida a quien
            // simplemente cerró la pestaña a mitad de la batería. Se continúa,
            // pero queda registrado como entrega directa.
            await logAudit({
                ...auditBase,
                action: "UPDATE",
                resourceType: "AssessmentInvitation",
                resourceId: latest.id,
                metadata: {
                    event: "SELF_SERVICE_TOKEN_DELIVERED_NO_CONTACT",
                    workerId: worker.id,
                },
            });
            return { outcome: "RESOLVED", invitationToken };
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

        await logAudit({
            ...auditBase,
            action: "CREATE",
            resourceType: "AssessmentInvitation",
            resourceId: created.id,
            metadata: {
                event: "SELF_SERVICE_INVITATION_CREATED",
                workerId: worker.id,
                formType,
            },
        });

        return { outcome: "RESOLVED", invitationToken: created.token };
    }
}
