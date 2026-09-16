import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Pruebas del limitador contra un PostgreSQL de verdad.
 *
 * Lo que aquí se prueba —que el contador sea UNO SOLO y sobreviva entre
 * llamadas— es justo lo que un doble de prueba no puede demostrar: el bug que
 * esto corrige era que cada instancia serverless tenía su propio Map. Sólo
 * ejercitando la tabla real se comprueba que la cuenta es compartida y que el
 * `ON CONFLICT` aguanta llamadas concurrentes sobre la misma clave.
 *
 * Se omiten solas si no hay `TEST_DATABASE_URL`, igual que las de pagos:
 *
 *   TEST_DATABASE_URL=postgresql://…/psicosst npx vitest run rate-limit
 */

const TEST_DB = process.env.TEST_DATABASE_URL;
const pruebaDeIntegracion = TEST_DB ? describe : describe.skip;

if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

const { prisma } = await import("@/lib/prisma");
const {
    checkRateLimit,
    registerFailure,
    getLockoutSeconds,
    clearFailures,
    sweepRateLimitEntries,
} = await import("@/lib/security/rate-limit");

pruebaDeIntegracion("limitador persistente", () => {
    let bucket: string;

    beforeEach(() => {
        // Clave única por prueba: así no hace falta vaciar una tabla que en
        // producción es compartida, y las pruebas no se estorban entre sí.
        bucket = `test:${randomUUID()}`;
    });

    afterAll(async () => {
        await prisma.rateLimitEntry.deleteMany({ where: { id: { startsWith: "test:" } } });
        await prisma.$disconnect();
    });

    describe("ventana de peticiones", () => {
        it("deja pasar hasta el límite y corta en la siguiente", async () => {
            const limit = 3;
            for (let i = 1; i <= limit; i++) {
                const r = await checkRateLimit(bucket, "1.1.1.1", limit, 60_000);
                expect(r.allowed, `petición ${i} debería pasar`).toBe(true);
            }

            const blocked = await checkRateLimit(bucket, "1.1.1.1", limit, 60_000);
            expect(blocked.allowed).toBe(false);
            expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
            expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
        });

        it("cuenta por clave, no globalmente: otra IP arranca de cero", async () => {
            await checkRateLimit(bucket, "1.1.1.1", 1, 60_000);
            const otraIp = await checkRateLimit(bucket, "2.2.2.2", 1, 60_000);
            expect(otraIp.allowed).toBe(true);
        });

        it("separa espacios de nombres: el cupo de un bucket no consume el de otro", async () => {
            await checkRateLimit(`${bucket}:a`, "1.1.1.1", 1, 60_000);
            const otroBucket = await checkRateLimit(`${bucket}:b`, "1.1.1.1", 1, 60_000);
            expect(otroBucket.allowed).toBe(true);
        });

        it("reinicia la cuenta cuando la ventana vence", async () => {
            const bloqueado = await checkRateLimit(bucket, "1.1.1.1", 1, 50);
            expect(bloqueado.allowed).toBe(true);
            expect((await checkRateLimit(bucket, "1.1.1.1", 1, 50)).allowed).toBe(false);

            await new Promise((r) => setTimeout(r, 80));

            const trasVencer = await checkRateLimit(bucket, "1.1.1.1", 1, 50);
            expect(trasVencer.allowed).toBe(true);
        });

        it("la cuenta es compartida: 10 llamadas concurrentes consumen 10, no 1", async () => {
            // Éste es el caso que el Map en memoria no cubría. Si el
            // ON CONFLICT no fuera atómico, varias llamadas escribirían el
            // mismo valor y el total quedaría por debajo de 10.
            const limit = 100;
            await Promise.all(
                Array.from({ length: 10 }, () => checkRateLimit(bucket, "9.9.9.9", limit, 60_000))
            );

            const entry = await prisma.rateLimitEntry.findUnique({
                where: { id: `${bucket}:9.9.9.9` },
                select: { count: true },
            });
            expect(entry?.count).toBe(10);
        });
    });

    describe("bloqueo por intentos fallidos", () => {
        it("bloquea al alcanzar el umbral y no antes", async () => {
            const max = 3;
            expect(await registerFailure(bucket, "k", max, 60_000)).toBe(false);
            expect(await registerFailure(bucket, "k", max, 60_000)).toBe(false);
            expect(await registerFailure(bucket, "k", max, 60_000)).toBe(true);

            expect(await getLockoutSeconds(bucket, "k")).toBeGreaterThan(0);
        });

        it("sin fallos previos no hay bloqueo", async () => {
            expect(await getLockoutSeconds(bucket, "desconocida")).toBe(0);
        });

        it("un acierto limpia los fallos pero NO levanta un bloqueo vigente", async () => {
            const max = 2;
            await registerFailure(bucket, "k", max, 60_000);
            expect(await registerFailure(bucket, "k", max, 60_000)).toBe(true);

            await clearFailures(bucket, "k");

            // El castigo sigue: acertar una cédula válida no debe servir para
            // reiniciarlo y seguir probando.
            expect(await getLockoutSeconds(bucket, "k")).toBeGreaterThan(0);
        });

        it("el bloqueo expira solo al cumplirse el plazo", async () => {
            await registerFailure(bucket, "k", 1, 50);
            expect(await getLockoutSeconds(bucket, "k")).toBeGreaterThan(0);

            await new Promise((r) => setTimeout(r, 80));
            expect(await getLockoutSeconds(bucket, "k")).toBe(0);
        });
    });

    describe("barrido", () => {
        it("borra filas vencidas y respeta las que siguen bloqueadas", async () => {
            await checkRateLimit(bucket, "vencida", 10, 10);
            await registerFailure(bucket, "bloqueada", 1, 10 * 60_000);
            await new Promise((r) => setTimeout(r, 40));

            await sweepRateLimitEntries();

            const vencida = await prisma.rateLimitEntry.findUnique({
                where: { id: `${bucket}:vencida` },
            });
            const bloqueada = await prisma.rateLimitEntry.findUnique({
                where: { id: `${bucket}:bloqueada` },
            });

            expect(vencida).toBeNull();
            expect(bloqueada).not.toBeNull();
        });
    });
});
