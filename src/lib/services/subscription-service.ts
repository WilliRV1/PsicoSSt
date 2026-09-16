import { prisma } from "@/lib/prisma";
import type { Prisma, Subscription } from "@/generated/prisma/client";
import { PLANS, TRIAL_DAYS, type PlanId, type Sku } from "@/config/plans";

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
                    status: "TRIAL",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: plan.quota,
                    features: {},
                },
            });

            const psych = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { increment: plan.quota } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "TRIAL_GRANT",
                    amount: plan.quota,
                    balanceAfter: psych.creditBalance,
                    expiresAt: periodEnd,
                    description: `Plan Residente: ${plan.quota} trabajadores gestionados durante ${TRIAL_DAYS} días`,
                },
            });

            return subscription;
        });
    }

    /**
     * Activa o renueva un plan dentro de la transacción del cobro.
     *
     * Devuelve la suscripción resultante; quien llama otorga el cupo como
     * créditos con `expiresAt = subscription.periodEnd` en la MISMA
     * transacción (ver `PaymentService.applyPayment`). Renovar antes de vencer
     * extiende desde el vencimiento vigente, no desde hoy: el psicólogo no
     * pierde los días que ya pagó.
     */
    static async activateInTx(
        tx: Prisma.TransactionClient,
        params: { psychologistId: string; sku: Sku; paymentOrderId: string | null }
    ): Promise<Subscription> {
        if (params.sku.kind !== "plan" || !params.sku.plan) {
            throw new Error(`El SKU ${params.sku.id} no es un plan`);
        }
        const plan = PLANS[params.sku.plan];
        const now = new Date();
        const existing = await tx.subscription.findUnique({ where: { psychologistId: params.psychologistId } });

        const stillActive =
            existing &&
            (existing.status === "ACTIVE" || existing.status === "TRIAL") &&
            existing.plan === plan.id &&
            existing.periodEnd > now;
        const periodStart = stillActive ? existing.periodStart : now;
        const periodEnd = addDays(stillActive ? existing.periodEnd : now, plan.periodDays);

        return tx.subscription.upsert({
            where: { psychologistId: params.psychologistId },
            create: {
                psychologistId: params.psychologistId,
                plan: plan.id,
                status: "ACTIVE",
                periodStart,
                periodEnd,
                quotaGranted: plan.quota,
                paymentOrderId: params.paymentOrderId,
                features: {},
            },
            update: {
                plan: plan.id,
                status: "ACTIVE",
                periodStart,
                periodEnd,
                quotaGranted: stillActive ? { increment: plan.quota } : plan.quota,
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
     * Asignación manual por un administrador (transferencia, cortesía).
     * Escribe el cupo como ADMIN_GRANT con vencimiento.
     */
    static async adminAssign(params: {
        psychologistId: string;
        plan: PlanId;
        days: number;
        actorEmail: string;
    }): Promise<Subscription> {
        const plan = PLANS[params.plan];
        return prisma.$transaction(async (tx) => {
            const now = new Date();
            const periodEnd = addDays(now, params.days);
            const subscription = await tx.subscription.upsert({
                where: { psychologistId: params.psychologistId },
                create: {
                    psychologistId: params.psychologistId,
                    plan: plan.id,
                    status: "ACTIVE",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: plan.quota,
                    features: {},
                },
                update: {
                    plan: plan.id,
                    status: "ACTIVE",
                    periodStart: now,
                    periodEnd,
                    quotaGranted: plan.quota,
                    paymentOrderId: null,
                },
            });

            const psych = await tx.psychologist.update({
                where: { id: params.psychologistId },
                data: { creditBalance: { increment: plan.quota } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId: params.psychologistId,
                    type: "ADMIN_GRANT",
                    amount: plan.quota,
                    balanceAfter: psych.creditBalance,
                    expiresAt: periodEnd,
                    description: `Plan ${plan.name} asignado por ${params.actorEmail} por ${params.days} días`,
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
