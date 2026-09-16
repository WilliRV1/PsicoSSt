import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Renovación automática, contra un PostgreSQL de verdad y con la API de
 * Mercado Pago sustituida.
 *
 * Lo que se verifica aquí es NUESTRA parte: que un cobro recurrente termine
 * extendiendo el periodo por el mismo camino que un pago manual, que una
 * notificación repetida no cobre ni acredite dos veces, y que una autorización
 * ajena o desconocida no toque ninguna suscripción. Nada de esto se puede
 * comprobar con dobles: depende de las llaves únicas reales de la base.
 *
 *   TEST_DATABASE_URL=postgresql://…/psicosst_test npx vitest run auto-renewal
 */

const TEST_DB = process.env.TEST_DATABASE_URL;
const pruebaDeIntegracion = TEST_DB ? describe : describe.skip;

vi.mock("@/lib/payments/mercadopago-client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./mercadopago-client")>();
    return {
        ...actual,
        fetchPayment: vi.fn(),
        createPayment: vi.fn(),
        searchPaymentsByExternalReference: vi.fn(),
        createPreapproval: vi.fn(),
        fetchPreapproval: vi.fn(),
        cancelPreapproval: vi.fn(),
        fetchAuthorizedPayment: vi.fn(),
    };
});

type Modulos = {
    prisma: typeof import("@/lib/prisma").prisma;
    AutoRenewalService: typeof import("./auto-renewal-service").AutoRenewalService;
    AutoRenewalError: typeof import("./auto-renewal-service").AutoRenewalError;
    cliente: typeof import("./mercadopago-client");
};

let m: Modulos;
let psicologoId: string;

/** SKU real del catálogo: la prueba no debe inventar precios ni cadencias. */
const SKU_ANUAL = "PROFESIONAL_YEAR";
/**
 * Debe coincidir con el precio del SKU: `validateApprovedPayment` rechaza —con
 * razón— un pago cuyo monto no sea el de la orden. Que esta constante tenga
 * que existir es la prueba de que esa defensa también cubre el cobro
 * recurrente.
 */
const PRECIO_ANUAL = 1_050_000;

function pagoFalso(over: Record<string, unknown> = {}) {
    return {
        id: 987654321,
        status: "approved",
        status_detail: "accredited",
        external_reference: null,
        transaction_amount: PRECIO_ANUAL,
        currency_id: "COP",
        payment_method_id: "visa",
        payment_type_id: "credit_card",
        live_mode: false,
        date_of_expiration: null,
        ...over,
    };
}

pruebaDeIntegracion("AutoRenewalService · renovación recurrente", () => {
    beforeAll(async () => {
        process.env.DATABASE_URL = TEST_DB;
        process.env.MP_ACCESS_TOKEN = "TEST-token-de-pruebas";
        process.env.NEXT_PUBLIC_MP_PUBLIC_KEY = "TEST-public-key";
        process.env.MP_WEBHOOK_SECRET = "secreto";

        const servicio = await import("./auto-renewal-service");
        m = {
            prisma: (await import("@/lib/prisma")).prisma,
            AutoRenewalService: servicio.AutoRenewalService,
            AutoRenewalError: servicio.AutoRenewalError,
            cliente: await import("./mercadopago-client"),
        };
    });

    afterAll(async () => {
        await m?.prisma.$disconnect();
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        await m.prisma.subscription.deleteMany();
        await m.prisma.paymentOrder.deleteMany();
        await m.prisma.creditTransaction.deleteMany();
        await m.prisma.auditLog.deleteMany();
        await m.prisma.psychologist.deleteMany();

        const psicologo = await m.prisma.psychologist.create({
            data: {
                email: `auto-${randomUUID()}@psicosst.test`,
                passwordHash: "x",
                fullName: "Psicóloga de prueba",
                licenseNumber: randomUUID(),
                professionalCard: "PC",
                sstCredential: "SST",
                status: "ACTIVE",
            },
        });
        psicologoId = psicologo.id;
    });

    /** Suscripción vigente, como la dejaría una compra manual. */
    async function suscripcionVigente(over: Record<string, unknown> = {}) {
        return m.prisma.subscription.create({
            data: {
                psychologistId: psicologoId,
                plan: "PROFESIONAL",
                billingPeriod: "ANNUAL",
                status: "ACTIVE",
                periodStart: new Date(),
                periodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                quotaGranted: 30,
                ...over,
            },
        });
    }

    describe("activar la autorización", () => {
        it("guarda el preapproval en PENDING y devuelve el enlace de aprobación", async () => {
            await suscripcionVigente();
            vi.mocked(m.cliente.createPreapproval).mockResolvedValue({
                id: "preap-1",
                status: "pending",
                init_point: "https://mp.test/autorizar",
            });

            const r = await m.AutoRenewalService.authorize({
                psychologistId: psicologoId,
                skuId: SKU_ANUAL,
                origin: "https://app.test",
            });

            expect(r.initPoint).toBe("https://mp.test/autorizar");

            const sub = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            // PENDING, no AUTHORIZED: aprobar ocurre en el dominio de Mercado
            // Pago y sólo su webhook puede confirmarlo.
            expect(sub?.autoRenewStatus).toBe("PENDING");
            expect(sub?.preapprovalId).toBe("preap-1");
            expect(sub?.autoRenewSku).toBe(SKU_ANUAL);
        });

        it("no deja dos autorizaciones vivas: cancela la pendiente anterior", async () => {
            await suscripcionVigente({
                preapprovalId: "preap-viejo",
                autoRenewStatus: "PENDING",
                autoRenewSku: SKU_ANUAL,
            });
            vi.mocked(m.cliente.cancelPreapproval).mockResolvedValue({
                id: "preap-viejo",
                status: "cancelled",
            });
            vi.mocked(m.cliente.createPreapproval).mockResolvedValue({
                id: "preap-nuevo",
                status: "pending",
                init_point: "https://mp.test/autorizar",
            });

            await m.AutoRenewalService.authorize({
                psychologistId: psicologoId,
                skuId: SKU_ANUAL,
                origin: "https://app.test",
            });

            expect(m.cliente.cancelPreapproval).toHaveBeenCalledWith("preap-viejo");
        });

        it("rechaza activarla dos veces", async () => {
            await suscripcionVigente({
                preapprovalId: "preap-1",
                autoRenewStatus: "AUTHORIZED",
                autoRenewSku: SKU_ANUAL,
            });

            await expect(
                m.AutoRenewalService.authorize({
                    psychologistId: psicologoId,
                    skuId: SKU_ANUAL,
                    origin: "https://app.test",
                })
            ).rejects.toMatchObject({ code: "ALREADY_AUTHORIZED" });
            expect(m.cliente.createPreapproval).not.toHaveBeenCalled();
        });

        it("sin suscripción no hay nada que renovar", async () => {
            await expect(
                m.AutoRenewalService.authorize({
                    psychologistId: psicologoId,
                    skuId: SKU_ANUAL,
                    origin: "https://app.test",
                })
            ).rejects.toMatchObject({ code: "NO_SUBSCRIPTION" });
        });
    });

    describe("cambios de estado desde Mercado Pago", () => {
        it("una autorización aprobada pasa a AUTHORIZED", async () => {
            await suscripcionVigente({
                preapprovalId: "preap-1",
                autoRenewStatus: "PENDING",
                autoRenewSku: SKU_ANUAL,
            });
            vi.mocked(m.cliente.fetchPreapproval).mockResolvedValue({
                id: "preap-1",
                status: "authorized",
            });

            const r = await m.AutoRenewalService.syncFromPreapproval("preap-1");

            expect(r.outcome).toBe("updated");
            const sub = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            expect(sub?.autoRenewStatus).toBe("AUTHORIZED");
        });

        it("un preapproval que no es nuestro no toca ninguna suscripción", async () => {
            await suscripcionVigente({
                preapprovalId: "preap-1",
                autoRenewStatus: "AUTHORIZED",
                autoRenewSku: SKU_ANUAL,
            });

            const r = await m.AutoRenewalService.syncFromPreapproval("preap-de-otro");

            expect(r.outcome).toBe("unknown_preapproval");
            expect(m.cliente.fetchPreapproval).not.toHaveBeenCalled();
            const sub = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            expect(sub?.autoRenewStatus).toBe("AUTHORIZED");
        });
    });

    describe("cobro de un periodo", () => {
        beforeEach(async () => {
            await suscripcionVigente({
                preapprovalId: "preap-1",
                autoRenewStatus: "AUTHORIZED",
                autoRenewSku: SKU_ANUAL,
            });
        });

        it("extiende el periodo y suma cupo, por el mismo camino que un pago manual", async () => {
            const antes = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });

            vi.mocked(m.cliente.fetchAuthorizedPayment).mockResolvedValue({
                id: "auth-1",
                preapproval_id: "preap-1",
                payment: { id: 987654321, status: "approved" },
            });
            vi.mocked(m.cliente.fetchPayment).mockResolvedValue(pagoFalso());

            await m.AutoRenewalService.applyRecurringPayment("auth-1");

            const despues = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            expect(despues!.periodEnd.getTime()).toBeGreaterThan(antes!.periodEnd.getTime());
            expect(despues!.quotaGranted).toBeGreaterThan(antes!.quotaGranted);
            expect(despues!.status).toBe("ACTIVE");
        });

        it("la misma notificación dos veces no acredita ni cobra dos veces", async () => {
            vi.mocked(m.cliente.fetchAuthorizedPayment).mockResolvedValue({
                id: "auth-1",
                preapproval_id: "preap-1",
                payment: { id: 987654321, status: "approved" },
            });
            vi.mocked(m.cliente.fetchPayment).mockResolvedValue(pagoFalso());

            await m.AutoRenewalService.applyRecurringPayment("auth-1");
            const trasPrimera = await m.prisma.subscription.findUnique({
                where: { psychologistId: psicologoId },
            });

            await m.AutoRenewalService.applyRecurringPayment("auth-1");
            const trasSegunda = await m.prisma.subscription.findUnique({
                where: { psychologistId: psicologoId },
            });

            expect(trasSegunda!.periodEnd.getTime()).toBe(trasPrimera!.periodEnd.getTime());
            expect(trasSegunda!.quotaGranted).toBe(trasPrimera!.quotaGranted);

            const ordenes = await m.prisma.paymentOrder.count();
            expect(ordenes).toBe(1);
        });

        it("un cobro de una autorización desconocida no crea orden alguna", async () => {
            vi.mocked(m.cliente.fetchAuthorizedPayment).mockResolvedValue({
                id: "auth-x",
                preapproval_id: "preap-de-otro",
                payment: { id: 111222333, status: "approved" },
            });

            const r = await m.AutoRenewalService.applyRecurringPayment("auth-x");

            expect(r.outcome).toBe("unknown_preapproval");
            expect(await m.prisma.paymentOrder.count()).toBe(0);
        });

        it("un cobro rechazado no extiende el periodo", async () => {
            const antes = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });

            vi.mocked(m.cliente.fetchAuthorizedPayment).mockResolvedValue({
                id: "auth-2",
                preapproval_id: "preap-1",
                payment: { id: 555555555, status: "rejected" },
            });
            vi.mocked(m.cliente.fetchPayment).mockResolvedValue(
                pagoFalso({ id: 555555555, status: "rejected", status_detail: "cc_rejected_insufficient_amount" })
            );

            await m.AutoRenewalService.applyRecurringPayment("auth-2");

            const despues = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            expect(despues!.periodEnd.getTime()).toBe(antes!.periodEnd.getTime());
            expect(despues!.quotaGranted).toBe(antes!.quotaGranted);
        });
    });

    describe("cancelar", () => {
        it("cancela en Mercado Pago y deja intacto el periodo ya pagado", async () => {
            const sub = await suscripcionVigente({
                preapprovalId: "preap-1",
                autoRenewStatus: "AUTHORIZED",
                autoRenewSku: SKU_ANUAL,
            });
            vi.mocked(m.cliente.cancelPreapproval).mockResolvedValue({
                id: "preap-1",
                status: "cancelled",
            });

            await m.AutoRenewalService.cancel(psicologoId);

            const despues = await m.prisma.subscription.findUnique({ where: { psychologistId: psicologoId } });
            expect(despues?.autoRenewStatus).toBe("CANCELLED");
            // El plan sigue vigente: se cancela la renovación, no lo comprado.
            expect(despues!.periodEnd.getTime()).toBe(sub.periodEnd.getTime());
            expect(despues?.status).toBe("ACTIVE");
        });

        it("sin autorización activa avisa en vez de llamar a Mercado Pago", async () => {
            await suscripcionVigente();

            await expect(m.AutoRenewalService.cancel(psicologoId)).rejects.toMatchObject({
                code: "NOT_AUTHORIZED",
            });
            expect(m.cliente.cancelPreapproval).not.toHaveBeenCalled();
        });
    });
});
