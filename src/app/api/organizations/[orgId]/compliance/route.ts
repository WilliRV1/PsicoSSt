import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dueInfo, isCriticalLevel, organizationValidity } from "@/lib/compliance/cadence";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [workerCount, assessmentStats, consentCount, plan, signedAssessments] = await Promise.all([
        // Denominador de cobertura: un archivado que ya no está en la planta
        // dejaría la cobertura por debajo del 100% para siempre.
        prisma.worker.count({ where: { organizationId: orgId, archivedAt: null } }),

        prisma.assessment.groupBy({
            by: ["status"],
            _count: { status: true },
            where: { organizationId: orgId, psychologistId: session.user.id },
        }),

        prisma.informedConsent.count({
            where: { assessment: { organizationId: orgId, psychologistId: session.user.id } },
        }),

        prisma.interventionPlan.findFirst({
            where: { organizationId: orgId, psychologistId: session.user.id, status: "ACTIVE" },
            include: {
                actions: {
                    select: { status: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),

        // Vigencia de la medición: fecha de la última firma y % de trabajadores
        // críticos, que es lo que decide si la empresa mide cada año o cada dos.
        prisma.assessment.findMany({
            where: { organizationId: orgId, status: "SIGNED" },
            select: {
                workerId: true,
                assessmentDate: true,
                scoredResult: { select: { overallRiskCategory: true } },
            },
            orderBy: { assessmentDate: "desc" },
        }),
    ]);

    const evaluatedIds = new Set(signedAssessments.map(a => a.workerId));
    const criticalIds = new Set(
        signedAssessments.filter(a => isCriticalLevel(a.scoredResult?.overallRiskCategory)).map(a => a.workerId)
    );
    const criticalPct = evaluatedIds.size > 0 ? (criticalIds.size / evaluatedIds.size) * 100 : 0;
    const lastSigned = signedAssessments[0]?.assessmentDate ?? null;
    const validity = organizationValidity({ criticalWorkerPercent: criticalPct });
    const due = lastSigned ? dueInfo(new Date(lastSigned), validity) : null;

    const signed = assessmentStats.find(s => s.status === "SIGNED")?._count.status ?? 0;
    const pending = assessmentStats
        .filter(s => ["SCORED", "REVIEWED", "DRAFT", "IN_PROGRESS", "COMPLETED"].includes(s.status))
        .reduce((sum, s) => sum + s._count.status, 0);
    const totalAssessments = signed + pending;

    // --- Compliance checks ---
    const checks = {
        hasAssessments: { ok: totalAssessments > 0, label: "Evaluaciones aplicadas", detail: totalAssessments > 0 ? `${totalAssessments} evaluación(es) registradas` : "Sin evaluaciones — la batería no ha sido aplicada" },
        hasSignedReports: { ok: signed > 0, label: "Informes firmados", detail: signed > 0 ? `${signed} informe(s) firmado(s)` : "Sin informes firmados por el psicólogo" },
        hasConsents: { ok: consentCount > 0, label: "Consentimientos informados", detail: consentCount > 0 ? `${consentCount} consentimiento(s) registrado(s)` : "Sin consentimientos registrados (Art. 18, Res. 2646/2008)" },
        hasInterventionPlan: { ok: !!plan, label: "Plan de intervención activo", detail: plan ? `Plan "${plan.title}" (${plan.period})` : "Sin plan de intervención — requerido por Res. 2764/2022" },
        hasPlanActions: { ok: !!(plan && plan.actions.length > 0), label: "Medidas de intervención documentadas", detail: plan && plan.actions.length > 0 ? `${plan.actions.length} medida(s) documentada(s)` : "El plan no tiene medidas registradas" },
        noPendingCritical: { ok: pending === 0 || signed > 0, label: "Sin evaluaciones críticas pendientes", detail: pending === 0 ? "Todas las evaluaciones están procesadas" : `${pending} evaluación(es) pendiente(s) de firma` },
        withinValidity: {
            ok: !!due && due.status !== "VENCIDA",
            label: "Medición vigente",
            detail: !due
                ? "Sin medición firmada"
                : due.status === "VENCIDA"
                  ? `Vencida el ${due.dueDate.toLocaleDateString("es-CO")} (vigencia de ${validity.years} año${validity.years > 1 ? "s" : ""}, Res. 2764/2022 art. 3)`
                  : due.status === "POR_VENCER"
                    ? `Vence el ${due.dueDate.toLocaleDateString("es-CO")} · ${due.daysLeft} días`
                    : `Vigente hasta el ${due.dueDate.toLocaleDateString("es-CO")} (vigencia de ${validity.years} año${validity.years > 1 ? "s" : ""})`,
        },
    };

    const passedCount = Object.values(checks).filter(c => c.ok).length;
    const totalChecks = Object.keys(checks).length;

    // Overall status
    let status: "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT";
    if (passedCount === totalChecks) {
        status = "COMPLIANT";
    } else if (passedCount >= totalChecks / 2) {
        status = "AT_RISK";
    } else {
        status = "NON_COMPLIANT";
    }

    return NextResponse.json({
        status,
        passedCount,
        totalChecks,
        checks,
        workerCount,
        signed,
        pending,
        consentCount,
        hasPlan: !!plan,
        planActionsCount: plan?.actions.length ?? 0,
    });
}
