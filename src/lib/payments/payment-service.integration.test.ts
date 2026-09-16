import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Pruebas de integración de la acreditación, contra un PostgreSQL de verdad.
 *
 * La idempotencia de los créditos NO se puede verificar con dobles de prueba:
 * depende del comportamiento real de los bloqueos de fila de PostgreSQL cuando
 * dos transacciones compiten por la misma orden. Un mock siempre «pasaría».
 *
 * Se omiten solas si no hay `TEST_DATABASE_URL`, para que `npm test` siga
 * funcionando en CI sin base de datos. Para correrlas:
 *
 *   createdb psicosst_test
 *   DATABASE_URL=postgresql://…/psicosst_test npx prisma migrate deploy
 *   TEST_DATABASE_URL=postgresql://…/psicosst_test npx vitest run
 */

const TEST_DB = process.env.TEST_DATABASE_URL;
const pruebaDeIntegracion = TEST_DB ? describe : describe.skip;

// La API de Mercado Pago se sustituye: lo que se prueba aquí es NUESTRA lógica
// de acreditación, no la suya.
vi.mock("@/lib/payments/mercadopago-client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./mercadopago-client")>();
    return {
        ...actual,
        fetchPayment: vi.fn(),
        createPayment: vi.fn(),
        searchPaymentsByExternalReference: vi.fn(),
    };
});

type Modulos = {
    prisma: typeof import("@/lib/prisma").prisma;
    PaymentService: typeof import("./payment-service").PaymentService;
    PaymentOrderError: typeof import("./payment-service").PaymentOrderError;
    cliente: typeof import("./mercadopago-client");
};

let m: Modulos;
let psicologoId: string;

/** Un pago de Mercado Pago con los campos que mira `applyPayment`. */
function pagoFalso(over: Record<string, unknown> = {}) {
    return {
        id: 123456789,
        status: "approved",
        status_detail: "accredited",
        external_reference: null,
        transaction_amount: 200000,
        currency_id: "COP",
        payment_method_id: "visa",
        payment_type_id: "credit_card",
        live_mode: false,
        date_of_expiration: null,
        ...over,
    };
}

pruebaDeIntegracion("PaymentService · acreditación idempotente", () => {
    beforeAll(async () => {
        process.env.DATABASE_URL = TEST_DB;
        process.env.MP_ACCESS_TOKEN = "TEST-token-de-pruebas";
        process.env.NEXT_PUBLIC_MP_PUBLIC_KEY = "TEST-public-key";
        process.env.MP_WEBHOOK_SECRET = "secreto";

        const servicio = await import("./payment-service");
        m = {
            prisma: (await import("@/lib/prisma")).prisma,
            PaymentService: servicio.PaymentService,
            PaymentOrderError: servicio.PaymentOrderError,
            cliente: await import("./mercadopago-client"),
        };
    });

    afterAll(async () => {
        await m?.prisma.$disconnect();
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        await m.prisma.paymentOrder.deleteMany();
        await m.prisma.creditTransaction.deleteMany();
        await m.prisma.auditLog.deleteMany();
        await m.prisma.psychologist.deleteMany();

        const psicologo = await m.prisma.psychologist.create({
            data: {
                email: `pago-${randomUUID()}@psicosst.test`,
                passwordHash: "x",
                fullName: "Psicóloga de prueba",
                licenseNumber: randomUUID(),
                professionalCard: "PC",
                sstCredential: "SST",
                creditBalance: 0,
            },
        });
        psicologoId = psicologo.id;
    });

    async function ordenAprobada() {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef }) as never
        );
        return orden;
    }

    const saldo = async () =>
        (await m.prisma.psychologist.findUniqueOrThrow({
            where: { id: psicologoId },
            select: { creditBalance: true },
        })).creditBalance;

    it("acredita una sola vez con SEIS webhooks simultáneos", async () => {
        await ordenAprobada();

        // El escenario real: Mercado Pago reintenta y las notificaciones se
        // solapan. Sin el cerrojo, aquí se regalarían 500 créditos.
        const resultados = await Promise.all(
            Array.from({ length: 6 }, () =>
                m.PaymentService.reconcileByPaymentId("123456789")
            )
        );

        expect(resultados.filter((r) => r.outcome === "credited")).toHaveLength(1);
        expect(resultados.filter((r) => r.outcome === "already_settled")).toHaveLength(5);
        expect(await saldo()).toBe(100);
        expect(await m.prisma.creditTransaction.count({ where: { type: "PURCHASE" } })).toBe(1);
        // Y una sola entrada de auditoría: el registro va DESPUÉS del cerrojo.
        expect(await m.prisma.auditLog.count({ where: { action: "CREDIT_PURCHASE" } })).toBe(1);
    });

    it("no vuelve a acreditar en reintentos secuenciales", async () => {
        await ordenAprobada();

        await m.PaymentService.reconcileByPaymentId("123456789");
        await m.PaymentService.reconcileByPaymentId("123456789");
        await m.PaymentService.reconcileByPaymentId("123456789");

        expect(await saldo()).toBe(100);
    });

    it("encuentra la orden por external_reference aunque el pago llegue primero", async () => {
        // La carrera que rompe las integraciones ingenuas: el webhook llega
        // ANTES de que /process haya guardado el identificador del pago.
        const orden = await ordenAprobada();
        expect(orden.mercadoPagoPaymentId).toBeNull();

        const resultado = await m.PaymentService.reconcileByPaymentId("123456789");

        expect(resultado.outcome).toBe("credited");
        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({
            where: { id: orden.id },
        });
        expect(fresca.mercadoPagoPaymentId).toBe("123456789");
        expect(fresca.creditTransactionId).not.toBeNull();
    });

    it("NO acredita si el monto no coincide con el paquete", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({
                external_reference: orden.internalRef,
                transaction_amount: 1000, // pagó $1.000 por un paquete de $200.000
            }) as never
        );

        const resultado = await m.PaymentService.reconcileByPaymentId("123456789");

        expect(resultado.outcome).toBe("amount_mismatch");
        expect(await saldo()).toBe(0);
        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("ERROR");
        expect(fresca.creditTransactionId).toBeNull();
    });

    it("NO acredita si la moneda no es COP", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, currency_id: "ARS" }) as never
        );

        expect((await m.PaymentService.reconcileByPaymentId("123456789")).outcome)
            .toBe("amount_mismatch");
        expect(await saldo()).toBe(0);
    });

    it("no entrega créditos por un pago rechazado ni pendiente", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");

        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "pending" }) as never
        );
        await m.PaymentService.reconcileByPaymentId("123456789");
        expect(await saldo()).toBe(0);

        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "rejected" }) as never
        );
        await m.PaymentService.reconcileByPaymentId("123456789");
        expect(await saldo()).toBe(0);
    });

    it("una notificación vieja no degrada una orden ya aprobada", async () => {
        const orden = await ordenAprobada();
        await m.PaymentService.reconcileByPaymentId("123456789");
        expect(await saldo()).toBe(100);

        // Notificación rezagada con estado anterior.
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "pending" }) as never
        );
        await m.PaymentService.reconcileByPaymentId("123456789");

        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("APPROVED");
        expect(await saldo()).toBe(100);
    });

    it("revierte los créditos ante un contracargo, una sola vez", async () => {
        const orden = await ordenAprobada();
        await m.PaymentService.reconcileByPaymentId("123456789");
        expect(await saldo()).toBe(100);

        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "charged_back" }) as never
        );

        const resultados = await Promise.all([
            m.PaymentService.reconcileByPaymentId("123456789"),
            m.PaymentService.reconcileByPaymentId("123456789"),
            m.PaymentService.reconcileByPaymentId("123456789"),
        ]);

        expect(resultados.filter((r) => r.outcome === "reversed")).toHaveLength(1);
        expect(await saldo()).toBe(0);
        expect(await m.prisma.creditTransaction.count({ where: { type: "REVERSAL" } })).toBe(1);
    });

    it("deja el saldo en negativo si ya se gastaron los créditos revertidos", async () => {
        const orden = await ordenAprobada();
        await m.PaymentService.reconcileByPaymentId("123456789");

        // El psicólogo gasta 100 créditos antes de que llegue el contracargo.
        await m.prisma.psychologist.update({
            where: { id: psicologoId },
            data: { creditBalance: 0 },
        });

        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "refunded" }) as never
        );
        await m.PaymentService.reconcileByPaymentId("123456789");

        // Negativo a propósito: dejarlo en cero le regalaría el consumo.
        expect(await saldo()).toBe(-100);
    });

    it("reutiliza la orden CREATED en vez de sembrar órdenes muertas", async () => {
        const a = await m.PaymentService.createOrder(psicologoId, "starter");
        const b = await m.PaymentService.createOrder(psicologoId, "starter");
        expect(b.id).toBe(a.id);
        expect(await m.prisma.paymentOrder.count()).toBe(1);
    });

    it("fija el monto desde el catálogo del servidor", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "enterprise");
        expect(orden.amountCOP).toBe(750000);
    });

    it("ignora un pago que no corresponde a ninguna orden", async () => {
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: "referencia-ajena" }) as never
        );
        expect((await m.PaymentService.reconcileByPaymentId("123456789")).outcome)
            .toBe("order_not_found");
    });

    it("acusa recibo de un pago inexistente sin fallar", async () => {
        // El botón «simular notificación» del panel manda identificadores falsos.
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(null as never);
        expect((await m.PaymentService.reconcileByPaymentId("999")).outcome)
            .toBe("payment_not_found");
    });

    // ── Cobro: reclamo de la orden y clasificación de fallos ─────────────────

    const contextoCobro = (internalRef: string) => ({
        psychologistId: psicologoId,
        internalRef,
        form: { payment_method_id: "visa", token: "tok", payer: { email: "c@c.co" } },
        payer: { email: "ana@c.co", firstName: "Ana", lastName: "Pérez" },
        ipAddress: "190.1.1.1",
        callbackUrl: "https://app/checkout",
        notificationUrl: "https://app/api/payments/webhook",
    });

    it("rechaza un segundo cobro concurrente sobre la misma orden", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        // El primero tarda: el segundo llega mientras la orden está PROCESSING.
        vi.mocked(m.cliente.createPayment).mockImplementation(async () => {
            await new Promise((r) => setTimeout(r, 120));
            return pagoFalso({ external_reference: orden.internalRef }) as never;
        });

        const resultados = await Promise.allSettled([
            m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef)),
            m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef)),
        ]);

        const ok = resultados.filter((r) => r.status === "fulfilled");
        const ko = resultados.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        expect(ok).toHaveLength(1);
        expect(ko).toHaveLength(1);
        expect(ko[0].reason).toBeInstanceOf(m.PaymentOrderError);
        expect(ko[0].reason.code).toBe("ORDER_NOT_PAYABLE");
        // Un solo cobro llegó a Mercado Pago y un solo asiento de créditos.
        expect(vi.mocked(m.cliente.createPayment)).toHaveBeenCalledTimes(1);
        expect(await saldo()).toBe(100);
    });

    it("un 4xx devuelve la orden a CREATED y el siguiente intento lleva otra llave", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        vi.mocked(m.cliente.createPayment).mockRejectedValueOnce(
            new m.cliente.MercadoPagoApiError("Payer email forbidden", 403, ["4390 - Payer email forbidden"])
        );

        await expect(
            m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef))
        ).rejects.toBeInstanceOf(m.cliente.MercadoPagoApiError);

        let fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("CREATED"); // reintentable
        expect(fresca.attemptCount).toBe(1);
        expect(fresca.processingAt).toBeNull();
        expect(fresca.statusDetail).toContain("rechazo_403");

        // Segundo intento sobre la MISMA orden: ahora Mercado Pago acepta.
        vi.mocked(m.cliente.createPayment).mockResolvedValueOnce(
            pagoFalso({ external_reference: orden.internalRef }) as never
        );
        const r = await m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef));
        expect(r.outcome).toBe("credited");

        fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.attemptCount).toBe(2);
        expect(await saldo()).toBe(100);

        // Cada intento con su llave de idempotencia: distintas entre sí y
        // ambas derivadas de la referencia de la orden.
        const llaves = vi.mocked(m.cliente.createPayment).mock.calls.map((c) => c[1]);
        expect(llaves).toHaveLength(2);
        expect(llaves[0]).not.toBe(llaves[1]);
        for (const k of llaves) expect(k.startsWith(`${orden.internalRef}#`)).toBe(true);
    });

    it("un 5xx deja la orden en PROCESSING para que la reconciliación decida", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        vi.mocked(m.cliente.createPayment).mockRejectedValueOnce(
            new m.cliente.MercadoPagoApiError("Oops! Something went wrong", 500, ["1090"])
        );

        await expect(
            m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef))
        ).rejects.toBeInstanceOf(m.cliente.MercadoPagoApiError);

        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("PROCESSING");
        expect(fresca.processingAt).not.toBeNull();
        expect(await saldo()).toBe(0);
    });

    it("una orden vencida no se puede cobrar y el motivo es el correcto", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        await m.prisma.paymentOrder.update({
            where: { id: orden.id },
            data: { expiresAt: new Date(Date.now() - 60_000) },
        });
        await expect(
            m.PaymentService.processBrickPayment(contextoCobro(orden.internalRef))
        ).rejects.toMatchObject({ code: "ORDER_EXPIRED" });
        expect(vi.mocked(m.cliente.createPayment)).not.toHaveBeenCalled();
    });

    // ── Órdenes huérfanas y reconciliación perezosa ──────────────────────────

    async function ordenProcessing(minutos: number) {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        return m.prisma.paymentOrder.update({
            where: { id: orden.id },
            data: {
                status: "PROCESSING",
                attemptCount: 1,
                processingAt: new Date(Date.now() - minutos * 60_000),
            },
        });
    }

    it("vence una orden PROCESSING sin pago en Mercado Pago pasado el plazo de gracia", async () => {
        const orden = await ordenProcessing(20);
        vi.mocked(m.cliente.searchPaymentsByExternalReference).mockResolvedValue([]);

        const r = await m.PaymentService.syncOrder(orden);

        expect(r.outcome).toBe("expired_orphan");
        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("EXPIRED");
        expect(fresca.statusDetail).toBe("no_payment_registered");
        expect(fresca.lastSyncedAt).not.toBeNull();
    });

    it("dentro del plazo de gracia sólo informa que aún no hay pago", async () => {
        const orden = await ordenProcessing(1);
        vi.mocked(m.cliente.searchPaymentsByExternalReference).mockResolvedValue([]);

        const r = await m.PaymentService.syncOrder(orden);

        expect(r.outcome).toBe("payment_not_found");
        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("PROCESSING");
    });

    it("rescata por external_reference una orden PROCESSING cuya respuesta se perdió", async () => {
        const orden = await ordenProcessing(2);
        vi.mocked(m.cliente.searchPaymentsByExternalReference).mockResolvedValue([
            pagoFalso({ external_reference: orden.internalRef }) as never,
        ]);

        const r = await m.PaymentService.syncOrder(orden);

        expect(r.outcome).toBe("credited");
        expect(await saldo()).toBe(100);
    });

    it("una orden EXPIRED sigue pudiendo acreditarse si el dinero llega después", async () => {
        const orden = await m.PaymentService.createOrder(psicologoId, "business");
        await m.prisma.paymentOrder.update({ where: { id: orden.id }, data: { status: "EXPIRED" } });
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef }) as never
        );

        const r = await m.PaymentService.reconcileByPaymentId("123456789");

        expect(r.outcome).toBe("credited");
        expect(await saldo()).toBe(100);
    });

    it("un refunded sobre una orden nunca acreditada la cierra sin revertir nada", async () => {
        const orden = await ordenProcessing(2);
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({ external_reference: orden.internalRef, status: "refunded" }) as never
        );

        const r = await m.PaymentService.reconcileByPaymentId("123456789");

        expect(r.outcome).toBe("updated");
        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("REFUNDED"); // ya no queda «pendiente» para siempre
        expect(fresca.creditTransactionId).toBeNull();
        expect(await saldo()).toBe(0);
        expect(await m.prisma.creditTransaction.count({ where: { type: "REVERSAL" } })).toBe(0);
    });

    it("adopta la fecha de vencimiento del cupón de Efecty", async () => {
        const orden = await ordenProcessing(1);
        const vence = new Date(Date.now() + 7 * 24 * 3600_000);
        vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
            pagoFalso({
                external_reference: orden.internalRef,
                status: "pending",
                status_detail: "pending_waiting_payment",
                payment_method_id: "efecty",
                payment_type_id: "ticket",
                date_of_expiration: vence.toISOString(),
            }) as never
        );

        await m.PaymentService.reconcileByPaymentId("123456789");

        const fresca = await m.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orden.id } });
        expect(fresca.status).toBe("PENDING");
        expect(Math.abs(fresca.expiresAt.getTime() - vence.getTime())).toBeLessThan(1000);
    });

    // ── Barrido ──────────────────────────────────────────────────────────────

    it("el barrido vence huérfanas, respeta el presupuesto y no se atasca", async () => {
        await ordenProcessing(30);
        await ordenProcessing(30);
        await ordenProcessing(30);
        vi.mocked(m.cliente.searchPaymentsByExternalReference).mockResolvedValue([]);

        // Sin presupuesto no se toca nada: queda para la siguiente ejecución.
        const sinTiempo = await m.PaymentService.sweepStaleOrders({ timeBudgetMs: 0 });
        expect(sinTiempo.skipped).toBe(3);
        expect(sinTiempo.orphaned).toBe(0);

        const conTiempo = await m.PaymentService.sweepStaleOrders({ timeBudgetMs: 10_000 });
        expect(conTiempo.orphaned).toBe(3);
        expect(conTiempo.skipped).toBe(0);
        expect(await m.prisma.paymentOrder.count({ where: { status: "EXPIRED" } })).toBe(3);
    });

    it("el barrido vence las CREATED abandonadas y atiende primero las menos consultadas", async () => {
        const abandonada = await m.PaymentService.createOrder(psicologoId, "starter");
        await m.prisma.paymentOrder.update({
            where: { id: abandonada.id },
            data: { expiresAt: new Date(Date.now() - 60_000) },
        });
        const reciente = await ordenProcessing(2);
        await m.prisma.paymentOrder.update({
            where: { id: reciente.id },
            data: { lastSyncedAt: new Date() },
        });
        const nuncaConsultada = await ordenProcessing(2);
        vi.mocked(m.cliente.searchPaymentsByExternalReference).mockResolvedValue([]);

        const r = await m.PaymentService.sweepStaleOrders({ limit: 1, timeBudgetMs: 10_000 });

        expect(r.expired).toBe(1);
        // Con límite 1, la primera en atenderse es la que nunca se consultó.
        expect(vi.mocked(m.cliente.searchPaymentsByExternalReference))
            .toHaveBeenCalledWith(nuncaConsultada.internalRef);
        expect(vi.mocked(m.cliente.searchPaymentsByExternalReference)).toHaveBeenCalledTimes(1);
    });
});
