/**
 * Límite de peticiones y bloqueo por intentos fallidos, en memoria del proceso.
 *
 * LIMITACIÓN CONOCIDA (serverless): en Vercel cada instancia de función tiene
 * su propio Map, y las instancias se crean y destruyen sin aviso. El contador
 * NO es global ni persistente: un atacante repartido entre varias instancias
 * ve un límite efectivo de `limit × instancias`, y un arranque en frío lo
 * reinicia. Se acepta a conciencia porque (a) el esquema no puede cambiar en
 * esta entrega —un contador persistente exigiría tabla o columnas nuevas— y
 * (b) aun degradado corta de raíz el caso real: enumerar cédulas a alta
 * velocidad desde un solo origen. La defensa dura de ese escenario es el WAF
 * de Vercel a nivel de ruta; esto es el cinturón de la aplicación.
 */

interface Window {
    count: number;
    resetAt: number;
}

interface FailureState {
    failures: number;
    lockedUntil: number;
}

const windows = new Map<string, Window>();
const failures = new Map<string, FailureState>();

/// Sin esto el Map crece sin techo en un proceso de larga vida (Node server,
/// instancia lambda reutilizada): cada IP nueva deja una entrada muerta.
const SWEEP_EVERY = 500;
let opsSinceSweep = 0;

function sweep(now: number) {
    if (++opsSinceSweep < SWEEP_EVERY) return;
    opsSinceSweep = 0;
    for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    for (const [k, v] of failures) if (v.lockedUntil <= now && v.failures === 0) failures.delete(k);
}

export interface RateLimitResult {
    allowed: boolean;
    /** Segundos que faltan para que la ventana se reinicie. */
    retryAfterSeconds: number;
}

/**
 * Ventana fija por clave. `bucket` separa espacios de nombres (una ruta, un
 * tipo de acción) para que el cupo de una no consuma el de otra.
 */
export function checkRateLimit(
    bucket: string,
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const mapKey = `${bucket}:${key}`;
    const current = windows.get(mapKey);

    if (!current || current.resetAt <= now) {
        windows.set(mapKey, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
    }

    current.count += 1;
    if (current.count > limit) {
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
        };
    }
    return { allowed: true, retryAfterSeconds: 0 };
}

/** Segundos que faltan para que expire el bloqueo de esta clave; 0 si no está bloqueada. */
export function getLockoutSeconds(bucket: string, key: string): number {
    const state = failures.get(`${bucket}:${key}`);
    if (!state) return 0;
    const remaining = state.lockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Registra un intento fallido y devuelve `true` si con este se alcanzó el
 * umbral de bloqueo.
 */
export function registerFailure(
    bucket: string,
    key: string,
    maxFailures: number,
    lockoutMs: number
): boolean {
    const now = Date.now();
    sweep(now);

    const mapKey = `${bucket}:${key}`;
    const state = failures.get(mapKey) ?? { failures: 0, lockedUntil: 0 };
    state.failures += 1;

    if (state.failures >= maxFailures) {
        state.failures = 0;
        state.lockedUntil = now + lockoutMs;
        failures.set(mapKey, state);
        return true;
    }

    failures.set(mapKey, state);
    return false;
}

/**
 * Limpia el contador de fallos de una clave tras un acierto. NO levanta un
 * bloqueo ya impuesto: si se levantara, bastaría una cédula válida —la del
 * propio atacante, por ejemplo— para reiniciar el castigo y seguir probando.
 */
export function clearFailures(bucket: string, key: string): void {
    const mapKey = `${bucket}:${key}`;
    const state = failures.get(mapKey);
    if (!state) return;
    if (state.lockedUntil > Date.now()) {
        state.failures = 0;
        return;
    }
    failures.delete(mapKey);
}

/** Solo para pruebas: vacía todo el estado en memoria. */
export function __resetRateLimitState(): void {
    windows.clear();
    failures.clear();
    opsSinceSweep = 0;
}
