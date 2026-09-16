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
    MercadoPagoApiError,
    type MercadoPagoPayment,
} from "./mercadopago-client";
import {
    describeStatusDetail,
    mapPaymentStatus,
    shouldCredit,
    shouldReverse,
} from "./status-map";
import { randomUUID } from "node:crypto";

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
 *
 * ── Intentos ─────────────────────────────────────────────────────────────────
 * Una orden lleva como máximo UN pago registrado en Mercado Pago. Si un intento
 * muere con 4xx (Mercado Pago no registró nada), la orden vuelve a CREATED y
 * el siguiente intento lleva otra llave de idempotencia (`attemptCount`). Si
 * muere de forma ambigua (5xx, timeout), se queda en PROCESSING y la
 * reconciliación decide: o encuentra el pago por `external_reference`, o pasado
 * un plazo de gracia la declara huérfana.
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
    /** PROCESSING sin pago registrado más allá del plazo de gracia: se venció. */
    | "expired_orphan"
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

/**
 * Cuánto puede estar una orden en PROCESSING sin que Mercado Pago conozca un
 * pago con su referencia antes de declararla huérfana. Un pago real aparece en
 * la búsqueda por `external_reference` en segundos; quince minutos es margen
 * de sobra y evita que el usuario vea «esperando confirmación» para siempre.
 */
export const PROCESSING_GRACE_MINUTES = 15;

/**
 * Presupuesto del barrido programado. La función del plan Hobby se corta a los
 * 10 s; cada orden cuesta una llamada a Mercado Pago, así que el barrido se
 * detiene solo y deja el resto para la siguiente ejecución.
 */
const SWEEP_TIME_BUDGET_MS = 6_000;

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

/** Datos del pagador que aporta el SERVIDOR, no el formulario. */
export interface PayerContext {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
}

export interface ProcessPaymentParams {
    psychologistId: string;
    internalRef: string;
    form: BrickFormData;
    payer: PayerContext;
    /** IP del comprador. PSE la exige (`additional_info.ip_address`). */
    ipAddress: string | null;
    /** A dónde vuelve el comprador tras pagar en el banco. PSE la exige. */
    callbackUrl: string | null;
    /** URL pública del webhook; se omite si no es accesible desde internet. */
    notificationUrl: string | null;
}

/**
 * Arma el cuerpo de POST /v1/payments sin confiar en nada del cliente.
 *
 * Función pura y exportada para poder probarla sin base de datos. Lo que la
 * documentación de Mercado Pago exige que añada el backend y el Brick NO
 * envía: `callback_url`, `additional_info.ip_address`, `notification_url` y
 * los datos del pagador que ya conocemos por la sesión (correo y nombre).
 */
export function buildPaymentPayload(params: {
    order: Pick<PaymentOrder, "amountCOP" | "internalRef">;
    packageName: string;
    credits: number;
    form: BrickFormData;
    payer: PayerContext;
    ipAddress: string | null;
    callbackUrl: string | null;
    notificationUrl: string | null;
}): Record<string, unknown> {
    const { order, form } = params;

    const payer: Record<string, unknown> = {};
    // El formulario manda; la sesión completa lo que falte. Para tarjeta el
    // Brick incluye el correo; para PSE y Efecty puede no hacerlo.
    const email = form.payer?.email ?? params.payer.email;
    if (email) payer.email = email;
    const firstName = form.payer?.first_name ?? params.payer.firstName;
    const lastName = form.payer?.last_name ?? params.payer.lastName;
    if (firstName) payer.first_name = firstName;
    if (lastName) payer.last_name = lastName;
    if (form.payer?.identification?.type && form.payer.identification.number) {
        payer.identification = {
            type: form.payer.identification.type,
            number: form.payer.identification.number,
        };
    }
    if (form.payer?.entity_type) payer.entity_type = form.payer.entity_type;

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
    // Obligatoria para PSE (`additional_info.ip_address cant be null`);
    // inofensiva para el resto.
    if (params.ipAddress) payload.additional_info = { ip_address: params.ipAddress };
    // Obligatoria para PSE: el banco redirige aquí al terminar. Mercado Pago
    // le añade `payment_id` como parámetro.
    if (params.callbackUrl) payload.callback_url = params.callbackUrl;
    // Mercado Pago rechaza una `notification_url` que no pueda alcanzar. En
    // desarrollo local simplemente no se envía: la reconciliación perezosa
    // cubre el hueco.
    if (params.notificationUrl) payload.notification_url = params.notificationUrl;

    return payload;
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
     * seguro porque CREATED significa exactamente «no hay ningún pago
     * registrado»: no hay nada que duplicar.
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
     * `updateMany` condicionado que también exige que no haya vencido: un
     * doble clic, un reintento del navegador, dos pestañas abiertas o el
     * barrido venciéndola en ese instante pierden la carrera y reciben un 409
     * con el motivo correcto, nunca un segundo cobro.
     */
    static async processBrickPayment(params: ProcessPaymentParams): Promise<ReconcileResult> {
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

        const now = new Date();
        const claimed = await prisma.paymentOrder.updateMany({
            where: { id: order.id, status: "CREATED", expiresAt: { gt: now } },
            data: {
                status: "PROCESSING",
                processingAt: now,
                attemptCount: { increment: 1 },
            },
        });

        if (claimed.count === 0) {
            const fresh = await prisma.paymentOrder.findUnique({
                where: { id: order.id },
                select: { status: true, expiresAt: true },
            });
            const vencida =
                !fresh ||
                fresh.status === "EXPIRED" ||
                (fresh.status === "CREATED" && fresh.expiresAt <= now);
            throw vencida
                ? new PaymentOrderError(
                      "La orden venció. Vuelve a elegir el paquete.",
                      "ORDER_EXPIRED"
                  )
                : new PaymentOrderError(
                      "Esta orden ya se está procesando o ya se pagó.",
                      "ORDER_NOT_PAYABLE"
                  );
        }

        // El contador recién incrementado forma la llave de idempotencia: cada
        // intento real lleva la suya, y repetir la MISMA petición (reintento
        // del navegador) devuelve el mismo pago en vez de cobrar dos veces.
        const claimedOrder = await prisma.paymentOrder.findUniqueOrThrow({
            where: { id: order.id },
            select: { attemptCount: true },
        });
        const idempotencyKey = `${order.internalRef}#${claimedOrder.attemptCount}`;

        const payload = buildPaymentPayload({
            order,
            packageName: pkg.name,
            credits: pkg.credits,
            form: params.form,
            payer: params.payer,
            ipAddress: params.ipAddress,
            callbackUrl: params.callbackUrl,
            notificationUrl: params.notificationUrl,
        });

        let payment: MercadoPagoPayment;
        try {
            payment = await createPayment(payload, idempotencyKey);
        } catch (error) {
            if (error instanceof MercadoPagoApiError && error.isDefinitiveRejection) {
                // 4xx: Mercado Pago no registró NINGÚN pago. La orden vuelve a
                // CREATED para que el usuario corrija y reintente sobre la misma
                // orden; el motivo queda guardado para soporte.
                await prisma.paymentOrder.updateMany({
                    where: { id: order.id, status: "PROCESSING" },
                    data: {
                        status: "CREATED",
                        processingAt: null,
                        statusDetail: `rechazo_${error.httpStatus}: ${error.message}`.slice(0, 200),
                    },
                });
                console.warn(
                    `[PAGOS] Mercado Pago rechazó el intento de ${order.internalRef} (${error.httpStatus}): ${error.message}`,
                    error.causes
                );
            } else {
                // 5xx o timeout: puede que el cobro SÍ se haya creado y sólo se
                // perdiera la respuesta. Se queda en PROCESSING a propósito;
                // `syncOrder` lo encontrará por `external_reference` o, pasado
                // el plazo de gracia, lo declarará huérfano. Marcarlo fallido
                // aquí sería mentir sobre algo que no sabemos.
                console.error(
                    `[PAGOS] Falló la creación del pago para ${order.internalRef}:`,
                    error instanceof Error ? error.message : error
                );
            }
            throw error;
        }

        return this.applyPayment(payment);
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
     * `external_reference`: así se rescatan las órdenes que quedaron en
     * PROCESSING porque se perdió la respuesta de Mercado Pago. Si tampoco
     * así aparece nada y ya pasó el plazo de gracia, la orden se declara
     * huérfana y se vence — sin cerrar la puerta: una orden EXPIRED sigue
     * pudiendo acreditarse si el dinero llega después.
     */
    static async syncOrder(order: PaymentOrder): Promise<ReconcileResult> {
        // Se registra el intento ANTES de llamar a Mercado Pago, cambie o no
        // algo después: es lo que regula el enfriamiento del sondeo y hace
        // rotar el barrido para que ninguna orden acapare las ejecuciones.
        await prisma.paymentOrder.updateMany({
            where: { id: order.id },
            data: { lastSyncedAt: new Date() },
        });

        if (order.mercadoPagoPaymentId) {
            return this.reconcileByPaymentId(order.mercadoPagoPaymentId);
        }

        const candidates = await searchPaymentsByExternalReference(order.internalRef);
        if (candidates.length === 0) return this.handleOrphan(order);

        // Con varios pagos para la misma referencia (no debería ocurrir, pero
        // Mercado Pago puede registrar intentos fallidos), manda el aprobado.
        const winner =
            candidates.find((p) => p.status === "approved") ?? candidates[0];

        return this.applyPayment(winner);
    }

    /** Orden en PROCESSING que Mercado Pago no reconoce: ¿ya es huérfana? */
    private static async handleOrphan(order: PaymentOrder): Promise<ReconcileResult> {
        if (order.status !== "PROCESSING" || !order.processingAt) {
            return { outcome: "payment_not_found", order };
        }

        const edad = Date.now() - order.processingAt.getTime();
        if (edad < PROCESSING_GRACE_MINUTES * 60_000) {
            return { outcome: "payment_not_found", order };
        }

        const { count } = await prisma.paymentOrder.updateMany({
            where: { id: order.id, status: "PROCESSING", creditTransactionId: null },
            data: {
                status: "EXPIRED",
                statusDetail: "no_payment_registered",
                completedAt: new Date(),
            },
        });
        if (count === 0) return { outcome: "payment_not_found", order };

        console.warn(`[PAGOS] Orden huérfana vencida: ${order.internalRef}`);
        const fresh = await prisma.paymentOrder.findUnique({ where: { id: order.id } });
        return {
            outcome: "expired_orphan",
            order: fresh ?? order,
            status: "EXPIRED",
            message: describeStatusDetail("EXPIRED", null),
        };
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

        const common: {
            mercadoPagoPaymentId: string;
            paymentMethodId: string | null;
            paymentTypeId: string | null;
            statusDetail: string | null;
            externalResourceUrl: string | null;
            expiresAt?: Date;
        } = {
            mercadoPagoPaymentId: paymentId,
            paymentMethodId: payment.payment_method_id,
            paymentTypeId: payment.payment_type_id,
            statusDetail: payment.status_detail,
            externalResourceUrl: resolveExternalResourceUrl(payment),
        };
        // Los medios que se pagan fuera de línea (Efecty) traen su propio
        // vencimiento, más largo que nuestra ventana de 30 min: la orden lo
        // adopta para que la pantalla informe la fecha real del cupón.
        if (payment.date_of_expiration) {
            const vence = new Date(payment.date_of_expiration);
            if (!Number.isNaN(vence.getTime())) common.expiresAt = vence;
        }

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
        // Sólo hay algo que revertir si en algún momento se acreditó. Un
        // `refunded` sobre una orden que nunca llegó a APPROVED (PSE que el
        // banco devolvió sin que nos enteráramos del approved) no revierte
        // nada: cae al registro genérico de estado, más abajo, para que la
        // orden no se quede en «pendiente» para siempre.
        if (shouldReverse(status) && pkg && order.creditTransactionId) {
            const result = await prisma.$transaction(
                async (tx) => {
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
        const cerrada =
            status === "REJECTED" ||
            status === "CANCELLED" ||
            status === "REFUNDED" ||
            status === "CHARGED_BACK";
        await prisma.paymentOrder.updateMany({
            where: { id: order.id, status: { notIn: SETTLED } },
            data: { ...common, status, completedAt: cerrada ? new Date() : null },
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
     * Barrido programado. Hace tres cosas distintas y conviene no confundirlas:
     *
     *  · Vencer órdenes CREATED que nunca se intentaron pagar. Son basura.
     *  · Reconciliar órdenes que SÍ se intentaron y quedaron a medias. Aquí
     *    puede haber dinero real esperando acreditarse, así que jamás se vencen
     *    por antigüedad sin consultar antes a Mercado Pago.
     *  · Declarar huérfanas las PROCESSING sin pago pasado el plazo de gracia
     *    (lo hace `syncOrder`), para que no acaparen las ejecuciones.
     *
     * Se recorren primero las que llevan más tiempo sin consultarse
     * (`lastSyncedAt`), de modo que ninguna orden — resoluble o no — bloquee a
     * las demás, y se respeta un presupuesto de tiempo.
     */
    static async sweepStaleOrders(options?: {
        limit?: number;
        timeBudgetMs?: number;
    }): Promise<{
        expired: number;
        reconciled: number;
        orphaned: number;
        failed: number;
        skipped: number;
    }> {
        const limit = options?.limit ?? 25;
        const deadline = Date.now() + (options?.timeBudgetMs ?? SWEEP_TIME_BUDGET_MS);
        const now = new Date();

        const { count: expired } = await prisma.paymentOrder.updateMany({
            where: { status: "CREATED", expiresAt: { lt: now } },
            data: { status: "EXPIRED", completedAt: now },
        });

        const pendientes = await prisma.paymentOrder.findMany({
            where: { status: { in: ["PROCESSING", "PENDING", "IN_PROCESS"] } },
            orderBy: [{ lastSyncedAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
            take: limit,
        });

        let reconciled = 0;
        let orphaned = 0;
        let failed = 0;
        let procesadas = 0;

        for (const order of pendientes) {
            if (Date.now() > deadline) break;
            procesadas += 1;
            try {
                const result = await this.syncOrder(order);
                if (result.outcome === "expired_orphan") orphaned += 1;
                else if (result.outcome !== "payment_not_found") reconciled += 1;
            } catch (error) {
                failed += 1;
                console.error(
                    `[PAGOS] No se pudo reconciliar ${order.internalRef}:`,
                    error instanceof Error ? error.message : error
                );
            }
        }

        return {
            expired,
            reconciled,
            orphaned,
            failed,
            skipped: pendientes.length - procesadas,
        };
    }
}
