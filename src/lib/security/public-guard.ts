import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

/**
 * Cupos de las rutas públicas (sin sesión). El trabajador real hace unas pocas
 * peticiones por minuto —cargar la pantalla, identificarse, enviar tres
 * cuestionarios—, así que estos números le sobran y aun así cortan el barrido
 * automatizado de cédulas o de tokens.
 */
export const PUBLIC_RATE_LIMITS = {
    /** Lectura de la vista pública de un enlace: la pantalla la pide al montar. */
    view: { limit: 60, windowMs: 60_000 },
    /** Identificación por cédula: es el paso que un atacante querría enumerar. */
    identify: { limit: 10, windowMs: 60_000 },
    /** Escrituras del trabajador (sociodemográficos, envío de cuestionario). */
    write: { limit: 30, windowMs: 60_000 },
} as const;

/**
 * Aplica el límite por IP y devuelve una respuesta 429 lista para retornar, o
 * `null` si la petición puede continuar.
 */
export function enforcePublicRateLimit(
    bucket: keyof typeof PUBLIC_RATE_LIMITS,
    ipAddress: string
): NextResponse | null {
    const { limit, windowMs } = PUBLIC_RATE_LIMITS[bucket];
    const result = checkRateLimit(`public:${bucket}`, ipAddress, limit, windowMs);
    if (result.allowed) return null;

    return NextResponse.json(
        {
            error: "Demasiadas solicitudes desde esta conexión. Espera un momento e intenta de nuevo.",
            code: "RATE_LIMITED",
        },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
    );
}
