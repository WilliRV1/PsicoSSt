/**
 * Límite de peticiones y bloqueo por intentos fallidos, compartido entre todas
 * las instancias vía PostgreSQL.
 *
 * Antes esto vivía en un `Map` del proceso. En Vercel cada lambda tenía el
 * suyo, así que el límite efectivo era `limit × instancias` y un arranque en
 * frío lo reiniciaba — precisamente lo que un barrido de cédulas necesita para
 * colarse. Ahora la cuenta es una sola para todo el despliegue.
 *
 * Tres decisiones que conviene no revertir sin entender por qué:
 *
 *  1. **Cada operación es UNA sentencia atómica** (`INSERT … ON CONFLICT DO
 *     UPDATE … RETURNING`). Leer-y-luego-escribir desde la aplicación tendría
 *     una carrera entre instancias concurrentes justo en el caso que importa:
 *     muchas peticiones simultáneas contra la misma clave.
 *
 *  2. **Falla abierto.** Si la base de datos no responde, se deja pasar la
 *     petición y se registra el error. Un limitador caído no puede convertirse
 *     en una caída del producto; el riesgo de dejar pasar tráfico durante una
 *     incidencia es menor que el de bloquear a todo el mundo.
 *
 *  3. **La limpieza es oportunista**, no un cron. Una fracción pequeña de las
 *     llamadas borra las filas ya caducadas, que es suficiente para una tabla
 *     cuyas filas viven minutos.
 *
 *  4. **Toda la aritmética de tiempo ocurre en la base de datos.** Ni una sola
 *     comparación mezcla `Date.now()` con `NOW()`. Escribir un vencimiento con
 *     el reloj de Node y evaluarlo con el de PostgreSQL hace que el límite dure
 *     de más o de menos exactamente lo que difieran ambos relojes; se detectó
 *     con 4,9 s de desfase entre el contenedor local y el host, y en producción
 *     (Vercel ↔ Neon) el desfase es pequeño pero no es cero.
 *
 * El WAF de Vercel sigue siendo la defensa dura a nivel de red; esto es el
 * cinturón de la aplicación, ahora sí con memoria compartida.
 */

import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
    allowed: boolean;
    /** Segundos que faltan para que la ventana se reinicie. */
    retryAfterSeconds: number;
}

/** Probabilidad de barrer filas caducadas en una llamada dada. */
const SWEEP_PROBABILITY = 0.02;

/**
 * Borra filas ya inservibles: ventana vencida y sin bloqueo vigente. Se llama
 * sola desde `checkRateLimit`; se exporta para poder forzarla en pruebas.
 */
export async function sweepRateLimitEntries(): Promise<number> {
    try {
        return await prisma.$executeRaw`
            DELETE FROM rate_limit_entries
            WHERE reset_at < NOW()
              AND (locked_until IS NULL OR locked_until < NOW())
        `;
    } catch (error) {
        console.error("[RATE_LIMIT] Barrido falló:", error);
        return 0;
    }
}

function maybeSweep(): void {
    if (Math.random() >= SWEEP_PROBABILITY) return;
    // Sin await: la limpieza no debe añadir latencia a la petición en curso.
    void sweepRateLimitEntries();
}

/**
 * Ventana fija por clave. `bucket` separa espacios de nombres (una ruta, un
 * tipo de acción) para que el cupo de una no consuma el de otra.
 */
export async function checkRateLimit(
    bucket: string,
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const id = `${bucket}:${key}`;
    const windowSeconds = windowMs / 1000;

    try {
        // Si la ventana ya venció, esta misma sentencia la reinicia; si no,
        // incrementa. Nunca hay un momento en que dos instancias lean el mismo
        // contador y escriban el mismo valor. El vencimiento se calcula con
        // NOW(), no con la hora de Node: ver nota 4 de la cabecera.
        const rows = await prisma.$queryRaw<{ count: number; retry_after: number }[]>`
            INSERT INTO rate_limit_entries (id, count, reset_at, updated_at)
            VALUES (
                ${id},
                1,
                NOW() + make_interval(secs => ${windowSeconds}::double precision),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                count = CASE
                    WHEN rate_limit_entries.reset_at <= NOW() THEN 1
                    ELSE rate_limit_entries.count + 1
                END,
                reset_at = CASE
                    WHEN rate_limit_entries.reset_at <= NOW()
                        THEN NOW() + make_interval(secs => ${windowSeconds}::double precision)
                    ELSE rate_limit_entries.reset_at
                END,
                updated_at = NOW()
            RETURNING
                count,
                GREATEST(1, CEIL(EXTRACT(EPOCH FROM (reset_at - NOW()))))::int AS retry_after
        `;

        maybeSweep();

        const row = rows[0];
        if (!row) return { allowed: true, retryAfterSeconds: 0 };

        if (row.count > limit) {
            return { allowed: false, retryAfterSeconds: row.retry_after };
        }
        return { allowed: true, retryAfterSeconds: 0 };
    } catch (error) {
        console.error("[RATE_LIMIT] checkRateLimit falló, se deja pasar:", error);
        return { allowed: true, retryAfterSeconds: 0 };
    }
}

/** Segundos que faltan para que expire el bloqueo de esta clave; 0 si no está bloqueada. */
export async function getLockoutSeconds(bucket: string, key: string): Promise<number> {
    try {
        const rows = await prisma.$queryRaw<{ seconds: number }[]>`
            SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (locked_until - NOW()))))::int AS seconds
            FROM rate_limit_entries
            WHERE id = ${`${bucket}:${key}`} AND locked_until IS NOT NULL
        `;
        return rows[0]?.seconds ?? 0;
    } catch (error) {
        console.error("[RATE_LIMIT] getLockoutSeconds falló, se deja pasar:", error);
        return 0;
    }
}

/**
 * Registra un intento fallido y devuelve `true` si con este se alcanzó el
 * umbral de bloqueo.
 */
export async function registerFailure(
    bucket: string,
    key: string,
    maxFailures: number,
    lockoutMs: number
): Promise<boolean> {
    const id = `${bucket}:${key}`;
    const lockoutSeconds = lockoutMs / 1000;

    try {
        // El contador vuelve a 0 al bloquear: el castigo ya está en
        // `locked_until` y así el siguiente ciclo empieza limpio.
        const rows = await prisma.$queryRaw<{ locked: boolean }[]>`
            INSERT INTO rate_limit_entries (id, count, failures, locked_until, reset_at, updated_at)
            VALUES (
                ${id},
                0,
                CASE WHEN 1 >= ${maxFailures} THEN 0 ELSE 1 END,
                CASE WHEN 1 >= ${maxFailures}
                    THEN NOW() + make_interval(secs => ${lockoutSeconds}::double precision)
                    ELSE NULL
                END,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                failures = CASE
                    WHEN rate_limit_entries.failures + 1 >= ${maxFailures} THEN 0
                    ELSE rate_limit_entries.failures + 1
                END,
                locked_until = CASE
                    WHEN rate_limit_entries.failures + 1 >= ${maxFailures}
                        THEN NOW() + make_interval(secs => ${lockoutSeconds}::double precision)
                    ELSE rate_limit_entries.locked_until
                END,
                updated_at = NOW()
            RETURNING (locked_until IS NOT NULL AND locked_until > NOW()) AS locked
        `;

        return rows[0]?.locked === true;
    } catch (error) {
        console.error("[RATE_LIMIT] registerFailure falló:", error);
        return false;
    }
}

/**
 * Limpia el contador de fallos de una clave tras un acierto. NO levanta un
 * bloqueo ya impuesto: si se levantara, bastaría una cédula válida —la del
 * propio atacante, por ejemplo— para reiniciar el castigo y seguir probando.
 */
export async function clearFailures(bucket: string, key: string): Promise<void> {
    const id = `${bucket}:${key}`;
    try {
        await prisma.$executeRaw`
            UPDATE rate_limit_entries
            SET failures = 0, updated_at = NOW()
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error("[RATE_LIMIT] clearFailures falló:", error);
    }
}

/** Solo para pruebas: vacía la tabla completa. */
export async function __resetRateLimitState(): Promise<void> {
    await prisma.rateLimitEntry.deleteMany({});
}
