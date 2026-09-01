import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Canal de retroalimentación.
 *
 * Recibe dos cosas por la misma puerta: lo que el profesional escribe a
 * propósito y los errores que la aplicación captura sola. Se guardan juntos
 * porque para entender un reporte casi siempre hace falta el otro —"no me
 * dejó guardar" cobra sentido al lado del error que ocurrió un minuto antes.
 */

export const runtime = "nodejs";

const KINDS = ["COMMENT", "BUG", "CRASH"] as const;
type Kind = (typeof KINDS)[number];

const MAX_MESSAGE = 4000;
const MAX_STACK = 8000;

/**
 * Tope de reportes por profesional y hora.
 *
 * Un error dentro de un render puede dispararse en bucle, y sin tope una sola
 * pantalla rota llenaría la tabla en minutos y ahogaría los comentarios de
 * verdad. Los comentarios escritos a mano nunca se acercan a este número.
 */
const MAX_PER_HOUR = 40;

function recortar(v: unknown, max: number): string | null {
    if (typeof v !== "string") return null;
    const t = v.trim();
    if (!t) return null;
    return t.length > max ? `${t.slice(0, max)}\n[…truncado]` : t;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const { kind, message, path, stack, context } = body as Record<string, unknown>;

    const tipo: Kind = KINDS.includes(kind as Kind) ? (kind as Kind) : "COMMENT";
    const texto = recortar(message, MAX_MESSAGE);
    if (!texto) {
        return NextResponse.json({ error: "El mensaje está vacío" }, { status: 400 });
    }

    const desde = new Date(Date.now() - 60 * 60 * 1000);
    const recientes = await prisma.feedback.count({
        where: { psychologistId: session.user.id, createdAt: { gte: desde } },
    });
    if (recientes >= MAX_PER_HOUR) {
        return NextResponse.json(
            { error: "Demasiados reportes seguidos. Intenta de nuevo en un rato." },
            { status: 429 }
        );
    }

    // El contexto lo envía el navegador: se guarda sólo lo que sabemos leer,
    // para que un cliente manipulado no meta un objeto arbitrario en la tabla.
    const ctx = (context ?? {}) as Record<string, unknown>;
    const contexto = {
        userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
        viewport: typeof ctx.viewport === "string" ? ctx.viewport.slice(0, 40) : null,
        digest: typeof ctx.digest === "string" ? ctx.digest.slice(0, 120) : null,
    };

    const creado = await prisma.feedback.create({
        data: {
            psychologistId: session.user.id,
            kind: tipo,
            message: texto,
            path: recortar(path, 300),
            stack: tipo === "COMMENT" ? null : recortar(stack, MAX_STACK),
            context: contexto,
        },
        select: { id: true },
    });

    return NextResponse.json({ id: creado.id }, { status: 201 });
}

/** Bandeja del administrador. */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.user.isAdmin) {
        return NextResponse.json({ error: "Requiere administrador" }, { status: 403 });
    }

    const estado = req.nextUrl.searchParams.get("status");
    const reportes = await prisma.feedback.findMany({
        where: estado && ["NEW", "READ", "RESOLVED"].includes(estado)
            ? { status: estado as "NEW" | "READ" | "RESOLVED" }
            : {},
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
            psychologist: { select: { fullName: true, email: true } },
        },
    });

    return NextResponse.json({ reportes });
}

/** Marcar como leído o resuelto, y anotar. */
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!session.user.isAdmin) {
        return NextResponse.json({ error: "Requiere administrador" }, { status: 403 });
    }

    const { id, status, adminNote } = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof id !== "string") {
        return NextResponse.json({ error: "Falta el identificador" }, { status: 400 });
    }

    const actualizado = await prisma.feedback.update({
        where: { id },
        data: {
            ...(typeof status === "string" && ["NEW", "READ", "RESOLVED"].includes(status)
                ? { status: status as "NEW" | "READ" | "RESOLVED" }
                : {}),
            ...(typeof adminNote === "string" ? { adminNote: adminNote.slice(0, 2000) } : {}),
        },
        select: { id: true, status: true },
    });

    return NextResponse.json(actualizado);
}
