import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { FeedbackInbox } from "./inbox";

export default async function FeedbackPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (!session.user.isAdmin) notFound();

    const [reportes, conteos] = await Promise.all([
        prisma.feedback.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            include: { psychologist: { select: { fullName: true, email: true } } },
        }),
        prisma.feedback.groupBy({ by: ["status"], _count: true }),
    ]);

    const porEstado = Object.fromEntries(conteos.map(c => [c.status, c._count])) as Record<
        string,
        number
    >;

    return (
        <FeedbackInbox
            reportes={reportes.map(r => ({
                id: r.id,
                kind: r.kind,
                message: r.message,
                path: r.path,
                stack: r.stack,
                status: r.status,
                adminNote: r.adminNote,
                createdAt: r.createdAt.toISOString(),
                autor: r.psychologist
                    ? { nombre: r.psychologist.fullName, email: r.psychologist.email }
                    : null,
                contexto: (r.context ?? {}) as Record<string, string | null>,
            }))}
            conteos={{
                NEW: porEstado.NEW ?? 0,
                READ: porEstado.READ ?? 0,
                RESOLVED: porEstado.RESOLVED ?? 0,
            }}
        />
    );
}
