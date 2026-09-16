import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verificación de la firma `x-signature` de los webhooks de Mercado Pago.
 *
 * Módulo deliberadamente PURO: no lee variables de entorno, no toca la red y
 * no consulta la base de datos. Todo entra por parámetros. Eso lo hace
 * verificable con vectores fijos en las pruebas, que es justo lo que uno
 * necesita del único punto del sistema que decide si una notificación es
 * auténtica.
 *
 * Mercado Pago firma así:
 *
 *   x-signature: ts=1704908010,v1=618c8534...e839
 *   x-request-id: 7b2e...  (cabecera aparte)
 *   ?data.id=123456789     (query string)
 *
 * y el mensaje firmado (el «manifest») es la plantilla
 *
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * con HMAC-SHA256 y la clave secreta del webhook. Los segmentos cuyo valor no
 * llega se ELIMINAN de la plantilla, no se dejan vacíos.
 */

export type SignatureFailureReason =
    | "missing_secret"
    | "missing_header"
    | "malformed_header"
    | "missing_ts"
    | "missing_v1"
    | "expired"
    | "mismatch";

export type SignatureVerification =
    | { valid: true; ts: number }
    | { valid: false; reason: SignatureFailureReason };

export interface VerifyWebhookSignatureInput {
    /** Cabecera `x-signature` tal cual llega. */
    signatureHeader: string | null | undefined;
    /** Cabecera `x-request-id` tal cual llega. */
    requestId: string | null | undefined;
    /** Parámetro `data.id` del query string. */
    dataId: string | null | undefined;
    secret: string;
    /** Desfase máximo aceptado del `ts`, en segundos. */
    toleranceSeconds: number;
    /** Inyectable para poder fijar el reloj en las pruebas. */
    now?: Date;
}

/**
 * Construye el mensaje que Mercado Pago firmó.
 *
 * Exportada porque es el detalle donde se equivocan casi todas las
 * integraciones y conviene poder probarla sola. Dos reglas fáciles de pasar
 * por alto: el `data.id` alfanumérico va en MINÚSCULAS, y el punto y coma
 * final SÍ forma parte del mensaje.
 */
export function buildSignatureManifest(
    dataId: string | null | undefined,
    requestId: string | null | undefined,
    ts: string
): string {
    const segments: string[] = [];

    if (dataId) {
        // Los identificadores numéricos quedan igual; los alfanuméricos se
        // normalizan a minúsculas, como especifica Mercado Pago.
        segments.push(`id:${dataId.toLowerCase()};`);
    }
    if (requestId) {
        segments.push(`request-id:${requestId};`);
    }
    segments.push(`ts:${ts};`);

    return segments.join("");
}

/** Parte `ts=…,v1=…` en sus componentes, tolerando espacios y orden invertido. */
function parseSignatureHeader(header: string): Record<string, string> {
    const parts: Record<string, string> = {};

    for (const chunk of header.split(",")) {
        const separator = chunk.indexOf("=");
        if (separator === -1) continue;

        const key = chunk.slice(0, separator).trim();
        const value = chunk.slice(separator + 1).trim();
        if (key && value) parts[key] = value;
    }

    return parts;
}

/** Comparación en tiempo constante de dos dígitos hexadecimales. */
function hexEquals(a: string, b: string): boolean {
    // Longitudes distintas descartan de entrada: timingSafeEqual exige búferes
    // del mismo tamaño y una diferencia de longitud no es secreta.
    if (a.length !== b.length) return false;

    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");

    // Buffer.from ignora caracteres no hexadecimales en vez de fallar, así que
    // una cadena corrupta podría producir búferes cortos pero iguales entre sí.
    if (bufA.length !== bufB.length || bufA.length === 0) return false;

    return timingSafeEqual(bufA, bufB);
}

export function verifyWebhookSignature(
    input: VerifyWebhookSignatureInput
): SignatureVerification {
    const { signatureHeader, requestId, dataId, secret, toleranceSeconds } = input;

    if (!secret) return { valid: false, reason: "missing_secret" };
    if (!signatureHeader) return { valid: false, reason: "missing_header" };

    const parts = parseSignatureHeader(signatureHeader);
    if (Object.keys(parts).length === 0) {
        return { valid: false, reason: "malformed_header" };
    }

    const ts = parts.ts;
    const received = parts.v1;
    if (!ts) return { valid: false, reason: "missing_ts" };
    if (!received) return { valid: false, reason: "missing_v1" };

    // Anti-reproducción. Se admite desfase en ambos sentidos: el reloj del
    // servidor puede ir adelantado respecto al de Mercado Pago.
    const tsSeconds = Number(ts);
    if (!Number.isFinite(tsSeconds)) return { valid: false, reason: "missing_ts" };

    const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
    if (Math.abs(nowSeconds - tsSeconds) > toleranceSeconds) {
        return { valid: false, reason: "expired" };
    }

    const manifest = buildSignatureManifest(dataId, requestId, ts);
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");

    if (!hexEquals(expected, received)) {
        return { valid: false, reason: "mismatch" };
    }

    return { valid: true, ts: tsSeconds };
}
