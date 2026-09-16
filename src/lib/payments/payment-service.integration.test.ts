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
vi.mock("@/lib/payments/mercadopago-client", () => ({
    fetchPayment: vi.fn(),
    createPayment: vi.fn(),
    searchPaymentsByExternalReference: vi.fn(),
    resolveExternalResourceUrl: () => null,
    MercadoPagoApiError: class MercadoPagoApiError extends Error {},
}));

type Modulos = {
    prisma: typeof import("@/lib/prisma").prisma;
    PaymentService: typeof import("./payment-service").PaymentService;
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

        m = {
            prisma: (await import("@/lib/prisma")).prisma,
            PaymentService: (await import("./payment-service")).PaymentService,
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
});
