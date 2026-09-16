import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Cliente de Prisma sobre un pool de `pg`.
 *
 * El dimensionado del pool importa de verdad en este despliegue. Vercel levanta
 * una instancia de función por petición concurrente y CADA UNA abre su propio
 * pool; con el valor por defecto de `pg` (10 conexiones) bastan unas pocas
 * peticiones simultáneas para agotar la cuota de conexiones de un proyecto
 * gratuito de Neon, y el síntoma es de los que cuesta diagnosticar: la
 * aplicación empieza a fallar sólo cuando hay tráfico.
 *
 * Por eso `DATABASE_URL` debería apuntar al endpoint CON pooling de Neon (el
 * del sufijo `-pooler`), que multiplexa miles de clientes. Las transacciones
 * interactivas de Prisma funcionan sobre PgBouncer en modo `transaction`
 * porque fijan la conexión mientras dura la transacción.
 *
 * Excepción: `prisma migrate deploy` necesita el endpoint DIRECTO (sin
 * `-pooler`); PgBouncer no soporta los bloqueos de aviso que usa el migrador.
 */
function createPrismaClient() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Pequeño a propósito: en serverless la concurrencia se resuelve
        // levantando más instancias, no agrandando el pool de cada una.
        max: 5,
        // Neon suspende el cómputo tras unos minutos sin actividad. Soltar las
        // conexiones ociosas rápido evita mantenerlo despierto sin necesidad.
        idleTimeoutMillis: 10_000,
        // Un arranque en frío de Neon puede tardar varios segundos: esperar
        // menos produciría errores de conexión en la primera visita del día.
        connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
