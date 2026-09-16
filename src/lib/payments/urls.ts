import type { NextRequest } from "next/server";

/**
 * Origen público de la petición, o `null` si no es alcanzable desde internet.
 *
 * Se usa el origen real y no una variable de entorno porque este proyecto ya
 * aprendió esa lección: `APP_URL` no existe en Vercel y las invitaciones se
 * construyen igual (ver `api/assessments/invitations/route.ts`).
 *
 * Mercado Pago rechaza el pago entero si le mandamos una `notification_url` o
 * una `callback_url` a las que no puede llegar, así que en desarrollo local es
 * mejor no enviarlas: la reconciliación perezosa del checkout cubre el hueco.
 */
export function resolvePublicOrigin(request: NextRequest): string | null {
    const origin = request.nextUrl.origin;

    let url: URL;
    try {
        url = new URL(origin);
    } catch {
        return null;
    }

    if (url.protocol !== "https:") return null;

    const host = url.hostname;
    const esLocal =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "[::1]" ||
        host.endsWith(".local");
    if (esLocal) return null;

    return origin;
}

/** URL pública del webhook de Mercado Pago. */
export function resolveNotificationUrl(request: NextRequest): string | null {
    const origin = resolvePublicOrigin(request);
    return origin ? `${origin}/api/payments/webhook` : null;
}

/**
 * A dónde vuelve el comprador tras pagar en su banco (PSE). Aterriza en la
 * pantalla de la orden, que reconcilia contra Mercado Pago al cargar: es la
 * tercera red de seguridad de la acreditación.
 */
export function resolveCallbackUrl(request: NextRequest, internalRef: string): string | null {
    const origin = resolvePublicOrigin(request);
    return origin
        ? `${origin}/dashboard/credits/checkout/${encodeURIComponent(internalRef)}`
        : null;
}
