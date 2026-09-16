import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dueInfo, isCriticalLevel, workerValidity } from "@/lib/compliance/cadence";

/** Cuestionarios firmados dentro de esta ventana cuentan como la misma medición. */
const SAME_CYCLE_DAYS = 90;

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const workers = await prisma.worker.findMany({
        // Lista de a quién hay que reevaluar: un archivado ya no se reevalúa.
        where: { organizationId: orgId, archivedAt: null },
        select: {
            id: true,
            fullName: true,
            jobTitle: true,
            departmentArea: true,
            assessments: {
                where: { status: "SIGNED" },
                select: {
                    assessmentDate: true,
                    questionnaireType: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
                orderBy: { assessmentDate: "desc" },
                take: 10,
            },
        },
        orderBy: { fullName: "asc" },
    });

    const now = new Date();

    const results = workers
        .map(worker => {
            const last = worker.assessments[0];
            if (!last) {
                return {
                    id: worker.id,
                    fullName: worker.fullName,
                    jobTitle: worker.jobTitle,
                    departmentArea: worker.departmentArea,
                    lastAssessmentDate: null,
                    expiresAt: null,
                    daysUntilExpiry: null,
                    validityYears: null,
                    reason: null,
                    status: "NEVER_ASSESSED" as const,
                };
            }

            // Res. 2764/2022 art. 3: la vigencia la define el peor resultado de
            // la última medición, no sólo el último cuestionario firmado. Un
            // intralaboral en riesgo alto vence al año aunque el de estrés,
            // firmado después, haya salido bajo.
            const lastDate = new Date(last.assessmentDate);
            const cycleStart = lastDate.getTime() - SAME_CYCLE_DAYS * 24 * 60 * 60 * 1000;
            const cycle = worker.assessments.filter(a => new Date(a.assessmentDate).getTime() >= cycleStart);
            const critical = cycle.some(a => isCriticalLevel(a.scoredResult?.overallRiskCategory));
            const validity = workerValidity(critical ? "ALTO" : last.scoredResult?.overallRiskCategory);
            const info = dueInfo(lastDate, validity, now);

            return {
                id: worker.id,
                fullName: worker.fullName,
                jobTitle: worker.jobTitle,
                departmentArea: worker.departmentArea,
                lastAssessmentDate: lastDate.toISOString().slice(0, 10),
                expiresAt: info.dueDate.toISOString().slice(0, 10),
                daysUntilExpiry: info.daysLeft,
                validityYears: validity.years,
                reason: validity.reasons[0] ?? null,
                status:
                    info.status === "VENCIDA"
                        ? ("EXPIRED" as const)
                        : info.status === "POR_VENCER"
                          ? ("EXPIRING_SOON" as const)
                          : ("OK" as const),
            };
        })
        .filter(w => w.status !== "OK"); // Only return workers that need attention

    // Sort: EXPIRED first, then EXPIRING_SOON, then NEVER_ASSESSED
    const order: Record<string, number> = { EXPIRED: 0, EXPIRING_SOON: 1, NEVER_ASSESSED: 2 };
    results.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

    return NextResponse.json({ workers: results });
}
