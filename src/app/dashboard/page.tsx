import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
    ClipboardList, Building2, Users, FileText,
    Clock, CheckCircle2, Plus, ArrowRight, PenLine, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { RiskDistribution } from "@/components/dashboard/RiskDistribution";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { DataGrid } from "@/components/ui/organisms/DataGrid";
import { RiskBadge, RiskLevel } from "@/components/ui/atoms/RiskBadge";
import EmptyDashboardState from "@/components/dashboard/empty-dashboard-state";

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

interface MonthlyData {
    month: string;
    label: string;
    intralaboral: number;
    extralaboral: number;
    stress: number;
}

interface OrgSummary {
    id: string;
    name: string;
    workerCount: number;
    totalAssessments: number;
    signed: number;
    pending: number;
    criticalCount: number;
    predominantRisk: string | null;
    riskDistribution: { key: string; count: number; }[];
}
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

    if (orgCount === 0) {
        return <EmptyDashboardState firstName={firstName} />;
    }

    // Calculate Health Score dynamically based on data
    const orgHealthScore = Math.max(0, 100 - (alertCount * 5) - (expiredCount * 2));
    const trendHealth = expiredCount > 0 ? -2 : 3;

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-[24px] font-semibold text-text font-heading">Bienvenido/a, {firstName}</h2>
                    <p className="text-[14px] text-text-secondary mt-1">
                        Este es tu Centro de Control. Tienes {pendingCount} evaluaciones pendientes de firma.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild className="hidden sm:flex">
                        <Link href="/dashboard/organizations">
                            <Building2 className="w-4 h-4 mr-2" />
                            Empresas
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/assessments/new/manual">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Evaluación
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Evaluaciones Totales" 
                    value={assessmentCount} 
                    trend={+12} 
                    icon="report" 
                />
                <StatCard 
                    title="Empresas Activas" 
                    value={orgCount} 
                    trend={0} 
                    icon="company" 
                />
                <StatCard 
                    title="Trabajadores" 
                    value={workerCount} 
                    trend={+4} 
                    icon="worker" 
                />
                <StatCard 
                    title="Alertas Críticas" 
                    value={alertCount} 
                    trend={alertCount > 0 ? -15 : +100} 
                    icon="intervention"
                    trendLabel="estado de la red"
                />
            </div>

            {/* Strategic Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <HealthScore 
                        score={orgHealthScore} 
                        trend={trendHealth}
                        factors={{
                            evaluations: Math.min(100, (assessmentCount / (workerCount || 1)) * 100),
                            compliance: expiredCount > 0 ? 60 : 95,
                            interventions: 45,
                            tracking: 70,
                            plans: 30,
                            evidence: 85
                        }} 
                    />
                </div>
                <div className="lg:col-span-1">
                    <RiskDistribution 
                        distribution={{
                            none: riskDistribution.find(r => r.key === 'SIN_RIESGO')?.count || 0,
                            low: riskDistribution.find(r => r.key === 'BAJO')?.count || 0,
                            medium: riskDistribution.find(r => r.key === 'MEDIO')?.count || 0,
                            high: riskDistribution.find(r => r.key === 'ALTO')?.count || 0,
                            veryHigh: riskDistribution.find(r => r.key === 'MUY_ALTO')?.count || 0,
                        }} 
                        total={totalRisk} 
                    />
                </div>
                <div className="lg:col-span-1">
                    <DecisionCard 
                        recommendation="Intervención Prioritaria requerida"
                        confidence={94}
                        impact="HIGH"
                        reason={`Se han detectado ${alertCount} trabajadores en nivel de riesgo crítico, y ${expiringWorkers.length} evaluaciones próximas a vencer. Se requiere acción inmediata para evitar multas normativas.`}
                        actionLabel="Ver Plan Sugerido"
                    />
                </div>
            </div>

            {/* Recents Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-text">Evaluaciones Recientes</h3>
                    <Link href="/dashboard/assessments" className="text-[13px] font-medium text-primary hover:underline">
                        Ver todas
                    </Link>
                </div>
                
                <DataGrid 
                    data={recentAssessments}
                    searchable={false}
                    filterable={false}
                    exportable={false}
                    columns={[
                        {
                            key: 'worker',
                            header: 'Trabajador',
                            render: (row) => (
                                <div className="flex flex-col">
                                    <span className="font-medium text-text">{row.worker.fullName}</span>
                                    <span className="text-xs text-text-muted">{row.organization.name}</span>
                                </div>
                            )
                        },
                        {
                            key: 'assessmentDate',
                            header: 'Fecha',
                            render: (row) => (
                                <span className="text-text-secondary">
                                    {new Date(row.assessmentDate).toLocaleDateString("es-CO")}
                                </span>
                            )
                        },
                        {
                            key: 'status',
                            header: 'Estado',
                            render: (row) => {
                                const st = row.status;
                                if (st === 'SIGNED') return <RiskBadge level="NONE" showDot={false} />;
                                if (st === 'SCORED') return <RiskBadge level="MEDIUM" showDot={false} />;
                                return <RiskBadge level="LOW" showDot={false} />;
                            }
                        }
                    ]}
                    onRowClick={(row) => {
                        window.location.href = `/dashboard/reports/${row.id}`;
                    }}
                />
            </div>
        </div>
    );
}
