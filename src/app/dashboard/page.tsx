import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
    ClipboardList, Building2, Users, FileText,
    Clock, CheckCircle2, Plus, ArrowRight, PenLine, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AssessmentsByMonthChart, { MonthlyData } from "@/components/dashboard/assessments-by-month-chart";
import RiskDistributionChart from "@/components/dashboard/risk-distribution-chart";
import OrgRiskSummaryTable, { OrgSummary } from "@/components/dashboard/org-risk-summary-table";
import OrgDetailPanel from "@/components/dashboard/org-detail-panel";

const riskConfig: Record<string, { label: string; color: string; bar: string }> = {
    SIN_RIESGO: { label: "Sin Riesgo", color: "text-green-700",  bar: "bg-green-500" },
    BAJO:       { label: "Bajo",       color: "text-lime-700",   bar: "bg-lime-500" },
    MEDIO:      { label: "Medio",      color: "text-yellow-700", bar: "bg-yellow-400" },
    ALTO:       { label: "Alto",       color: "text-orange-700", bar: "bg-orange-500" },
    MUY_ALTO:   { label: "Muy Alto",   color: "text-red-700",    bar: "bg-red-500" },
};

const statusLabels: Record<string, string> = {
    SCORED:    "Calificado",
    REVIEWED:  "Revisado",
    SIGNED:    "Firmado",
    COMPLETED: "Completado",
    DRAFT:     "Borrador",
};

const statusColors: Record<string, string> = {
    SCORED:    "bg-yellow-100 text-yellow-700",
    REVIEWED:  "bg-blue-100 text-blue-700",
    SIGNED:    "bg-green-100 text-green-700",
    COMPLETED: "bg-gray-100 text-gray-600",
    DRAFT:     "bg-gray-100 text-gray-500",
};

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const psychId = session.user.id;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const [
        orgCount,
        workerCount,
        assessmentCount,
        signedCount,
        pendingCount,
        riskGroups,
        recentAssessments,
        pendingToSign,
        last12Months,
        allWorkersForExpiry,
        criticalWorkerCount,
        criticalWorkers,
        orgsWithMetrics,
    ] = await Promise.all([
        prisma.organization.count({ where: { createdByPsychologist: psychId } }),
        prisma.worker.count({ where: { organization: { createdByPsychologist: psychId } } }),
        prisma.assessment.count({ where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED", "SIGNED"] } } }),
        prisma.assessment.count({ where: { psychologistId: psychId, status: "SIGNED" } }),
        prisma.assessment.count({ where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED"] } } }),
        prisma.scoredResult.groupBy({
            by: ["overallRiskCategory"],
            _count: { overallRiskCategory: true },
            where: { assessment: { psychologistId: psychId } },
        }),
        prisma.assessment.findMany({
            where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED", "SIGNED"] } },
            include: { worker: { select: { fullName: true } }, organization: { select: { name: true } } },
            orderBy: { assessmentDate: "desc" },
            take: 5,
        }),
        prisma.assessment.findMany({
            where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED"] } },
            include: { worker: { select: { fullName: true } }, organization: { select: { name: true } } },
            orderBy: { assessmentDate: "desc" },
            take: 4,
        }),
        prisma.assessment.findMany({
            where: {
                psychologistId: psychId,
                status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                assessmentDate: { gte: twelveMonthsAgo },
            },
            select: { assessmentDate: true, questionnaireType: true },
        }),
        // Workers needing re-evaluation (last signed > 18 months ago or never)
        prisma.worker.findMany({
            where: { organization: { createdByPsychologist: psychId } },
            select: {
                id: true,
                fullName: true,
                organization: { select: { id: true, name: true } },
                assessments: {
                    where: { psychologistId: psychId, status: "SIGNED" },
                    select: { assessmentDate: true },
                    orderBy: { assessmentDate: "desc" },
                    take: 1,
                },
            },
        }),
        // Count of workers with high/very high risk
        prisma.worker.count({
            where: {
                assessments: {
                    some: {
                        psychologistId: psychId,
                        status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                        scoredResult: { overallRiskCategory: { in: ["ALTO", "MUY_ALTO"] } },
                    },
                },
            },
        }),
        // Workers with high/very high risk (for the alert card)
        prisma.worker.findMany({
            where: {
                assessments: {
                    some: {
                        psychologistId: psychId,
                        status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                        scoredResult: { overallRiskCategory: { in: ["ALTO", "MUY_ALTO"] } },
                    },
                },
            },
            select: {
                id: true,
                fullName: true,
                organization: { select: { name: true } },
                assessments: {
                    where: {
                        psychologistId: psychId,
                        status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                        scoredResult: { overallRiskCategory: { in: ["ALTO", "MUY_ALTO"] } },
                    },
                    select: {
                        id: true,
                        scoredResult: { select: { overallRiskCategory: true } },
                    },
                    orderBy: { assessmentDate: "desc" },
                    take: 1,
                },
            },
            take: 4,
        }),
        // Per-org metrics for the summary table
        prisma.organization.findMany({
            where: { createdByPsychologist: psychId },
            select: {
                id: true,
                name: true,
                _count: { select: { workers: true } },
                assessments: {
                    where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED", "SIGNED"] } },
                    select: {
                        workerId: true,
                        status: true,
                        scoredResult: { select: { overallRiskCategory: true } },
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    const firstName = session.user.fullName.split(" ")[0];

    // Build monthly data for the last 12 months
    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthKeys.push(d.toISOString().slice(0, 7));
    }
    const monthlyMap: Record<string, MonthlyData> = {};
    for (const mk of monthKeys) {
        const [year, month] = mk.split("-");
        const label = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
        monthlyMap[mk] = { month: mk, label, intralaboral: 0, extralaboral: 0, stress: 0 };
    }
    for (const a of last12Months) {
        const mk = new Date(a.assessmentDate).toISOString().slice(0, 7);
        if (monthlyMap[mk]) {
            const qt = a.questionnaireType as string;
            if (qt === "INTRALABORAL") monthlyMap[mk].intralaboral++;
            else if (qt === "EXTRALABORAL") monthlyMap[mk].extralaboral++;
            else if (qt === "STRESS") monthlyMap[mk].stress++;
        }
    }
    const monthlyData = monthKeys.map(mk => monthlyMap[mk]);

    // Build per-org summaries for the table
    const riskOrder = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];
    const orgSummaries: OrgSummary[] = orgsWithMetrics.map(org => {
        const riskMap: Record<string, number> = {};
        let signed = 0;
        let pending = 0;
        for (const a of org.assessments) {
            if (a.status === "SIGNED") signed++;
            else pending++;
            const rk = a.scoredResult?.overallRiskCategory;
            if (rk) riskMap[rk] = (riskMap[rk] ?? 0) + 1;
        }
        const riskDist = riskOrder.map(key => ({ key, count: riskMap[key] ?? 0 }));
        
        // Use severity-weighted predominant: pick highest-severity with most entries
        const predominantBySeverity = ["MUY_ALTO", "ALTO", "MEDIO", "BAJO", "SIN_RIESGO"].find(k => (riskMap[k] ?? 0) > 0) ?? null;
        
        // Critical count = distinct workers with ALTO/MUY_ALTO risk in this org
        const criticalCount = org.assessments
            .filter(a => a.scoredResult?.overallRiskCategory === "ALTO" || a.scoredResult?.overallRiskCategory === "MUY_ALTO")
            .map(a => a.workerId)
            .filter((v, i, a) => a.indexOf(v) === i).length;

        return {
            id: org.id,
            name: org.name,
            workerCount: org._count.workers,
            totalAssessments: org.assessments.length,
            signed,
            pending,
            criticalCount,
            predominantRisk: predominantBySeverity,
            riskDistribution: riskDist,
        };
    });

    // Build per-org monthly data for the detail panel
    const orgMonthlyRaw = await prisma.assessment.findMany({
        where: {
            psychologistId: psychId,
            status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
            assessmentDate: { gte: twelveMonthsAgo },
        },
        select: { assessmentDate: true, questionnaireType: true, organizationId: true },
    });
    const orgMonthly = orgsWithMetrics.map(org => {
        const orgMap: Record<string, MonthlyData> = {};
        for (const mk of monthKeys) {
            const [year, month] = mk.split("-");
            const label = new Date(parseInt(year), parseInt(month) - 1, 1)
                .toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
            orgMap[mk] = { month: mk, label, intralaboral: 0, extralaboral: 0, stress: 0 };
        }
        for (const a of orgMonthlyRaw.filter(r => r.organizationId === org.id)) {
            const mk = new Date(a.assessmentDate).toISOString().slice(0, 7);
            if (orgMap[mk]) {
                const qt = a.questionnaireType as string;
                if (qt === "INTRALABORAL") orgMap[mk].intralaboral++;
                else if (qt === "EXTRALABORAL") orgMap[mk].extralaboral++;
                else if (qt === "STRESS") orgMap[mk].stress++;
            }
        }
        return { orgId: org.id, monthly: monthKeys.map(mk => orgMap[mk]) };
    });

    // Expiring workers (global, across all orgs)
    const ALERT_MS = 1.5 * 365.25 * 24 * 60 * 60 * 1000;
    const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiringWorkers = allWorkersForExpiry.filter(w => {
        const lastDate = w.assessments[0]?.assessmentDate;
        if (!lastDate) return true; // never assessed
        const age = now - new Date(lastDate).getTime();
        return age >= ALERT_MS;
    });
    const expiredCount = allWorkersForExpiry.filter(w => {
        const lastDate = w.assessments[0]?.assessmentDate;
        if (!lastDate) return false;
        return now - new Date(lastDate).getTime() >= TWO_YEARS_MS;
    }).length;

    // Build risk distribution sorted by severity
    const totalRisk = riskGroups.reduce((sum, g) => sum + g._count.overallRiskCategory, 0);
    const riskDistribution = riskOrder
        .map(key => {
            const found = riskGroups.find(g => g.overallRiskCategory === key);
            return { key, count: found?._count.overallRiskCategory ?? 0 };
        })
        .filter(r => r.count > 0);

    const alertCount = criticalWorkerCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Bienvenido/a, {firstName}</h2>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild className="gap-2 hidden sm:flex">
                        <Link href="/dashboard/assessments/new/manual">
                            <Plus className="h-4 w-4" />
                            Nueva evaluacion
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="gap-2 hidden sm:flex">
                        <Link href="/dashboard/organizations">
                            <Building2 className="h-4 w-4" />
                            Gestionar empresas
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Expiration alerts */}
            {expiringWorkers.length > 0 && (
                <div className={`rounded-xl border px-5 py-3.5 flex items-start gap-3 ${expiredCount > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${expiredCount > 0 ? "text-red-500" : "text-amber-500"}`} />
                    <div className="flex-1">
                        <p className={`font-semibold text-sm ${expiredCount > 0 ? "text-red-800" : "text-amber-800"}`}>
                            {expiredCount > 0
                                ? `${expiredCount} trabajador${expiredCount > 1 ? "es" : ""} con evaluación vencida`
                                : `${expiringWorkers.length} trabajador${expiringWorkers.length > 1 ? "es" : ""} próximo${expiringWorkers.length > 1 ? "s" : ""} a vencer`}
                        </p>
                        <p className={`text-xs mt-0.5 ${expiredCount > 0 ? "text-red-700" : "text-amber-700"}`}>
                            La Res. 2764/2022 exige reevaluación cada 2 años. Revisa cada empresa para ver los trabajadores afectados.
                        </p>
                    </div>
                    <Link href="/dashboard/organizations" className={`text-xs font-semibold shrink-0 underline ${expiredCount > 0 ? "text-red-700" : "text-amber-700"}`}>
                        Ver empresas →
                    </Link>
                </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Evaluaciones",       value: assessmentCount, icon: ClipboardList, color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-200" },
                    { label: "Empresas activas",    value: orgCount,        icon: Building2,     color: "text-blue-600",    bg: "bg-blue-50",    ring: "ring-blue-200" },
                    { label: "Trabajadores",        value: workerCount,     icon: Users,         color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" },
                    { label: "Reportes firmados",   value: signedCount,     icon: FileText,      color: "text-orange-600",  bg: "bg-orange-50",  ring: "ring-orange-200" },
                ].map(({ label, value, icon: Icon, color, bg, ring }) => (
                    <div key={label} className={`rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ${ring}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className="mt-1.5 text-3xl font-bold text-foreground">{value}</p>
                            </div>
                            <div className={`rounded-lg p-2.5 ${bg}`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerts row */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Pending to sign */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg p-2 bg-amber-100">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-900">Pendientes de firma</p>
                                <p className="text-xs text-amber-700">{pendingCount} {pendingCount === 1 ? "reporte requiere" : "reportes requieren"} atención</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
                    </div>
                    {pendingToSign.length > 0 && (
                        <div className="space-y-1.5">
                            {pendingToSign.map(a => (
                                <Link
                                    key={a.id}
                                    href={`/dashboard/reports/${a.id}`}
                                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs hover:bg-white transition-colors group"
                                >
                                    <div>
                                        <span className="font-medium text-amber-900">{a.worker.fullName}</span>
                                        <span className="text-amber-600 ml-1.5">— {a.organization.name}</span>
                                    </div>
                                    <PenLine className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-700" />
                                </Link>
                            ))}
                            {pendingCount > 4 && (
                                <Link href="/dashboard/reports" className="flex items-center gap-1 text-xs text-amber-700 hover:underline pt-1 pl-1">
                                    Ver todos <ArrowRight className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Risk alerts */}
                <div className={`rounded-xl border p-5 shadow-sm ${alertCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`rounded-lg p-2 ${alertCount > 0 ? "bg-red-100" : "bg-muted"}`}>
                                <AlertTriangle className={`h-4 w-4 ${alertCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${alertCount > 0 ? "text-red-900" : "text-foreground"}`}>Riesgo Alto / Muy Alto</p>
                                <p className={`text-xs ${alertCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>
                                    {alertCount > 0 ? `${alertCount} trabajadores en zona crítica` : "Sin alertas críticas"}
                                </p>
                            </div>
                        </div>
                        <span className={`text-2xl font-bold ${alertCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>{alertCount}</span>
                    </div>
                    {alertCount > 0 && criticalWorkers.length > 0 && (
                        <div className="space-y-1.5">
                            {criticalWorkers.map(w => {
                                const latestAlert = w.assessments[0];
                                if (!latestAlert || !latestAlert.scoredResult) return null;
                                return (
                                <Link
                                    key={w.id}
                                    href={`/dashboard/reports/${latestAlert.id}`}
                                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs hover:bg-white transition-colors group"
                                >
                                    <div>
                                        <span className="font-medium text-red-900">{w.fullName}</span>
                                        <span className="text-red-600 ml-1.5">— {w.organization.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${latestAlert.scoredResult.overallRiskCategory === "MUY_ALTO" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"}`}>
                                        {latestAlert.scoredResult.overallRiskCategory === "MUY_ALTO" ? "Muy Alto" : "Alto"}
                                    </span>
                                </Link>
                                );
                            })}
                            {alertCount > 4 && (
                                <Link href="/dashboard/reports" className="flex items-center gap-1 text-xs text-red-700 hover:underline pt-1 pl-1">
                                    Ver todos <ArrowRight className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Per-org detail panel + summary table */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Estado por Empresa</h3>
                    <span className="text-xs text-muted-foreground">{orgSummaries.length} empresa(s)</span>
                </div>
                <OrgDetailPanel orgs={orgSummaries} orgMonthly={orgMonthly} />
                <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Resumen de todas las empresas</h4>
                    <OrgRiskSummaryTable orgs={orgSummaries} />
                </div>
            </div>

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Evaluaciones por Mes</h3>
                        <span className="text-xs text-muted-foreground">Últimos 12 meses</span>
                    </div>
                    <AssessmentsByMonthChart data={monthlyData} />
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Distribución de Riesgo Global</h3>
                        <span className="text-xs text-muted-foreground">{totalRisk} evaluaciones</span>
                    </div>
                    <RiskDistributionChart data={riskDistribution} total={totalRisk} />
                </div>
            </div>

            {/* Recent evaluations */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Evaluaciones recientes</h3>
                    <Link href="/dashboard/assessments" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        Ver todas <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                {recentAssessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No hay evaluaciones aun.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {recentAssessments.map((assessment) => {
                            const statusCls = statusColors[assessment.status] || statusColors.SCORED;
                            const statusLabel = statusLabels[assessment.status] || assessment.status;
                            return (
                                <div key={assessment.id} className="flex items-center justify-between py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-foreground">{assessment.worker.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{assessment.organization.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="hidden text-xs text-muted-foreground sm:block">
                                            {new Date(assessment.assessmentDate).toLocaleDateString("es-CO")}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusCls}`}>
                                            {assessment.status === "SIGNED"
                                                ? <CheckCircle2 className="h-3 w-3" />
                                                : <Clock className="h-3 w-3" />
                                            }
                                            {statusLabel}
                                        </span>
                                        <Link
                                            href={`/dashboard/reports/${assessment.id}`}
                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                        >
                                            {assessment.status === "SIGNED"
                                                ? "Ver"
                                                : "Revisar"
                                            }
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/assessments/new/manual" className="group flex items-start p-5 rounded-xl border border-border bg-card hover:border-primary hover:ring-1 hover:ring-primary transition-all shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-sm font-semibold text-foreground">Digitalizar Bateria</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">Transcripcion rapida de cuestionarios fisicos con calculo automatico.</p>
                    </div>
                </Link>
                <Link href="/dashboard/organizations" className="group flex items-start p-5 rounded-xl border border-border bg-card hover:border-primary hover:ring-1 hover:ring-primary transition-all shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-sm font-semibold text-foreground">Empresas y Trabajadores</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">Gestiona las organizaciones evaluadas y sus empleados.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
