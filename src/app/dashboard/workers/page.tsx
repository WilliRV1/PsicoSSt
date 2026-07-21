import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileDown, Eye, AlertTriangle, Building2, ClipboardList, Filter } from "lucide-react";
import FilterBar from "@/components/psicosst/filter-bar";
import { Suspense } from "react";
import AddWorkerGlobalButton from "@/components/workers/AddWorkerGlobalButton";
import { RiskBadge, RiskLevel } from "@/components/ui/atoms/RiskBadge";

const PAGE_SIZE = 50;

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo",
};

interface PageProps {
    searchParams: Promise<{ q?: string; org?: string; level?: string; risk?: string; status?: string; page?: string }>;
}

export default async function WorkersPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const orgFilter = params.org || "";
    const levelFilter = params.level || "";
    const riskFilter = params.risk || "";
    const statusFilter = params.status || "";
    const page = Math.max(1, parseInt(params.page || "1"));

    const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
    const EIGHTEEN_MONTHS_MS = 1.5 * 365.25 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const whereClause = {
        organization: { createdByPsychologist: session.user.id },
        ...(orgFilter && { organizationId: orgFilter }),
        ...(levelFilter && { jobLevel: levelFilter as any }),
        ...(q && {
            OR: [
                { fullName: { contains: q, mode: "insensitive" as const } },
                { documentId: { contains: q, mode: "insensitive" as const } },
            ],
        }),
    };

    const [workers, totalCount, organizations] = await Promise.all([
        prisma.worker.findMany({
            where: whereClause,
            include: {
                organization: { select: { id: true, name: true } },
                assessments: {
                    where: {
                        psychologistId: session.user.id,
                        status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                    },
                    include: {
                        scoredResult: { select: { overallRiskCategory: true } },
                    },
                    orderBy: { assessmentDate: "desc" },
                    take: 1,
                },
            },
            orderBy: { fullName: "asc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.worker.count({ where: whereClause }),
        prisma.organization.findMany({
            where: { createdByPsychologist: session.user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Post-filter logic
    const filteredWorkers = workers.filter((w) => {
        const lastAssessment = w.assessments[0];
        const lastRisk = lastAssessment?.scoredResult?.overallRiskCategory;
        const lastDate = lastAssessment?.assessmentDate;
        
        if (riskFilter && lastRisk !== riskFilter) return false;
        
        if (statusFilter) {
            if (statusFilter === "none" && lastDate) return false;
            if (statusFilter === "expiring" && (!lastDate || now - new Date(lastDate).getTime() < EIGHTEEN_MONTHS_MS || now - new Date(lastDate).getTime() >= TWO_YEARS_MS)) return false;
            if (statusFilter === "expired" && (!lastDate || now - new Date(lastDate).getTime() < TWO_YEARS_MS)) return false;
        }
        
        return true;
    });

    // Stats
    const totalWorkers = totalCount;
    const expiredCount = filteredWorkers.filter((w) => {
        const lastDate = w.assessments[0]?.assessmentDate;
        if (!lastDate) return true;
        return now - new Date(lastDate).getTime() >= TWO_YEARS_MS;
    }).length;
    
    const highRiskCount = filteredWorkers.filter((w) => {
        const risk = w.assessments[0]?.scoredResult?.overallRiskCategory;
        return risk === "ALTO" || risk === "MUY_ALTO";
    }).length;

    const buildPageUrl = (p: number, overrides?: { risk?: string; status?: string }) => {
        const urlParams = new URLSearchParams();
        if (q) urlParams.set("q", q);
        if (orgFilter) urlParams.set("org", orgFilter);
        if (levelFilter) urlParams.set("level", levelFilter);
        
        const r = overrides?.risk !== undefined ? overrides.risk : riskFilter;
        if (r) urlParams.set("risk", r);
        
        const s = overrides?.status !== undefined ? overrides.status : statusFilter;
        if (s) urlParams.set("status", s);
        
        urlParams.set("page", String(p));
        return `/dashboard/workers?${urlParams.toString()}`;
    };

    const quickFilters = [
        { label: "Todos", risk: "", status: "" },
        { label: "Sin Riesgo", risk: "SIN_RIESGO", status: "" },
        { label: "Bajo", risk: "BAJO", status: "" },
        { label: "Medio", risk: "MEDIO", status: "" },
        { label: "Alto", risk: "ALTO", status: "" },
        { label: "Muy Alto", risk: "MUY_ALTO", status: "" },
        { label: "Vencen este mes", risk: "", status: "expiring" },
        { label: "Sin evaluar", risk: "", status: "none" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-[24px] font-bold text-foreground font-heading tracking-tight">Trabajadores</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        {totalWorkers} trabajador{totalWorkers !== 1 ? "es" : ""}
                        {q || orgFilter || levelFilter || riskFilter || statusFilter ? " (filtrado)" : " registrados"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <AddWorkerGlobalButton organizations={organizations} />
                    <a
                        href={"/api/workers/export" + (orgFilter ? "?orgId=" + orgFilter : "")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                        title="Exportar a CSV"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar CSV
                    </a>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                <Filter className="w-4 h-4 text-text-muted flex-shrink-0 mr-2" />
                {quickFilters.map((qf, idx) => {
                    const isActive = riskFilter === qf.risk && statusFilter === qf.status;
                    return (
                        <Link
                            key={idx}
                            href={buildPageUrl(1, { risk: qf.risk, status: qf.status })}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                                isActive 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "bg-surface text-text-secondary border-border hover:border-border-focus hover:text-text"
                            }`}
                        >
                            {qf.label}
                        </Link>
                    )
                })}
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-info/10 p-2.5">
                            <Users className="h-5 w-5 text-info" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Base</p>
                            <p className="text-[24px] font-bold text-foreground mt-0.5">{totalWorkers}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-xl border p-5 shadow-sm ${expiredCount > 0 ? "border-warning/30 bg-warning/5" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2.5 ${expiredCount > 0 ? "bg-warning/20 text-warning-foreground" : "bg-surface-muted text-text-muted"}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${expiredCount > 0 ? "text-warning" : "text-text-muted"}`}>Sin evaluar / Vencidos</p>
                            <p className={`text-[24px] font-bold mt-0.5 ${expiredCount > 0 ? "text-warning" : "text-foreground"}`}>{expiredCount}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-xl border p-5 shadow-sm ${highRiskCount > 0 ? "border-danger/30 bg-danger/5" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2.5 ${highRiskCount > 0 ? "bg-danger/20 text-danger" : "bg-surface-muted text-text-muted"}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${highRiskCount > 0 ? "text-danger" : "text-text-muted"}`}>Riesgo Alto / Muy Alto</p>
                            <p className={`text-[24px] font-bold mt-0.5 ${highRiskCount > 0 ? "text-danger" : "text-foreground"}`}>{highRiskCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <Suspense fallback={<div className="h-10 w-full animate-pulse bg-surface-muted rounded-lg border border-border"></div>}>
                <FilterBar
                    searchPlaceholder="Buscar por nombre o documento..."
                    filters={[
                        {
                            key: "org",
                            placeholder: "Todas las empresas",
                            options: organizations.map((o) => ({ value: o.id, label: o.name })),
                        },
                        {
                            key: "level",
                            placeholder: "Todos los niveles",
                            options: [
                                { value: "JEFATURA", label: "Jefatura" },
                                { value: "PROFESIONAL", label: "Profesional" },
                                { value: "TECNICO", label: "Técnico" },
                                { value: "AUXILIAR", label: "Auxiliar" },
                                { value: "OPERATIVO", label: "Operativo" },
                            ],
                        }
                    ]}
                />
            </Suspense>

            {filteredWorkers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted py-16 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border shadow-sm">
                        <Users className="h-8 w-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground font-heading mb-2">
                        {q || orgFilter || levelFilter || riskFilter ? "Sin resultados" : "No hay trabajadores"}
                    </h3>
                    <p className="text-sm text-text-secondary max-w-sm mx-auto">
                        {q || orgFilter || levelFilter || riskFilter
                            ? "Intenta con otros filtros de búsqueda."
                            : "Agrega trabajadores desde la sección de empresas."}
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-muted border-b border-border">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Trabajador</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Cargo</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Último Riesgo</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredWorkers.map((worker) => {
                                    const lastAssessment = worker.assessments[0];
                                    const lastRisk = lastAssessment?.scoredResult?.overallRiskCategory as RiskLevel;
                                    const lastDate = lastAssessment?.assessmentDate;
                                    const ageMs = lastDate ? now - new Date(lastDate).getTime() : null;
                                    const isExpired = ageMs === null || ageMs >= TWO_YEARS_MS;
                                    const isExpiring = ageMs !== null && ageMs >= EIGHTEEN_MONTHS_MS && ageMs < TWO_YEARS_MS;

                                    return (
                                        <tr key={worker.id} className="hover:bg-surface-muted/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-foreground">{worker.fullName}</div>
                                                <div className="text-[11px] text-text-secondary mt-0.5 font-mono">{worker.documentId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/dashboard/organizations/${worker.organization.id}`}
                                                    className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    <span className="truncate max-w-[150px]">{worker.organization.name}</span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                                <div className="flex flex-col">
                                                    <span>{worker.jobTitle || "—"}</span>
                                                    <span className="text-[11px] font-medium text-text-muted mt-0.5">{jobLevelLabels[worker.jobLevel] || worker.jobLevel}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col items-start gap-1">
                                                    {lastRisk ? (
                                                        <RiskBadge level={lastRisk} showDot />
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-muted text-text-muted border border-border uppercase tracking-wider">
                                                            Sin evaluar
                                                        </span>
                                                    )}
                                                    {lastDate && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-[11px] text-text-muted font-mono">
                                                                {new Date(lastDate).toLocaleDateString("es-CO")}
                                                            </span>
                                                            {isExpired && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" title="Evaluación Vencida"></span>
                                                            )}
                                                            {isExpiring && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" title="Por Vencer"></span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/workers/${worker.id}`}
                                                        className="inline-flex items-center justify-center p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                                                        title="Ver Expediente"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/assessments/new/manual?workerId=${worker.id}&orgId=${worker.organization.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                                    >
                                                        <ClipboardList className="h-3.5 w-3.5" />
                                                        Evaluar
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-surface-muted/30">
                            <p className="text-xs text-text-muted">
                                Página <span className="font-semibold text-foreground">{page}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                {page > 1 && (
                                    <Link
                                        href={buildPageUrl(page - 1)}
                                        className="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                                    >
                                        Anterior
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={buildPageUrl(page + 1)}
                                        className="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                                    >
                                        Siguiente
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
    );
}
