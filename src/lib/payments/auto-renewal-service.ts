/**
 * Renovación automática del plan mediante `preapproval` de Mercado Pago.
 *
 * Es ADITIVO: sin autorización, la suscripción se renueva como siempre —
 * volviendo a comprar a mano—. Activarla es una decisión explícita del
 * psicólogo y no cambia en nada el checkout de pago único.
 *
 * Cómo encaja con lo que ya había, que es lo importante de no romper:
 *
 *  1. Aquí NO se cobra ni se acredita nada. Cuando Mercado Pago genera el pago
 *     de un periodo, se crea una `PaymentOrder` atada a ese pago y se delega en
 *     `PaymentService.reconcileByPaymentId`, el mismo camino del pago único.
 *     Así la acreditación, la idempotencia, la auditoría y el cálculo del
 *     periodo (`SubscriptionService.activateInTx`) siguen viviendo en un solo
 *     sitio. Duplicarlos aquí habría sido la forma segura de que un día
 *     divergieran.
 *
 *  2. La autorización se firma sobre un SKU concreto —precio y cadencia—, y por
 *     eso se guarda en `autoRenewSku`. Si el psicólogo cambia de plan, la
 *     autorización anterior deja de corresponder: se cancela y se pide una
 *     nueva, en vez de cobrar un importe que nadie aprobó.
 *
 *  3. El estado real vive en Mercado Pago. Lo que guardamos es un reflejo que
 *     se refresca por webhook; ante la duda se relee de su API, nunca del
 *     cuerpo de la notificación.
 */

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPackageById } from "@/config/plans";
import type { Sku } from "@/config/plans";
import {
    cancelPreapproval,
    createPreapproval,
    fetchAuthorizedPayment,
    fetchPreapproval,
    type MercadoPagoPreapproval,
    type PreapprovalStatus,
} from "@/lib/payments/mercadopago-client";
import { PaymentService, type ReconcileResult } from "@/lib/payments/payment-service";
import { logAudit } from "@/lib/auth/audit";
import type { AutoRenewStatus } from "@/generated/prisma";

export class AutoRenewalError extends Error {
    constructor(
        message: string,
        readonly code:
            | "NO_SUBSCRIPTION"
            | "SKU_NOT_RENEWABLE"
            | "ALREADY_AUTHORIZED"
            | "NOT_AUTHORIZED"
            | "PSYCHOLOGIST_NOT_FOUND"
    ) {
        super(message);
        this.name = "AutoRenewalError";
    }
}

/** Traduce el estado de Mercado Pago al nuestro. */
function mapStatus(status: PreapprovalStatus): AutoRenewStatus {
    switch (status) {
        case "authorized":
            return "AUTHORIZED";
        case "paused":
            return "PAUSED";
        case "cancelled":
            return "CANCELLED";
        default:
            return "PENDING";
    }
}

/**
 * Cadencia del cobro a partir del SKU.
 *
 * Se deriva de `billingPeriod` y no de `periodDays` porque Mercado Pago cobra
 * en meses naturales: pedirle «cada 365 días» y que nuestro periodo dure 365
 * días exactos produce una deriva de un día cada año bisiesto.
 */
function autoRecurringFor(sku: Sku): { frequency: number; frequency_type: "months" } {
    return { frequency: sku.billingPeriod === "ANNUAL" ? 12 : 1, frequency_type: "months" };
}

export interface AutoRenewalState {
    enabled: boolean;
    status: AutoRenewStatus | null;
    skuId: string | null;
    updatedAt: Date | null;
}

export class AutoRenewalService {
    /** Estado para la interfaz. No consulta a Mercado Pago. */
    static async getState(psychologistId: string): Promise<AutoRenewalState> {
        const sub = await prisma.subscription.findUnique({
            where: { psychologistId },
            select: { autoRenewStatus: true, autoRenewSku: true, autoRenewUpdatedAt: true },
        });

        return {
            enabled: sub?.autoRenewStatus === "AUTHORIZED",
            status: sub?.autoRenewStatus ?? null,
            skuId: sub?.autoRenewSku ?? null,
            updatedAt: sub?.autoRenewUpdatedAt ?? null,
        };
    }

    /**
     * Crea la autorización y devuelve la URL donde el psicólogo la aprueba.
     *
     * Queda en PENDING hasta que Mercado Pago confirme por webhook: aprobar es
     * un acto que ocurre en su dominio, y darlo por hecho aquí dejaría una
     * suscripción que se cree renovable y no lo es.
     */
    static async authorize(params: {
        psychologistId: string;
        skuId: string;
        origin: string;
    }): Promise<{ initPoint: string; preapprovalId: string }> {
        const sku = getPackageById(params.skuId);
        if (!sku || sku.kind !== "plan" || !sku.billingPeriod || sku.priceCOP <= 0) {
            throw new AutoRenewalError(
                "Ese plan no admite renovación automática.",
                "SKU_NOT_RENEWABLE"
            );
        }

        const psychologist = await prisma.psychologist.findUnique({
            where: { id: params.psychologistId },
            select: { email: true },
        });
        if (!psychologist) {
            throw new AutoRenewalError("Psicólogo no encontrado.", "PSYCHOLOGIST_NOT_FOUND");
        }

        const sub = await prisma.subscription.findUnique({
            where: { psychologistId: params.psychologistId },
            select: { id: true, autoRenewStatus: true, preapprovalId: true },
        });
        if (!sub) {
            throw new AutoRenewalError(
                "Primero necesitas un plan activo para programar su renovación.",
                "NO_SUBSCRIPTION"
            );
        }
        if (sub.autoRenewStatus === "AUTHORIZED") {
            throw new AutoRenewalError(
                "La renovación automática ya está activa.",
                "ALREADY_AUTHORIZED"
            );
        }

        // Una autorización anterior sin aprobar se cancela antes de crear otra:
        // dos preapprovals vivos para el mismo psicólogo cobrarían dos veces.
        if (sub.preapprovalId && sub.autoRenewStatus === "PENDING") {
            await cancelPreapproval(sub.preapprovalId).catch((error) =>
                console.error("[PAGOS][auto] No se pudo cancelar la autorización previa:", error)
            );
        }

        const externalReference = `autoren-${params.psychologistId}-${randomUUID()}`;
        const preapproval = await createPreapproval({
            reason: `PsicoSST · ${sku.name}`,
            external_reference: externalReference,
            payer_email: psychologist.email,
            back_url: `${params.origin}/dashboard/plan?renovacion=autorizada`,
            status: "pending",
            auto_recurring: {
                ...autoRecurringFor(sku),
                transaction_amount: sku.priceCOP,
                currency_id: "COP",
            },
        });

        await prisma.subscription.update({
            where: { psychologistId: params.psychologistId },
            data: {
                preapprovalId: preapproval.id,
                autoRenewSku: sku.id,
                autoRenewStatus: mapStatus(preapproval.status),
                autoRenewUpdatedAt: new Date(),
            },
        });

        await logAudit({
            userId: params.psychologistId,
            action: "UPDATE",
            resourceType: "Subscription",
            resourceId: sub.id,
            metadata: {
                event: "AUTO_RENEWAL_REQUESTED",
                skuId: sku.id,
                preapprovalId: preapproval.id,
            },
        });

        if (!preapproval.init_point) {
            // Mercado Pago siempre la devuelve para una autorización pendiente;
            // si falta, es preferible fallar aquí que mandar al psicólogo a una
            // pantalla en blanco.
            throw new AutoRenewalError(
                "Mercado Pago no devolvió el enlace de autorización.",
                "SKU_NOT_RENEWABLE"
            );
        }

        return { initPoint: preapproval.init_point, preapprovalId: preapproval.id };
    }

    /** Cancela la autorización. La suscripción vigente no se toca: se agota su periodo. */
    static async cancel(psychologistId: string): Promise<void> {
        const sub = await prisma.subscription.findUnique({
            where: { psychologistId },
            select: { id: true, preapprovalId: true, autoRenewStatus: true },
        });

        if (!sub?.preapprovalId || sub.autoRenewStatus === "CANCELLED") {
            throw new AutoRenewalError(
                "No hay una renovación automática activa.",
                "NOT_AUTHORIZED"
            );
        }

        await cancelPreapproval(sub.preapprovalId);

        await prisma.subscription.update({
            where: { psychologistId },
            data: { autoRenewStatus: "CANCELLED", autoRenewUpdatedAt: new Date() },
        });

        await logAudit({
            userId: psychologistId,
            action: "UPDATE",
            resourceType: "Subscription",
            resourceId: sub.id,
            metadata: { event: "AUTO_RENEWAL_CANCELLED", preapprovalId: sub.preapprovalId },
        });
    }

    /**
     * Refresca el estado desde Mercado Pago. Lo llama el webhook de
     * `subscription_preapproval`.
     */
    static async syncFromPreapproval(
        preapprovalId: string
    ): Promise<{ outcome: "updated" | "unknown_preapproval" | "not_found"; status?: AutoRenewStatus }> {
        const sub = await prisma.subscription.findUnique({
            where: { preapprovalId },
            select: { id: true, psychologistId: true, autoRenewStatus: true },
        });
        if (!sub) return { outcome: "unknown_preapproval" };

        const remote: MercadoPagoPreapproval | null = await fetchPreapproval(preapprovalId);
        if (!remote) return { outcome: "not_found" };

        const status = mapStatus(remote.status);
        if (status === sub.autoRenewStatus) return { outcome: "updated", status };

        await prisma.subscription.update({
            where: { preapprovalId },
            data: { autoRenewStatus: status, autoRenewUpdatedAt: new Date() },
        });

        await logAudit({
            userId: sub.psychologistId,
            action: "UPDATE",
            resourceType: "Subscription",
            resourceId: sub.id,
            metadata: { event: "AUTO_RENEWAL_STATUS_CHANGED", preapprovalId, status },
        });

        return { outcome: "updated", status };
    }

    /**
     * Acredita el cobro de un periodo. Lo llama el webhook de
     * `subscription_authorized_payment`.
     *
     * No acredita por su cuenta: crea (o recupera) la orden correspondiente y
     * delega en el conciliador de siempre, que relee el estado real del pago
     * desde Mercado Pago antes de tocar nada.
     */
    static async applyRecurringPayment(
        authorizedPaymentId: string | number
    ): Promise<ReconcileResult | { outcome: "unknown_preapproval" | "payment_not_found" }> {
        const authorized = await fetchAuthorizedPayment(authorizedPaymentId);
        if (!authorized?.payment?.id) return { outcome: "payment_not_found" };

        const paymentId = String(authorized.payment.id);

        // Reintento de la misma notificación: la orden ya existe y conciliarla
        // de nuevo es inocuo (el conciliador es idempotente).
        const existing = await prisma.paymentOrder.findUnique({
            where: { mercadoPagoPaymentId: paymentId },
            select: { id: true },
        });
        if (existing) return PaymentService.reconcileByPaymentId(paymentId);

        const sub = await prisma.subscription.findUnique({
            where: { preapprovalId: authorized.preapproval_id },
            select: { psychologistId: true, autoRenewSku: true },
        });
        if (!sub?.autoRenewSku) return { outcome: "unknown_preapproval" };

        const sku = getPackageById(sub.autoRenewSku);
        if (!sku) return { outcome: "unknown_preapproval" };

        // `internalRef` determinista: si dos notificaciones del mismo cobro
        // llegan a la vez, la segunda choca contra la llave única en vez de
        // abrir una orden gemela.
        await prisma.paymentOrder.create({
            data: {
                psychologistId: sub.psychologistId,
                packageId: sku.id,
                amountCOP: sku.priceCOP,
                internalRef: `autoren-${paymentId}`,
                mercadoPagoPaymentId: paymentId,
                status: "PROCESSING",
                processingAt: new Date(),
                // El cobro ya ocurrió: la orden no puede vencer por inactividad.
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });

        return PaymentService.reconcileByPaymentId(paymentId);
    }
}
