import type { NextRequest } from "next/server";

/**
 * URL pública del webhook, derivada del origen de la petición.
 *
 * Se usa el origen real y no una variable de entorno porque este proyecto ya
 * aprendió esa lección: `APP_URL` no existe en Vercel y las invitaciones se
 * construyen igual (ver `api/assessments/invitations/route.ts`).
 *
 * Devuelve `null` cuando el origen no es alcanzable desde internet. Mercado
 * Pago rechaza el pago entero si le mandamos una `notification_url` a la que no
 * puede llegar, así que en desarrollo local es mejor no enviarla: la
 * reconciliación perezosa del checkout cubre el hueco.
 */
export function resolveNotificationUrl(request: NextRequest): string | null {
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

    return `${origin}/api/payments/webhook`;
}
