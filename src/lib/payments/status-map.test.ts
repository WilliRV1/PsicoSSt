import { describe, expect, it } from "vitest";
import {
    describeStatusDetail,
    isPending,
    isTerminal,
    mapPaymentStatus,
    shouldCredit,
    shouldReverse,
} from "./status-map";

describe("mapPaymentStatus", () => {
    it("traduce los estados conocidos de Mercado Pago", () => {
        expect(mapPaymentStatus("approved")).toBe("APPROVED");
        expect(mapPaymentStatus("pending")).toBe("PENDING");
        expect(mapPaymentStatus("in_process")).toBe("IN_PROCESS");
        expect(mapPaymentStatus("rejected")).toBe("REJECTED");
        expect(mapPaymentStatus("cancelled")).toBe("CANCELLED");
        expect(mapPaymentStatus("refunded")).toBe("REFUNDED");
        expect(mapPaymentStatus("charged_back")).toBe("CHARGED_BACK");
    });

    it("no acredita una retención sin captura", () => {
        // `authorized` significa plata retenida, no cobrada.
        expect(shouldCredit(mapPaymentStatus("authorized"))).toBe(false);
    });

    it("mantiene los créditos mientras una disputa está abierta", () => {
        const estado = mapPaymentStatus("in_mediation");
        expect(shouldReverse(estado)).toBe(false);
        expect(shouldCredit(estado)).toBe(false);
    });

    it("trata un estado desconocido como ERROR, nunca como aprobado", () => {
        // Si Mercado Pago añade un estado nuevo, el peor caso debe ser revisión
        // manual — jamás créditos regalados.
        expect(mapPaymentStatus("estado_del_futuro")).toBe("ERROR");
        expect(shouldCredit(mapPaymentStatus("estado_del_futuro"))).toBe(false);
    });
});

describe("clasificación de estados", () => {
    it("sólo APPROVED entrega créditos", () => {
        const todos = [
            "CREATED", "PROCESSING", "PENDING", "IN_PROCESS", "APPROVED",
            "REJECTED", "CANCELLED", "REFUNDED", "CHARGED_BACK", "EXPIRED", "ERROR",
        ] as const;
        expect(todos.filter(shouldCredit)).toEqual(["APPROVED"]);
    });

    it("sólo reembolso y contracargo retiran créditos", () => {
        expect(shouldReverse("REFUNDED")).toBe(true);
        expect(shouldReverse("CHARGED_BACK")).toBe(true);
        expect(shouldReverse("APPROVED")).toBe(false);
        expect(shouldReverse("REJECTED")).toBe(false);
    });

    it("distingue lo que sigue en vuelo de lo que ya terminó", () => {
        expect(isPending("PENDING")).toBe(true);
        expect(isPending("PROCESSING")).toBe(true);
        expect(isPending("APPROVED")).toBe(false);
        expect(isTerminal("APPROVED")).toBe(true);
        expect(isTerminal("CREATED")).toBe(false);
    });
});

describe("describeStatusDetail", () => {
    it("traduce los códigos de rechazo a algo accionable", () => {
        expect(describeStatusDetail("REJECTED", "cc_rejected_insufficient_amount"))
            .toBe("La tarjeta no tiene fondos suficientes.");
    });

    it("nunca devuelve el código crudo ante un detalle desconocido", () => {
        const texto = describeStatusDetail("REJECTED", "cc_rejected_codigo_nuevo");
        expect(texto).not.toContain("cc_rejected");
        expect(texto.length).toBeGreaterThan(10);
    });

    it("explica qué hacer cuando el pago queda pendiente", () => {
        expect(describeStatusDetail("PENDING", "pending_waiting_transfer"))
            .toContain("banco");
    });
});
