/**
 * Credenciales y modo de operación de Mercado Pago.
 *
 * Las credenciales vienen en pares (public key + access token) y SIEMPRE del
 * mismo juego: o las dos de prueba (`TEST-…`) o las dos de producción
 * (`APP_USR-…`). Mezclarlas produce el fallo más desconcertante de la
 * integración: el formulario tokeniza la tarjeta sin quejarse y el cobro
 * revienta después con un error que no menciona las credenciales. Por eso se
 * valida el par al arrancar y no cuando ya hay un usuario pagando.
 */

export type MercadoPagoMode = "test" | "production";

export interface MercadoPagoConfig {
    accessToken: string;
    publicKey: string;
    webhookSecret: string;
    mode: MercadoPagoMode;
}

export class MercadoPagoConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MercadoPagoConfigError";
    }
}

/** `TEST-…` marca las credenciales de prueba en ambos tipos de credencial. */
function modeOf(credential: string): MercadoPagoMode {
    return credential.startsWith("TEST-") ? "test" : "production";
}

/**
 * Resuelve la configuración o explica exactamente qué falta.
 *
 * No se cachea el resultado: en serverless el módulo ya vive lo que vive la
 * lambda, y leer tres variables de entorno no justifica un singleton que
 * complique las pruebas.
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
    const accessToken = process.env.MP_ACCESS_TOKEN?.trim();
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim();
    const webhookSecret = process.env.MP_WEBHOOK_SECRET?.trim();

    const missing: string[] = [];
    if (!accessToken) missing.push("MP_ACCESS_TOKEN");
    if (!publicKey) missing.push("NEXT_PUBLIC_MP_PUBLIC_KEY");
    if (!webhookSecret) missing.push("MP_WEBHOOK_SECRET");

    if (missing.length > 0 || !accessToken || !publicKey || !webhookSecret) {
        throw new MercadoPagoConfigError(
            `Faltan variables de entorno de Mercado Pago: ${missing.join(", ")}. ` +
                `Se configuran en Vercel (Settings → Environment Variables); ver .env.example.`
        );
    }

    const tokenMode = modeOf(accessToken);
    const keyMode = modeOf(publicKey);

    if (tokenMode !== keyMode) {
        throw new MercadoPagoConfigError(
            `Las credenciales de Mercado Pago no son del mismo juego: MP_ACCESS_TOKEN es de ` +
                `${tokenMode === "test" ? "PRUEBA" : "PRODUCCIÓN"} y NEXT_PUBLIC_MP_PUBLIC_KEY es de ` +
                `${keyMode === "test" ? "PRUEBA" : "PRODUCCIÓN"}. Ambas deben venir de la misma ` +
                `sección del panel de Mercado Pago.`
        );
    }

    return { accessToken, publicKey, webhookSecret, mode: tokenMode };
}

/**
 * ¿Se puede cobrar ahora mismo? Permite que la interfaz muestre «pagos no
 * disponibles» en vez de un 500 cuando las variables no están puestas —
 * el caso real durante el despliegue inicial.
 */
export function isPaymentsEnabled(): boolean {
    try {
        getMercadoPagoConfig();
        return true;
    } catch {
        return false;
    }
}

/**
 * Ventana de vida de una orden antes de darla por abandonada.
 *
 * Cubre el caso «abrí el checkout y cerré la pestaña». Los medios que se pagan
 * fuera de línea (Efecty) traen su propia fecha de vencimiento, más larga, y
 * la orden la adopta al crearse el pago.
 */
export const ORDER_TTL_MINUTES = 30;

/**
 * Tolerancia del `ts` de la firma del webhook, contra reproducción de
 * notificaciones capturadas.
 *
 * 15 minutos y no 5: Mercado Pago reintenta las notificaciones fallidas y no
 * conviene rechazar un reintento legítimo por unos minutos de desfase de reloj.
 * El riesgo residual es bajo por diseño — reproducir una notificación sólo
 * vuelve a llamar a `reconcile`, que es idempotente y relee la verdad desde la
 * API de Mercado Pago.
 */
export const WEBHOOK_TOLERANCE_SECONDS = 15 * 60;
