import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { PaymentOrder, PaymentStatus } from "@/generated/prisma/client";
import { CreditService } from "@/lib/services/credit-service";
import { getPackageById } from "@/config/credit-packages";
import { logAudit } from "@/lib/auth/audit";
import { ORDER_TTL_MINUTES, getMercadoPagoConfig } from "./config";
import {
    createPayment,
    fetchPayment,
    searchPaymentsByExternalReference,
    resolveExternalResourceUrl,
    type MercadoPagoPayment,
} from "./mercadopago-client";
import {
    describeStatusDetail,
    mapPaymentStatus,
    shouldCredit,
    shouldReverse,
} from "./status-map";

/**
 * Ciclo de vida de una orden de pago.
 *
 * ── La regla que sostiene todo ───────────────────────────────────────────────
 * Hay TRES caminos por los que nos enteramos de que un pago cambió de estado, y
 * llegan en cualquier orden:
 *
 *   1. la respuesta síncrona de POST /v1/payments  (tarjeta, ~2 s)
 *   2. el webhook de Mercado Pago                  (puede llegar ANTES que 1)
 *   3. el usuario que vuelve del banco o recarga   (PSE, Nequi, Efecty)
 *
 * Ninguno acredita por su cuenta. Los tres desembocan en `applyPayment`, que es
 * idempotente por construcción. Si cada camino acreditara por separado, los
 * créditos duplicados serían cuestión de tiempo.
 *
 * ── Cómo se garantiza la idempotencia ────────────────────────────────────────
 * `paymentOrder.creditTransactionId` es el cerrojo. Acreditar empieza siempre
 * por un `updateMany` con `creditTransactionId: null` en el WHERE: PostgreSQL
 * bloquea la fila, y un segundo proceso concurrente vuelve a evaluar la
 * condición DESPUÉS del bloqueo, ve el cerrojo puesto, afecta 0 filas y se
 * retira. Sin locks manuales, sin Redis, sin colas.
 */

export type ReconcileOutcome =
    /** Se entregaron los créditos en esta llamada. */
    | "credited"
    /** Se retiraron créditos por reembolso o contracargo. */
    | "reversed"
    /** Otro proceso ya lo resolvió. Resultado correcto, no un error. */
    | "already_settled"
    /** Cambió el estado sin mover créditos (pendiente, rechazado…). */
    | "updated"
    /** El pago no corresponde a ninguna orden nuestra. */
    | "order_not_found"
    /** Mercado Pago no conoce ese pago (p. ej. notificación simulada). */
    | "payment_not_found"
    /** El monto o la moneda no cuadran: se marca para revisión, no se acredita. */
    | "amount_mismatch"
    /** La orden ya está atada a otro pago distinto. */
    | "payment_mismatch";

export interface ReconcileResult {
    outcome: ReconcileOutcome;
    status?: PaymentStatus;
    order?: PaymentOrder;
    /** Texto apto para mostrarle al usuario. */
    message?: string;
}

export class PaymentOrderError extends Error {
    constructor(message: string, readonly code: string) {
        super(message);
        this.name = "PaymentOrderError";
    }
}

/** Estados que ya movieron créditos: jamás se pisan desde la vía genérica. */
const SETTLED: PaymentStatus[] = ["APPROVED", "REFUNDED", "CHARGED_BACK"];

/** Campos del Payment Brick que reenviamos. Todo lo demás se descarta. */
export interface BrickFormData {
    token?: string;
    issuer_id?: string;
    payment_method_id?: string;
    installments?: number;
    payer?: {
        email?: string;
        identification?: { type?: string; number?: string };
        entity_type?: string;
        first_name?: string;
        last_name?: string;
    };
    transaction_details?: { financial_institution?: string };
}

export class PaymentService {
    // ─────────────────────────────────────────────────────────────────────────
    // Creación
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Abre (o reutiliza) una orden para un paquete.
     *
     * Reutilizar una orden CREATED vigente del mismo paquete evita sembrar la
     * tabla de órdenes muertas cada vez que alguien recarga el checkout. Es
     * seguro porque CREATED significa exactamente «todavía no se intentó
     * cobrar»: no hay nada que duplicar.
     */
    static async createOrder(
        psychologistId: string,
        packageId: string
    ): Promise<PaymentOrder> {
        const pkg = getPackageById(packageId);
        if (!pkg) {
            throw new PaymentOrderError(
                "El paquete solicitado no existe.",
                "UNKNOWN_PACKAGE"
            );
        }

        const now = new Date();

        const reusable = await prisma.paymentOrder.findFirst({
            where: {
                psychologistId,
                packageId,
                status: "CREATED",
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
        });
        if (reusable) return reusable;

        return prisma.paymentOrder.create({
            data: {
                psychologistId,
                packageId: pkg.id,
                // El precio lo fija SIEMPRE el servidor desde el catálogo. El
                // cliente nunca propone un monto; sólo elige un identificador
                // de paquete, que se valida contra la lista de arriba.
                amountCOP: pkg.priceCOP,
                internalRef: `psicosst-${randomUUID()}`,
                expiresAt: new Date(now.getTime() + ORDER_TTL_MINUTES * 60_000),
            },
        });
    }

    /** Orden del psicólogo autenticado. Nunca se busca una orden sin dueño. */
    static async getOrder(
        psychologistId: string,
        internalRef: string
    ): Promise<PaymentOrder | null> {
        return prisma.paymentOrder.findFirst({
            where: { internalRef, psychologistId },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cobro
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Envía a Mercado Pago el formulario que devolvió el Payment Brick.
     *
     * La orden se «reclama» pasándola de CREATED a PROCESSING con un
     * `updateMany` condicionado: un doble clic, un reintento del navegador o dos
     * pestañas abiertas pierden la carrera y reciben un 409 en vez de generar un
     * segundo cobro.
     */
    static async processBrickPayment(params: {
        psychologistId: string;
        internalRef: string;
        form: BrickFormData;
        /** URL pública del webhook; se omite si no es accesible desde internet. */
        notificationUrl: string | null;
    }): Promise<ReconcileResult> {
        const order = await this.getOrder(params.psychologistId, params.internalRef);
        if (!order) {
            throw new PaymentOrderError("Orden no encontrada.", "ORDER_NOT_FOUND");
        }

        const pkg = getPackageById(order.packageId);
        if (!pkg) {
            throw new PaymentOrderError(
                "El paquete de esta orden ya no está disponible.",
                "UNKNOWN_PACKAGE"
            );
        }

        if (order.expiresAt < new Date() && order.status === "CREATED") {
            throw new PaymentOrderError(
                "La orden venció. Vuelve a elegir el paquete.",
                "ORDER_EXPIRED"
            );
        }

        const claimed = await prisma.paymentOrder.updateMany({
            where: { id: order.id, status: "CREATED" },
            data: { status: "PROCESSING" },
        });
        if (claimed.count === 0) {
            throw new PaymentOrderError(
                "Esta orden ya se está procesando o ya se pagó.",
                "ORDER_NOT_PAYABLE"
            );
        }

        const payload = this.buildPaymentPayload({
            order,
            packageName: pkg.name,
            credits: pkg.credits,
            form: params.form,
            notificationUrl: params.notificationUrl,
        });

        let payment: MercadoPagoPayment;
        try {
            // El `internalRef` como llave de idempotencia: si esta misma petición
            // se repite, Mercado Pago devuelve el pago ya creado en vez de cobrar
            // de nuevo.
            payment = await createPayment(payload, order.internalRef);
        } catch (error) {
            // La orden queda en PROCESSING a propósito. Puede que el cobro SÍ se
            // haya creado y sólo se perdiera la respuesta; `syncOrder` lo
            // encuentra después buscando por `external_reference`. Marcarla como
            // fallida aquí sería mentir sobre algo que no sabemos.
            console.error(
                `[PAGOS] Falló la creación del pago para ${order.internalRef}:`,
                error instanceof Error ? error.message : error
            );
            throw error;
        }

        return this.applyPayment(payment);
    }

    /** Arma el cuerpo de POST /v1/payments sin confiar en nada del cliente. */
    private static buildPaymentPayload(params: {
        order: PaymentOrder;
        packageName: string;
        credits: number;
        form: BrickFormData;
        notificationUrl: string | null;
    }): Record<string, unknown> {
        const { order, form } = params;

        const payer: Record<string, unknown> = {};
        if (form.payer?.email) payer.email = form.payer.email;
        if (form.payer?.identification?.type && form.payer.identification.number) {
            payer.identification = {
                type: form.payer.identification.type,
                number: form.payer.identification.number,
            };
        }
        if (form.payer?.entity_type) payer.entity_type = form.payer.entity_type;
        if (form.payer?.first_name) payer.first_name = form.payer.first_name;
        if (form.payer?.last_name) payer.last_name = form.payer.last_name;

        const payload: Record<string, unknown> = {
            // Monto y referencia SIEMPRE del servidor. Si el cliente mandó un
            // `transaction_amount`, se descarta aquí sin contemplaciones.
            transaction_amount: order.amountCOP,
            external_reference: order.internalRef,
            description: `PsicoSST · Paquete ${params.packageName} (${params.credits} créditos)`,
            statement_descriptor: "PSICOSST",
            payment_method_id: form.payment_method_id,
            payer,
        };

        if (form.token) payload.token = form.token;
        if (form.issuer_id) payload.issuer_id = form.issuer_id;
        if (form.installments && form.installments > 0) {
            payload.installments = form.installments;
        }
        // PSE exige el banco elegido por el usuario.
        if (form.transaction_details?.financial_institution) {
            payload.transaction_details = {
                financial_institution: form.transaction_details.financial_institution,
            };
        }
        // Mercado Pago rechaza una `notification_url` que no pueda alcanzar.
        // En desarrollo local simplemente no se envía: la reconciliación
        // perezosa cubre el hueco.
        if (params.notificationUrl) payload.notification_url = params.notificationUrl;

        return payload;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reconciliación — la única puerta por la que se mueven créditos
    // ─────────────────────────────────────────────────────────────────────────

    /** Punto de entrada del webhook. */
    static async reconcileByPaymentId(
        paymentId: string | number
    ): Promise<ReconcileResult> {
        const payment = await fetchPayment(paymentId);
        if (!payment) return { outcome: "payment_not_found" };
        return this.applyPayment(payment);
    }

    /**
     * Pone al día una orden concreta. La usa la pantalla de checkout al cargar
     * y el barrido programado.
     *
     * Si la orden todavía no tiene identificador de pago, se busca por
     * `external_reference`: así se rescatan las órdenes huérfanas que quedaron
     * en PROCESSING porque se perdió la respuesta de Mercado Pago.
     */
    static async syncOrder(order: PaymentOrder): Promise<ReconcileResult> {
        if (order.mercadoPagoPaymentId) {
            return this.reconcileByPaymentId(order.mercadoPagoPaymentId);
        }

        const candidates = await searchPaymentsByExternalReference(order.internalRef);
        if (candidates.length === 0) return { outcome: "payment_not_found", order };

        // Con varios pagos para la misma referencia (no debería ocurrir, pero
        // Mercado Pago puede registrar intentos fallidos), manda el aprobado.
        const winner =
            candidates.find((p) => p.status === "approved") ?? candidates[0];

        return this.applyPayment(winner);
    }

    /**
     * Aplica el estado real de un pago sobre su orden. Idempotente.
     *
     * El pago que entra aquí viene SIEMPRE de la API de Mercado Pago, nunca del
     * cuerpo de un webhook: el cuerpo de la notificación sólo se usa para saber
     * QUÉ pago consultar, jamás como fuente de verdad sobre su estado.
     */
    private static async applyPayment(
        payment: MercadoPagoPayment
    ): Promise<ReconcileResult> {
        const paymentId = String(payment.id);
        const externalRef = payment.external_reference;

        const order = await prisma.paymentOrder.findFirst({
            where: externalRef
                ? { OR: [{ internalRef: externalRef }, { mercadoPagoPaymentId: paymentId }] }
                : { mercadoPagoPaymentId: paymentId },
        });
        if (!order) return { outcome: "order_not_found" };

        if (order.mercadoPagoPaymentId && order.mercadoPagoPaymentId !== paymentId) {
            console.error(
                `[PAGOS] Orden ${order.internalRef} ya atada al pago ${order.mercadoPagoPaymentId}, ` +
                    `llegó ${paymentId}. Requiere revisión manual.`
            );
            return { outcome: "payment_mismatch", order };
        }

        const status = mapPaymentStatus(payment.status);
        const message = describeStatusDetail(status, payment.status_detail);
        const pkg = getPackageById(order.packageId);

        const common = {
            mercadoPagoPaymentId: paymentId,
            paymentMethodId: payment.payment_method_id,
            paymentTypeId: payment.payment_type_id,
            statusDetail: payment.status_detail,
            externalResourceUrl: resolveExternalResourceUrl(payment),
        };

        // ── Antes de tocar un solo crédito: ¿el dinero cuadra? ──────────────
        if (shouldCredit(status)) {
            const problem = this.validateApprovedPayment(payment, order, Boolean(pkg));
            if (problem) {
                console.error(`[PAGOS] Orden ${order.internalRef}: ${problem}`);
                await prisma.paymentOrder.updateMany({
                    where: { id: order.id, status: { notIn: SETTLED } },
                    data: { ...common, status: "ERROR", statusDetail: problem },
                });
                return { outcome: "amount_mismatch", order, status: "ERROR" };
            }
        }

        // ── Acreditación ────────────────────────────────────────────────────
        if (shouldCredit(status) && pkg) {
            const result = await prisma.$transaction(
                async (tx) => {
                    // El cerrojo. `creditTransactionId: null` sólo lo cumple el
                    // primero en llegar; el resto afecta 0 filas y se retira.
                    const claimed = await tx.paymentOrder.updateMany({
                        where: { id: order.id, creditTransactionId: null },
                        data: { ...common, status: "APPROVED", completedAt: new Date() },
                    });
                    if (claimed.count === 0) return null;

                    const { transactionId } = await CreditService.creditPurchaseInTx(tx, {
                        psychologistId: order.psychologistId,
                        pkg,
                        paymentRef: paymentId,
                    });

                    return tx.paymentOrder.update({
                        where: { id: order.id },
                        data: { creditTransactionId: transactionId },
                    });
                },
                { timeout: 8_000, maxWait: 4_000 }
            );

            if (!result) {
                return { outcome: "already_settled", order, status: "APPROVED", message };
            }

            await logAudit({
                userId: order.psychologistId,
                action: "CREDIT_PURCHASE",
                resourceType: "PaymentOrder",
                resourceId: order.id,
                // Sin datos del pagador: sólo lo necesario para auditar el cobro.
                metadata: {
                    packageId: pkg.id,
                    credits: pkg.credits,
                    amountCOP: order.amountCOP,
                    paymentId,
                    paymentMethodId: payment.payment_method_id,
                },
            });

            console.info(
                `[PAGOS] Acreditados ${pkg.credits} créditos · orden ${order.internalRef} · pago ${paymentId}`
            );
            return { outcome: "credited", order: result, status: "APPROVED", message };
        }

        // ── Reversión por reembolso o contracargo ───────────────────────────
        if (shouldReverse(status) && pkg) {
            const result = await prisma.$transaction(
                async (tx) => {
                    // Sólo revierte lo que de verdad se acreditó: exige que la
                    // orden esté APROBADA y con cerrojo puesto.
                    const claimed = await tx.paymentOrder.updateMany({
                        where: {
                            id: order.id,
                            status: "APPROVED",
                            creditTransactionId: { not: null },
                        },
                        data: { ...common, status },
                    });
                    if (claimed.count === 0) return null;

                    await CreditService.reverseInTx(tx, {
                        psychologistId: order.psychologistId,
                        credits: pkg.credits,
                        paymentRef: paymentId,
                        reason: status === "REFUNDED" ? "reembolso" : "contracargo",
                    });

                    return tx.paymentOrder.findUnique({ where: { id: order.id } });
                },
                { timeout: 8_000, maxWait: 4_000 }
            );

            if (!result) return { outcome: "already_settled", order, status, message };

            console.warn(
                `[PAGOS] Revertidos ${pkg.credits} créditos · orden ${order.internalRef} · ${status}`
            );
            return { outcome: "reversed", order: result, status, message };
        }

        // ── Cambio de estado sin movimiento de créditos ─────────────────────
        // El guardia impide degradar una orden que ya movió créditos: una
        // notificación vieja con estado `pending` no puede pisar un APPROVED.
        await prisma.paymentOrder.updateMany({
            where: { id: order.id, status: { notIn: SETTLED } },
            data: {
                ...common,
                status,
                completedAt: status === "REJECTED" || status === "CANCELLED" ? new Date() : null,
            },
        });

        const fresh = await prisma.paymentOrder.findUnique({ where: { id: order.id } });
        return { outcome: "updated", order: fresh ?? order, status, message };
    }

    /**
     * Comprueba que un pago aprobado sea realmente el que esperábamos.
     *
     * Devuelve el motivo si algo no cuadra, o `null` si está todo en orden.
     * Es la última defensa contra acreditar un pago manipulado o de otra cuenta.
     */
    private static validateApprovedPayment(
        payment: MercadoPagoPayment,
        order: PaymentOrder,
        packageExists: boolean
    ): string | null {
        if (!packageExists) {
            return `El paquete "${order.packageId}" ya no existe en el catálogo`;
        }
        if (payment.currency_id !== "COP") {
            return `Moneda inesperada: ${payment.currency_id}, se esperaba COP`;
        }
        // El COP no maneja decimales, pero la API los devuelve como número.
        if (Math.round(payment.transaction_amount) !== order.amountCOP) {
            return `Monto inesperado: ${payment.transaction_amount}, se esperaba ${order.amountCOP}`;
        }
        // Con credenciales de producción todo pago real trae `live_mode: true`.
        // Un pago de prueba que llegue ahí no puede entregar créditos.
        if (getMercadoPagoConfig().mode === "production" && !payment.live_mode) {
            return "Pago de prueba recibido con credenciales de producción";
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mantenimiento
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Barrido programado. Hace dos cosas distintas y conviene no confundirlas:
     *
     *  · Vencer órdenes CREATED que nunca se intentaron pagar. Son basura.
     *  · Reconciliar órdenes que SÍ se intentaron y quedaron a medias. Aquí
     *    puede haber dinero real esperando acreditarse, así que jamás se vencen
     *    por antigüedad: se consultan contra Mercado Pago.
     */
    static async sweepStaleOrders(options?: { limit?: number }): Promise<{
        expired: number;
        reconciled: number;
        failed: number;
    }> {
        const limit = options?.limit ?? 40;
        const now = new Date();

        const { count: expired } = await prisma.paymentOrder.updateMany({
            where: { status: "CREATED", expiresAt: { lt: now } },
            data: { status: "EXPIRED", completedAt: now },
        });

        const pendientes = await prisma.paymentOrder.findMany({
            where: { status: { in: ["PROCESSING", "PENDING", "IN_PROCESS"] } },
            orderBy: { createdAt: "asc" },
            take: limit,
        });

        let reconciled = 0;
        let failed = 0;

        for (const order of pendientes) {
            try {
                const result = await this.syncOrder(order);
                if (result.outcome !== "payment_not_found") reconciled += 1;
            } catch (error) {
                failed += 1;
                console.error(
                    `[PAGOS] No se pudo reconciliar ${order.internalRef}:`,
                    error instanceof Error ? error.message : error
                );
            }
        }

        return { expired, reconciled, failed };
    }
}
