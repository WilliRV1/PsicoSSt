import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
    buildSignatureManifest,
    verifyWebhookSignature,
} from "./webhook-signature";

const SECRET = "clave-secreta-del-webhook";
const TOLERANCE = 900;

/** Firma como lo haría Mercado Pago, para no fijar hashes a mano. */
function firmar(
    dataId: string | null,
    requestId: string | null,
    ts: number,
    secret = SECRET
): string {
    const manifest = buildSignatureManifest(dataId, requestId, String(ts));
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    return `ts=${ts},v1=${v1}`;
}

describe("buildSignatureManifest", () => {
    it("arma la plantilla completa con el punto y coma final", () => {
        expect(buildSignatureManifest("123456", "req-abc", "1704908010")).toBe(
            "id:123456;request-id:req-abc;ts:1704908010;"
        );
    });

    it("pasa a minúsculas los identificadores alfanuméricos", () => {
        // Regla explícita de Mercado Pago: es la causa más común de que la
        // verificación falle contra notificaciones reales.
        expect(buildSignatureManifest("AbC123", "req", "100")).toContain("id:abc123;");
    });

    it("elimina los segmentos ausentes en vez de dejarlos vacíos", () => {
        expect(buildSignatureManifest(null, "req-abc", "100")).toBe(
            "request-id:req-abc;ts:100;"
        );
        expect(buildSignatureManifest("123", null, "100")).toBe("id:123;ts:100;");
        expect(buildSignatureManifest(null, null, "100")).toBe("ts:100;");
    });
});

describe("verifyWebhookSignature", () => {
    const ahora = new Date("2026-09-16T12:00:00Z");
    const ts = Math.floor(ahora.getTime() / 1000);

    const base = {
        dataId: "123456789",
        requestId: "req-abc-123",
        secret: SECRET,
        toleranceSeconds: TOLERANCE,
        now: ahora,
    };

    it("acepta una firma legítima", () => {
        const resultado = verifyWebhookSignature({
            ...base,
            signatureHeader: firmar("123456789", "req-abc-123", ts),
        });
        expect(resultado).toEqual({ valid: true, ts });
    });

    it("tolera espacios y el orden invertido de los componentes", () => {
        const manifest = buildSignatureManifest("123456789", "req-abc-123", String(ts));
        const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
        const resultado = verifyWebhookSignature({
            ...base,
            signatureHeader: ` v1=${v1} , ts=${ts} `,
        });
        expect(resultado.valid).toBe(true);
    });

    it("rechaza una firma de otra clave secreta", () => {
        const resultado = verifyWebhookSignature({
            ...base,
            signatureHeader: firmar("123456789", "req-abc-123", ts, "clave-equivocada"),
        });
        expect(resultado).toEqual({ valid: false, reason: "mismatch" });
    });

    it("rechaza si manipulan el identificador del pago", () => {
        // El ataque directo: firma válida de un pago propio, reapuntada a otro.
        const resultado = verifyWebhookSignature({
            ...base,
            dataId: "999999999",
            signatureHeader: firmar("123456789", "req-abc-123", ts),
        });
        expect(resultado).toEqual({ valid: false, reason: "mismatch" });
    });

    it("rechaza si manipulan el request-id", () => {
        const resultado = verifyWebhookSignature({
            ...base,
            requestId: "otro-request",
            signatureHeader: firmar("123456789", "req-abc-123", ts),
        });
        expect(resultado).toEqual({ valid: false, reason: "mismatch" });
    });

    it("rechaza una notificación reproducida fuera de la ventana", () => {
        const viejo = ts - TOLERANCE - 1;
        const resultado = verifyWebhookSignature({
            ...base,
            signatureHeader: firmar("123456789", "req-abc-123", viejo),
        });
        expect(resultado).toEqual({ valid: false, reason: "expired" });
    });

    it("admite desfase de reloj hacia el futuro dentro de la tolerancia", () => {
        const futuro = ts + TOLERANCE - 10;
        const resultado = verifyWebhookSignature({
            ...base,
            signatureHeader: firmar("123456789", "req-abc-123", futuro),
        });
        expect(resultado.valid).toBe(true);
    });

    it("rechaza cabeceras ausentes o mal formadas", () => {
        expect(
            verifyWebhookSignature({ ...base, signatureHeader: null }).valid
        ).toBe(false);
        expect(
            verifyWebhookSignature({ ...base, signatureHeader: "" })
        ).toEqual({ valid: false, reason: "missing_header" });
        expect(
            verifyWebhookSignature({ ...base, signatureHeader: "basura-sin-igual" })
        ).toEqual({ valid: false, reason: "malformed_header" });
        expect(
            verifyWebhookSignature({ ...base, signatureHeader: `v1=abc` })
        ).toEqual({ valid: false, reason: "missing_ts" });
        expect(
            verifyWebhookSignature({ ...base, signatureHeader: `ts=${ts}` })
        ).toEqual({ valid: false, reason: "missing_v1" });
    });

    it("rechaza sin clave secreta en vez de aceptar a ciegas", () => {
        // Si alguien despliega sin MP_WEBHOOK_SECRET, el sistema debe cerrarse,
        // no abrirse.
        expect(
            verifyWebhookSignature({
                ...base,
                secret: "",
                signatureHeader: firmar("123456789", "req-abc-123", ts),
            })
        ).toEqual({ valid: false, reason: "missing_secret" });
    });

    it("rechaza un v1 que no es hexadecimal válido", () => {
        expect(
            verifyWebhookSignature({
                ...base,
                signatureHeader: `ts=${ts},v1=zzzz`,
            }).valid
        ).toBe(false);
    });
});
