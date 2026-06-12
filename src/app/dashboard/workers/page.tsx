import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileDown, Eye, AlertTriangle, Building2, ClipboardList } from "lucide-react";
import FilterBar from "@/components/psicosst/filter-bar";
import { Suspense } from "react";

const PAGE_SIZE = 50;

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo",
};

const riskColors: Record<string, string> = {
    SIN_RIESGO: "bg-green-100 text-green-700",
    BAJO: "bg-lime-100 text-lime-700",
    MEDIO: "bg-yellow-100 text-yellow-700",
    ALTO: "bg-orange-100 text-orange-700",
    MUY_ALTO: "bg-red-100 text-red-700",
};

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

interface PageProps {
    searchParams: Promise<{ q?: string; org?: string; level?: string; risk?: string; page?: string }>;
}

export default async function WorkersPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const orgFilter = params.org || "";
    const levelFilter = params.level || "";
    const riskFilter = params.risk || "";
    const page = Math.max(1, parseInt(params.page || "1"));

    const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
    const EIGHTEEN_MONTHS_MS = 1.5 * 365.25 * 24 * 60 * 60 * 1000;

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

    // Post-filter by risk if needed
    const now = Date.now();
    const filteredWorkers = workers.filter((w) => {
        if (riskFilter) {
            const lastRisk = w.assessments[0]?.scoredResult?.overallRiskCategory;
            if (lastRisk !== riskFilter) return false;
        }
        return true;
    });

    // Stats (from current page)
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

    const buildPageUrl = (p: number) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (orgFilter) params.set("org", orgFilter);
        if (levelFilter) params.set("level", levelFilter);
        if (riskFilter) params.set("risk", riskFilter);
        params.set("page", String(p));
        return `/dashboard/workers?${params.toString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Trabajadores</h2>
                    <p className="text-sm text-muted-foreground">
                        {totalWorkers} trabajador{totalWorkers !== 1 ? "es" : ""}
                        {q || orgFilter || levelFilter || riskFilter ? " (filtrado)" : " registrados"}
                    </p>
                </div>
                <a
                    href={`/api/workers/export${orgFilter ? `?orgId=${orgFilter}` : ""}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    title="Exportar a CSV"
                >
                    <FileDown className="h-4 w-4" />
                    Exportar CSV
                </a>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-indigo-50 p-2">
                            <Users className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-xl font-bold text-foreground">{totalWorkers}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-xl border p-4 shadow-sm ${expiredCount > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-2 ${expiredCount > 0 ? "bg-amber-100" : "bg-muted"}`}>
                            <AlertTriangle className={`h-4 w-4 ${expiredCount > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className={`text-xs ${expiredCount > 0 ? "text-amber-700" : "text-muted-foreground"}`}>Sin evaluar / Vencidos</p>
                            <p className={`text-xl font-bold ${expiredCount > 0 ? "text-amber-700" : "text-foreground"}`}>{expiredCount}</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-xl border p-4 shadow-sm ${highRiskCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-2 ${highRiskCount > 0 ? "bg-red-100" : "bg-muted"}`}>
                            <AlertTriangle className={`h-4 w-4 ${highRiskCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className={`text-xs ${highRiskCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>Riesgo Alto / Muy Alto</p>
                            <p className={`text-xl font-bold ${highRiskCount > 0 ? "text-red-700" : "text-foreground"}`}>{highRiskCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <Suspense>
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
                        },
                        {
                            key: "risk",
                            placeholder: "Todos los riesgos",
                            options: [
                                { value: "SIN_RIESGO", label: "Sin Riesgo" },
                                { value: "BAJO", label: "Bajo" },
                                { value: "MEDIO", label: "Medio" },
                                { value: "ALTO", label: "Alto" },
                                { value: "MUY_ALTO", label: "Muy Alto" },
                            ],
                        },
                    ]}
                />
            </Suspense>

            {filteredWorkers.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {q || orgFilter || levelFilter || riskFilter ? "Sin resultados" : "No hay trabajadores"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {q || orgFilter || levelFilter || riskFilter
                            ? "Intenta con otros filtros de búsqueda."
                            : "Agrega trabajadores desde la sección de empresas."}
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trabajador</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargo</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nivel</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Último Riesgo</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Última Evaluación</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredWorkers.map((worker) => {
                                    const lastAssessment = worker.assessments[0];
                                    const lastRisk = lastAssessment?.scoredResult?.overallRiskCategory;
                                    const lastDate = lastAssessment?.assessmentDate;
                                    const ageMs = lastDate ? now - new Date(lastDate).getTime() : null;
                                    const isExpired = ageMs === null || ageMs >= TWO_YEARS_MS;
                                    const isExpiring = ageMs !== null && ageMs >= EIGHTEEN_MONTHS_MS && ageMs < TWO_YEARS_MS;

                                    return (
                                        <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-foreground">{worker.fullName}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{worker.documentId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/dashboard/organizations/${worker.organization.id}`}
                                                    className="text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                                                >
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    {worker.organization.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {worker.jobTitle || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10">
                                                    {jobLevelLabels[worker.jobLevel] || worker.jobLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {lastRisk ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${riskColors[lastRisk]}`}>
                                                        {riskLabels[lastRisk]}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sin evaluar</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {lastDate ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-muted-foreground">
                                                            {new Date(lastDate).toLocaleDateString("es-CO", {
                                                                year: "numeric", month: "short", day: "numeric",
                                                            })}
                                                        </span>
                                                        {isExpired && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                                                                Vencida
                                                            </span>
                                                        )}
                                                        {isExpiring && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                                Por vencer
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Nunca</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/dashboard/workers/${worker.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Ver
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/assessments/new/manual?workerId=${worker.id}&orgId=${worker.organization.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary shadow-sm hover:bg-primary/10 transition-colors"
                                                        title="Nueva evaluación"
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
                        <div className="flex items-center justify-between border-t border-border px-6 py-3">
                            <p className="text-xs text-muted-foreground">
                                Página {page} de {totalPages} ({totalCount} trabajadores)
                            </p>
                            <div className="flex gap-2">
                                {page > 1 && (
                                    <Link
                                        href={buildPageUrl(page - 1)}
                                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                                    >
                                        Anterior
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={buildPageUrl(page + 1)}
                                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
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
