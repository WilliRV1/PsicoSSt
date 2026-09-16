import { prisma } from "@/lib/prisma";
import type { Subscription } from "@/generated/prisma/client";
import { PLANS, type PlanId } from "@/config/plans";
import { SubscriptionService, type SubscriptionFeatures } from "@/lib/services/subscription-service";

/**
 * Única puerta de derechos de uso.
 *
 * Toda ruta que crea, invita, importa, firma o abre una empresa pasa por
 * `assertCan`; todo consumo de cupo pasa por `consumeUnit`. Antes cada ruta
 * consultaba el saldo por su cuenta y la ventana comercial de tres meses
 * vivía copiada en dos servicios.
 */

export type EntitlementAction =
    | "CREATE_ASSESSMENT"
    | "INVITE"
    | "IMPORT"
    | "CREATE_ORG"
    | "USE_CLIMA"
    | "SIGN_REPORT";

/** Familia de instrumento a efectos de cupo y cadencia. */
export type UnitFamily = "BATTERY" | "CLIMA";

export function familyOf(questionnaireType: string): UnitFamily {
    return questionnaireType === "CLIMA" ? "CLIMA" : "BATTERY";
}

export class EntitlementError extends Error {
    constructor(
        readonly code:
            | "NO_SUBSCRIPTION"
            | "SUBSCRIPTION_EXPIRED"
            | "ORG_LIMIT_REACHED"
            | "PLAN_REQUIRED"
            | "DRAFT_PLAN_CANNOT_SIGN"
            | "INSUFFICIENT_UNITS",
        message: string,
        readonly status: 402 | 403 = 402
    ) {
        super(message);
        this.name = "EntitlementError";
    }
}

export interface Entitlements {
    plan: PlanId;
    status: Subscription["status"];
    periodEnd: Date;
    /** Escritura permitida: suscripción vigente. La lectura nunca se bloquea (custodia legal). */
    writable: boolean;
    unitsAvailable: number;
    orgLimit: number | null;
    orgCount: number;
    canCreateOrg: boolean;
    draftReports: boolean;
    features: SubscriptionFeatures;
}

export async function getEntitlements(psychologistId: string): Promise<Entitlements | null> {
    const [sub, psych, orgCount] = await Promise.all([
        SubscriptionService.getCurrent(psychologistId),
        prisma.psychologist.findUnique({ where: { id: psychologistId }, select: { creditBalance: true } }),
        prisma.organization.count({ where: { createdByPsychologist: psychologistId } }),
    ]);
    if (!sub || !psych) return null;

    const plan = PLANS[sub.plan];
    const now = new Date();
    const writable = (sub.status === "TRIAL" || sub.status === "ACTIVE") && sub.periodEnd > now;
    const features = (sub.features as SubscriptionFeatures | null) ?? {};

    return {
        plan: sub.plan,
        status: sub.status,
        periodEnd: sub.periodEnd,
        writable,
        unitsAvailable: Math.max(0, psych.creditBalance),
        orgLimit: plan.orgLimit,
        orgCount,
        canCreateOrg: writable && (plan.orgLimit === null || orgCount < plan.orgLimit),
        draftReports: plan.draftReports,
        features,
    };
}

export function hasFeature(entitlements: Entitlements, feature: string, now: Date = new Date()): boolean {
    const until = entitlements.features[feature];
    return !!until && new Date(until) > now;
}

/**
 * Lanza `EntitlementError` si la acción no está permitida. Devuelve los
 * derechos para que la ruta no tenga que volver a consultarlos.
 */
export async function assertCan(psychologistId: string, action: EntitlementAction): Promise<Entitlements> {
    const e = await getEntitlements(psychologistId);
    if (!e) {
        throw new EntitlementError("NO_SUBSCRIPTION", "Tu cuenta no tiene un plan activo.");
    }
    if (!e.writable) {
        throw new EntitlementError(
            "SUBSCRIPTION_EXPIRED",
            "Tu plan venció. Puedes seguir consultando y descargando tus informes; para crear o evaluar, renueva el plan."
        );
    }

    switch (action) {
        case "CREATE_ORG":
            if (!e.canCreateOrg) {
                throw new EntitlementError(
                    "ORG_LIMIT_REACHED",
                    `El plan ${PLANS[e.plan].name} permite ${e.orgLimit} empresa activa. Pasa a Profesional para gestionar más.`
                );
            }
            break;
        case "IMPORT":
        case "USE_CLIMA":
            if (e.plan !== "PROFESIONAL") {
                throw new EntitlementError("PLAN_REQUIRED", "Esta función está disponible en el plan Profesional.");
            }
            break;
        case "SIGN_REPORT":
            if (e.draftReports) {
                throw new EntitlementError(
                    "DRAFT_PLAN_CANNOT_SIGN",
                    "Los informes del plan Residente son borradores sin valor probatorio y no se firman. Pasa a Profesional para firmar.",
                    403
                );
            }
            break;
        case "CREATE_ASSESSMENT":
        case "INVITE":
            break;
    }
    return e;
}

/**
 * Consume UNA unidad por trabajador, familia de instrumento y periodo de
 * suscripción. Los demás cuestionarios del mismo trabajador en el mismo
 * periodo no cuestan. Reemplaza la ventana comercial de tres meses, que no
 * correspondía a ninguna cadencia legal.
 *
 * Atómico: la comprobación y el descuento van en la misma transacción para
 * que dos secciones enviadas a la vez no consuman dos unidades.
 */
export async function consumeUnit(
    psychologistId: string,
    params: { workerId: string; questionnaireType: string; assessmentId?: string }
): Promise<{ consumed: boolean }> {
    const family = familyOf(params.questionnaireType);

    return prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({ where: { psychologistId } });
        if (!sub) throw new EntitlementError("NO_SUBSCRIPTION", "Tu cuenta no tiene un plan activo.");
        const now = new Date();
        if (!((sub.status === "TRIAL" || sub.status === "ACTIVE") && sub.periodEnd > now)) {
            throw new EntitlementError("SUBSCRIPTION_EXPIRED", "Tu plan venció. Renueva para seguir evaluando.");
        }

        const already = await tx.creditTransaction.count({
            where: {
                psychologistId,
                type: "CONSUMPTION",
                workerId: params.workerId,
                unitFamily: family,
                createdAt: { gte: sub.periodStart, lte: sub.periodEnd },
            },
        });
        if (already > 0) return { consumed: false };

        const psych = await tx.psychologist.findUnique({
            where: { id: psychologistId },
            select: { creditBalance: true },
        });
        if (!psych || psych.creditBalance < 1) {
            throw new EntitlementError(
                "INSUFFICIENT_UNITS",
                "Agotaste los trabajadores gestionados de tu plan. Compra unidades adicionales o renueva."
            );
        }

        const updated = await tx.psychologist.update({
            where: { id: psychologistId },
            data: { creditBalance: { decrement: 1 } },
            select: { creditBalance: true },
        });

        await tx.creditTransaction.create({
            data: {
                psychologistId,
                type: "CONSUMPTION",
                amount: -1,
                balanceAfter: updated.creditBalance,
                workerId: params.workerId,
                unitFamily: family,
                assessmentId: params.assessmentId,
                description:
                    family === "CLIMA"
                        ? "Trabajador gestionado · clima organizacional"
                        : "Trabajador gestionado · batería de riesgo psicosocial",
            },
        });

        return { consumed: true };
    });
}

/** Deshace el consumo cuando la evaluación no pudo crearse. */
export async function refundUnit(psychologistId: string, params: { workerId: string; questionnaireType: string; reason: string }): Promise<void> {
    const family = familyOf(params.questionnaireType);
    await prisma.$transaction(async (tx) => {
        // Se borra el asiento de consumo en vez de sumar uno de reembolso: si
        // quedara el CONSUMPTION, el siguiente intento del mismo trabajador
        // saldría gratis por «ya consumido en el periodo» y el reembolso se
        // convertiría en una unidad regalada.
        const last = await tx.creditTransaction.findFirst({
            where: { psychologistId, type: "CONSUMPTION", workerId: params.workerId, unitFamily: family },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });
        if (!last) return;
        await tx.creditTransaction.delete({ where: { id: last.id } });
        const psych = await tx.psychologist.update({
            where: { id: psychologistId },
            data: { creditBalance: { increment: 1 } },
            select: { creditBalance: true },
        });
        await tx.creditTransaction.create({
            data: {
                psychologistId,
                type: "REFUND",
                amount: 0,
                balanceAfter: psych.creditBalance,
                description: `Consumo anulado: ${params.reason}`,
            },
        });
    });
}
