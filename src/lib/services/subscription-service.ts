import { prisma } from "@/lib/prisma";
import type { Prisma, Subscription } from "@/generated/prisma/client";
import { PLANS, TRIAL_DAYS, type BillingPeriod, type PlanId, type Sku } from "@/config/plans";

/**
 * Suscripción del psicólogo.
 *
 * El cupo de cada periodo se otorga como créditos con vencimiento
 * (`CreditTransaction.expiresAt = periodEnd`). Al vencer el periodo, el
 * remanente no consumido se retira con un asiento `QUOTA_EXPIRY` negativo, de
 * modo que `Psychologist.creditBalance` sigue siendo un saldo almacenado y
 * auditable: nunca hay que recomputarlo sumando asientos vigentes.
 *
 * Una sola suscripción por psicólogo en esta entrega (equipos/consultora
 * quedan para después): `Subscription.psychologistId` es único.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_MS);
}

export interface SubscriptionFeatures {
    /** ISO 8601 de vencimiento por módulo, p. ej. { ISO45003: "2027-09-16T…" }. */
    [feature: string]: string;
}

export class SubscriptionService {
    static async getCurrent(psychologistId: string): Promise<Subscription | null> {
        return prisma.subscription.findUnique({ where: { psychologistId } });
    }

    /**
     * Periodo de prueba Residente al registrarse. Idempotente: si ya hay
     * suscripción no hace nada, para que un reintento del registro no
     * regale un segundo cupo.
     */
    static async startTrial(psychologistId: string): Promise<Subscription> {
        const plan = PLANS.RESIDENTE;
        return prisma.$transaction(async (tx) => {
            const existing = await tx.subscription.findUnique({ where: { psychologistId } });
            if (existing) return existing;

            const now = new Date();
            const periodEnd = addDays(now, TRIAL_DAYS);

            const subscription = await tx.subscription.create({
                data: {
                    psychologistId,
                    plan: "RESIDENTE",
                    billingPeriod: null,
                    status: "TRIAL",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: plan.annualQuota,
                    features: {},
                },
            });

            const psych = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { increment: plan.annualQuota } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "TRIAL_GRANT",
                    amount: plan.annualQuota,
                    balanceAfter: psych.creditBalance,
                    expiresAt: periodEnd,
                    description: `Plan Residente: ${plan.annualQuota} trabajadores gestionados durante ${TRIAL_DAYS} días`,
                },
            });

            return subscription;
        });
    }

    /**
     * Activa o renueva un plan dentro de la transacción del cobro.
     *
     * El cupo y la duración salen del SKU comprado, no del tier: el mismo
     * Profesional puede comprarse anual o mensual, y cada SKU carga su propio
     * `periodDays` y `credits`.
     *
     * Sólo se trata como RENOVACIÓN —extiende desde el vencimiento vigente,
     * sin perder días ya pagados— cuando el SKU comprado es el MISMO tier Y
     * la MISMA cadencia que la suscripción activa. Comprar un tier distinto o
     * cambiar de mensual a anual (o al revés) se trata como un CAMBIO DE
     * PLAN: el periodo nuevo empieza hoy, sin prorratear lo que quedaba del
     * anterior. No hay upgrade/downgrade con prorrateo en esta entrega —
     * dicho explícitamente porque es la simplificación más visible: si un
     * psicólogo paga Profesional mensual y a mitad de mes compra Avanzado
     * anual, pierde los días que le quedaban del mes en curso.
     */
    static async activateInTx(
        tx: Prisma.TransactionClient,
        params: { psychologistId: string; sku: Sku; paymentOrderId: string | null }
    ): Promise<Subscription> {
        if (params.sku.kind !== "plan" || !params.sku.plan || !params.sku.billingPeriod || !params.sku.periodDays) {
            throw new Error(`El SKU ${params.sku.id} no es un plan vendible`);
        }
        const plan = PLANS[params.sku.plan];
        const billingPeriod: BillingPeriod = params.sku.billingPeriod;
        const now = new Date();
        const existing = await tx.subscription.findUnique({ where: { psychologistId: params.psychologistId } });

        const isRenewal =
            existing &&
            (existing.status === "ACTIVE" || existing.status === "TRIAL") &&
            existing.plan === plan.id &&
            existing.billingPeriod === billingPeriod &&
            existing.periodEnd > now;
        const periodStart = isRenewal ? existing.periodStart : now;
        const periodEnd = addDays(isRenewal ? existing.periodEnd : now, params.sku.periodDays);

        return tx.subscription.upsert({
            where: { psychologistId: params.psychologistId },
            create: {
                psychologistId: params.psychologistId,
                plan: plan.id,
                billingPeriod,
                status: "ACTIVE",
                periodStart,
                periodEnd,
                quotaGranted: params.sku.credits,
                paymentOrderId: params.paymentOrderId,
                features: {},
            },
            update: {
                plan: plan.id,
                billingPeriod,
                status: "ACTIVE",
                periodStart,
                periodEnd,
                quotaGranted: isRenewal ? { increment: params.sku.credits } : params.sku.credits,
                paymentOrderId: params.paymentOrderId,
            },
        });
    }

    /** Registra un módulo comprado (ISO 45003, informe ejecutivo…) con su vencimiento. */
    static async grantFeatureInTx(
        tx: Prisma.TransactionClient,
        params: { psychologistId: string; sku: Sku }
    ): Promise<void> {
        if (params.sku.kind !== "feature" || !params.sku.feature) {
            throw new Error(`El SKU ${params.sku.id} no es un módulo`);
        }
        const existing = await tx.subscription.findUnique({ where: { psychologistId: params.psychologistId } });
        if (!existing) {
            throw new Error("No hay suscripción a la que asociar el módulo");
        }
        const features = { ...((existing.features as SubscriptionFeatures | null) ?? {}) };
        const from = features[params.sku.feature] ? new Date(features[params.sku.feature]) : new Date();
        const base = from > new Date() ? from : new Date();
        features[params.sku.feature] = params.sku.featureDays
            ? addDays(base, params.sku.featureDays).toISOString()
            : // Un módulo sin duración (informe ejecutivo) es un derecho de uso puntual.
              new Date(8640000000000000).toISOString();

        await tx.subscription.update({
            where: { psychologistId: params.psychologistId },
            data: { features },
        });
    }

    /**
     * Asignación manual por un administrador: transferencia, cortesía, piloto
     * con un evaluador externo. No está atada a ningún SKU —por eso
     * `billingPeriod` queda `null`, igual que en el trial— y por eso el cupo
     * es un parámetro explícito en vez de leerse de un SKU: una cortesía de
     * 15 días no debe regalar el cupo ANUAL completo del tier. Si no se
     * especifica, se usa `annualQuota` como valor de referencia.
     */
    static async adminAssign(params: {
        psychologistId: string;
        plan: PlanId;
        days: number;
        quota?: number;
        actorEmail: string;
    }): Promise<Subscription> {
        const plan = PLANS[params.plan];
        const quota = params.quota ?? plan.annualQuota;
        return prisma.$transaction(async (tx) => {
            const now = new Date();
            const periodEnd = addDays(now, params.days);
            const subscription = await tx.subscription.upsert({
                where: { psychologistId: params.psychologistId },
                create: {
                    psychologistId: params.psychologistId,
                    plan: plan.id,
                    billingPeriod: null,
                    status: "ACTIVE",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: quota,
                    features: {},
                },
                update: {
                    plan: plan.id,
                    billingPeriod: null,
                    status: "ACTIVE",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: quota,
                    paymentOrderId: null,
                },
            });

            const psych = await tx.psychologist.update({
                where: { id: params.psychologistId },
                data: { creditBalance: { increment: quota } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId: params.psychologistId,
                    type: "ADMIN_GRANT",
                    amount: quota,
                    balanceAfter: psych.creditBalance,
                    expiresAt: periodEnd,
                    description: `Plan ${plan.name} asignado por ${params.actorEmail} por ${params.days} días (${quota} trabajadores)`,
                },
            });

            return subscription;
        });
    }

    /**
     * Vence las suscripciones cuyo periodo terminó y retira el cupo no usado.
     *
     * El remanente es min(saldo, cupo otorgado − consumido en el periodo). El
     * mínimo con el saldo cubre dos casos: créditos comprados antes del pivote
     * (sin vencimiento, no se tocan) y saldo negativo por contracargo (no hay
     * nada que retirar). Idempotente: una suscripción ya EXPIRED no vuelve a
     * procesarse.
     */
    static async expireDue(now: Date = new Date()): Promise<{ expired: number; unitsExpired: number }> {
        const due = await prisma.subscription.findMany({
            where: { status: { in: ["TRIAL", "ACTIVE"] }, periodEnd: { lt: now } },
            select: { id: true, psychologistId: true, periodStart: true, periodEnd: true, quotaGranted: true, plan: true },
        });

        let unitsExpired = 0;
        for (const sub of due) {
            await prisma.$transaction(async (tx) => {
                const claimed = await tx.subscription.updateMany({
                    where: { id: sub.id, status: { in: ["TRIAL", "ACTIVE"] } },
                    data: { status: "EXPIRED" },
                });
                if (claimed.count === 0) return;

                const consumed = await tx.creditTransaction.aggregate({
                    where: {
                        psychologistId: sub.psychologistId,
                        type: "CONSUMPTION",
                        createdAt: { gte: sub.periodStart, lte: sub.periodEnd },
                    },
                    _sum: { amount: true },
                });
                const used = -(consumed._sum.amount ?? 0);
                const psych = await tx.psychologist.findUnique({
                    where: { id: sub.psychologistId },
                    select: { creditBalance: true },
                });
                const remanente = Math.max(0, Math.min(psych?.creditBalance ?? 0, sub.quotaGranted - used));
                if (remanente === 0) return;

                const updated = await tx.psychologist.update({
                    where: { id: sub.psychologistId },
                    data: { creditBalance: { decrement: remanente } },
                    select: { creditBalance: true },
                });
                await tx.creditTransaction.create({
                    data: {
                        psychologistId: sub.psychologistId,
                        type: "QUOTA_EXPIRY",
                        amount: -remanente,
                        balanceAfter: updated.creditBalance,
                        description: `Vencimiento del plan ${PLANS[sub.plan].name}: ${remanente} unidades no usadas`,
                    },
                });
                unitsExpired += remanente;
            });
        }

        return { expired: due.length, unitsExpired };
    }
}
