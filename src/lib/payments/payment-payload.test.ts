import { describe, expect, it } from "vitest";
import { buildPaymentPayload } from "./payment-service";
import { describeGatewayRejection } from "./status-map";

/**
 * Pruebas puras del armado del cuerpo de POST /v1/payments. Sin base de datos:
 * `buildPaymentPayload` no toca nada externo a propósito.
 */

const orden = { amountCOP: 200000, internalRef: "psicosst-abc" };
const base = {
    order: orden,
    packageName: "Business",
    credits: 100,
    payer: { email: "ana@consultorio.co", firstName: "Ana", lastName: "Pérez" },
    ipAddress: "190.1.1.1",
    callbackUrl: "https://app.example/dashboard/credits/checkout/psicosst-abc",
    notificationUrl: "https://app.example/api/payments/webhook",
};

describe("buildPaymentPayload", () => {
    it("fija monto y referencia desde la orden, nunca desde el formulario", () => {
        const p = buildPaymentPayload({ ...base, form: { payment_method_id: "visa", token: "tok" } });
        expect(p.transaction_amount).toBe(200000);
        expect(p.external_reference).toBe("psicosst-abc");
        expect(p.statement_descriptor).toBe("PSICOSST");
    });

    it("añade lo que PSE exige y el Brick no envía: IP y callback_url", () => {
        // Verificado contra el sandbox: sin ip_address, Mercado Pago responde
        // «additional_info.ip_address cant be null».
        const p = buildPaymentPayload({
            ...base,
            form: {
                payment_method_id: "pse",
                payer: { entity_type: "individual", identification: { type: "CC", number: "1" } },
                transaction_details: { financial_institution: "1001" },
            },
        });
        expect(p.additional_info).toEqual({ ip_address: "190.1.1.1" });
        expect(p.callback_url).toBe(base.callbackUrl);
        expect(p.notification_url).toBe(base.notificationUrl);
        expect(p.transaction_details).toEqual({ financial_institution: "1001" });
        expect(p.payer).toMatchObject({
            entity_type: "individual",
            identification: { type: "CC", number: "1" },
            // Nombre y correo desde la sesión, porque el Brick no los manda en PSE.
            email: "ana@consultorio.co",
            first_name: "Ana",
            last_name: "Pérez",
        });
    });

    it("el formulario tiene prioridad sobre la sesión para correo y nombre", () => {
        const p = buildPaymentPayload({
            ...base,
            form: { payment_method_id: "efecty", payer: { email: "otro@correo.co", first_name: "Otra" } },
        });
        expect(p.payer).toMatchObject({ email: "otro@correo.co", first_name: "Otra", last_name: "Pérez" });
    });

    it("omite IP, callback y notification cuando no hay origen público (desarrollo local)", () => {
        const p = buildPaymentPayload({
            ...base,
            ipAddress: null,
            callbackUrl: null,
            notificationUrl: null,
            form: { payment_method_id: "visa", token: "tok" },
        });
        expect(p).not.toHaveProperty("additional_info");
        expect(p).not.toHaveProperty("callback_url");
        expect(p).not.toHaveProperty("notification_url");
    });

    it("no reenvía campos que no están en la lista permitida", () => {
        const p = buildPaymentPayload({
            ...base,
            form: { payment_method_id: "visa", token: "tok", ...({ transaction_amount: 1 } as object) },
        });
        expect(p.transaction_amount).toBe(200000);
        expect(Object.keys(p)).not.toContain("metadata");
    });

    it("sólo incluye cuotas cuando son positivas", () => {
        expect(buildPaymentPayload({ ...base, form: { payment_method_id: "visa", installments: 0 } }))
            .not.toHaveProperty("installments");
        expect(buildPaymentPayload({ ...base, form: { payment_method_id: "visa", installments: 3 } }).installments)
            .toBe(3);
    });
});

describe("describeGatewayRejection", () => {
    it("traduce el rechazo de correo del sandbox a algo accionable", () => {
        expect(describeGatewayRejection("Payer email forbidden", ["4390 - Payer email forbidden"]))
            .toContain("correo distinto");
    });

    it("explica la falta de IP para PSE", () => {
        expect(describeGatewayRejection("additional_info.ip_address cant be null")).toContain("PSE");
    });

    it("muestra el mensaje crudo cuando no lo conoce, sin ocultarlo", () => {
        expect(describeGatewayRejection("Something unexpected")).toContain("Something unexpected");
    });
});
