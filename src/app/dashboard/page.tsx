import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Building2, AlertTriangle, Clock, CheckCircle2, Plus, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyDashboardState from "@/components/dashboard/empty-dashboard-state";

type ComplianceStatus = "vencida" | "por_vencer" | "sin_evaluar" | "vigente";

const complianceCfg: Record<ComplianceStatus, { label: string; bar: string; badge: string; icon: React.FC<any> }> = {
    vencida:    { label: "Vencida",     bar: "bg-red-500",    badge: "bg-red-100 text-red-700 border-red-200",      icon: AlertTriangle },
    por_vencer: { label: "Por vencer",  bar: "bg-amber-400",  badge: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    sin_evaluar:{ label: "Sin evaluar", bar: "bg-slate-300",  badge: "bg-slate-100 text-slate-600 border-slate-200", icon: Users },
    vigente:    { label: "Vigente",     bar: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border-teal-200",     icon: CheckCircle2 },
};

const statusOrder: ComplianceStatus[] = ["vencida", "por_vencer", "sin_evaluar", "vigente"];

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const psychId = session.user.id;
    const firstName = session.user.fullName?.split(" ")[0] || "Profesional";

    const orgsRaw = await prisma.organization.findMany({
        where: { createdByPsychologist: psychId },
        select: {
            id: true,
            name: true,
            city: true,
            _count: { select: { workers: true } },
            assessments: {
                where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED", "SIGNED"] } },
                select: {
                    workerId: true,
                    status: true,
                    assessmentDate: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
                orderBy: { assessmentDate: "desc" },
            },
        },
        orderBy: { name: "asc" },
    });

    if (orgsRaw.length === 0) {
        return <EmptyDashboardState firstName={firstName} />;
    }

    const now = Date.now();
    const ONE_YEAR_MS  = 365.25 * 24 * 60 * 60 * 1000;
    const TWO_YEARS_MS = 2 * ONE_YEAR_MS;
    const WARN_MS      = 90 * 24 * 60 * 60 * 1000; // 90-day warning window

    const orgCards = orgsRaw.map(org => {
        const signed   = org.assessments.filter(a => a.status === "SIGNED");
        const pending  = org.assessments.filter(a => a.status === "SCORED" || a.status === "REVIEWED");

        const evaluatedIds = new Set(signed.map(a => a.workerId));
        const criticalIds  = new Set(
            signed
                .filter(a => ["ALTO", "MUY_ALTO"].includes(a.scoredResult?.overallRiskCategory ?? ""))
                .map(a => a.workerId)
        );

        const evaluatedCount = evaluatedIds.size;
        const criticalCount  = criticalIds.size;
        const criticalPct    = evaluatedCount > 0 ? (criticalCount / evaluatedCount) * 100 : 0;

        // Most recent signed assessment date
        const lastSigned = signed[0]?.assessmentDate ?? null;

        let complianceStatus: ComplianceStatus;
        let expiryDate: Date | null = null;
        let daysLeft: number | null = null;

        if (!lastSigned) {
            complianceStatus = "sin_evaluar";
        } else {
            const validityMs = criticalPct > 20 ? ONE_YEAR_MS : TWO_YEARS_MS;
            expiryDate = new Date(new Date(lastSigned).getTime() + validityMs);
            daysLeft = Math.floor((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) complianceStatus = "vencida";
            else if (daysLeft <= 90) complianceStatus = "por_vencer";
            else complianceStatus = "vigente";
        }

        return {
            id: org.id,
            name: org.name,
            city: org.city,
            totalWorkers: org._count.workers,
            evaluatedWorkers: evaluatedCount,
            criticalWorkers: criticalCount,
            pendingSignatures: pending.length,
            complianceStatus,
            expiryDate,
            daysLeft,
            lastSigned,
        };
    });

    // Sort by urgency
    orgCards.sort((a, b) =>
        statusOrder.indexOf(a.complianceStatus) - statusOrder.indexOf(b.complianceStatus)
    );

    // Global KPIs
    const needsActionCount  = orgCards.filter(o => o.complianceStatus === "vencida" || o.complianceStatus === "por_vencer").length;
    const totalPending      = orgCards.reduce((s, o) => s + o.pendingSignatures, 0);
    const totalCritical     = orgCards.reduce((s, o) => s + o.criticalWorkers, 0);

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground font-heading tracking-tight">
                        Bienvenido/a, {firstName}
                    </h1>
                    <p className="text-[13px] text-text-secondary mt-1">
                        Panel de cumplimiento · {orgsRaw.length} empresa{orgsRaw.length !== 1 ? "s" : ""} registrada{orgsRaw.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button asChild size="sm">
                    <Link href="/dashboard/organizations">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva empresa
                    </Link>
                </Button>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Requieren atención</p>
                    <p className={`text-[28px] font-bold ${needsActionCount > 0 ? "text-red-600" : "text-foreground"}`}>
                        {needsActionCount}
                    </p>
                    <p className="text-[12px] text-text-secondary mt-0.5">vencidas o por vencer</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Pendientes de firma</p>
                    <p className={`text-[28px] font-bold ${totalPending > 0 ? "text-amber-600" : "text-foreground"}`}>
                        {totalPending}
                    </p>
                    <p className="text-[12px] text-text-secondary mt-0.5">evaluaciones sin firmar</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Riesgo crítico</p>
                    <p className={`text-[28px] font-bold ${totalCritical > 0 ? "text-red-600" : "text-foreground"}`}>
                        {totalCritical}
                    </p>
                    <p className="text-[12px] text-text-secondary mt-0.5">trabajadores Alto/Muy Alto</p>
                </div>
            </div>

            {/* Org cards */}
            <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-3">Estado por empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orgCards.map(org => {
                        const cfg = complianceCfg[org.complianceStatus];
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={org.id}
                                className="relative rounded-xl border border-border bg-card overflow-hidden flex flex-col"
                            >
                                {/* Color bar */}
                                <div className={`h-1 w-full ${cfg.bar}`} />

                                <div className="p-5 flex flex-col flex-1 gap-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[14px] text-foreground truncate">{org.name}</p>
                                            {org.city && (
                                                <p className="text-[12px] text-text-muted truncate mt-0.5">{org.city}</p>
                                            )}
                                        </div>
                                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badge}`}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Metrics */}
                                    <div className="space-y-1.5 text-[13px]">
                                        {/* Evaluation progress */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-text-secondary">Evaluados</span>
                                            <span className="font-medium text-foreground">
                                                {org.evaluatedWorkers} / {org.totalWorkers}
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        {org.totalWorkers > 0 && (
                                            <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${Math.round((org.evaluatedWorkers / org.totalWorkers) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                        {/* Critical */}
                                        {org.criticalWorkers > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-text-secondary">Riesgo crítico</span>
                                                <span className="font-semibold text-red-600">{org.criticalWorkers} trabajador{org.criticalWorkers !== 1 ? "es" : ""}</span>
                                            </div>
                                        )}
                                        {/* Pending signatures */}
                                        {org.pendingSignatures > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-text-secondary">Sin firmar</span>
                                                <span className="font-semibold text-amber-600">{org.pendingSignatures}</span>
                                            </div>
                                        )}
                                        {/* Validity */}
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-text-secondary">
                                                {org.complianceStatus === "sin_evaluar" ? "Última evaluación" : "Vigencia hasta"}
                                            </span>
                                            <span className={`font-medium ${org.complianceStatus === "vencida" ? "text-red-600" : org.complianceStatus === "por_vencer" ? "text-amber-600" : "text-text-secondary"}`}>
                                                {org.complianceStatus === "sin_evaluar"
                                                    ? "—"
                                                    : org.expiryDate?.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="pt-1 mt-auto">
                                        <Link
                                            href={`/dashboard/organizations/${org.id}`}
                                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-surface-muted hover:bg-border text-[13px] font-medium text-foreground transition-colors"
                                        >
                                            <span>Ver empresa</span>
                                            <ArrowRight className="w-4 h-4 text-text-muted" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
