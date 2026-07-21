import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, FileDown, Eye, PenLine, CheckCircle2, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterBar from "@/components/psicosst/filter-bar";
import { Suspense } from "react";
import DeleteAssessmentButton from "./delete-assessment-button";

const PAGE_SIZE = 50;

const riskColors: Record<string, string> = {
    SIN_RIESGO: "bg-green-100 text-green-700",
    BAJO: "bg-lime-100 text-lime-700",
    MEDIO: "bg-yellow-100 text-yellow-700",
    ALTO: "bg-orange-100 text-orange-700",
    MUY_ALTO: "bg-red-100 text-red-700"
};

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto"
};

const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Intralaboral",
    EXTRALABORAL: "Extralaboral",
    STRESS: "Estres"
};

const statusConfig: Record<string, { label: string; icon: "check" | "clock"; class: string }> = {
    SCORED:    { label: "Calificado", icon: "clock",  class: "bg-yellow-100 text-yellow-700" },
    REVIEWED:  { label: "Revisado",   icon: "clock",  class: "bg-blue-100 text-blue-700" },
    SIGNED:    { label: "Firmado",    icon: "check",  class: "bg-green-100 text-green-700" },
    COMPLETED: { label: "Completado", icon: "clock",  class: "bg-gray-100 text-gray-700" },
};

interface PageProps {
    searchParams: Promise<{ q?: string; org?: string; risk?: string; status?: string; type?: string; page?: string }>;
}

export default async function AssessmentsPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const orgFilter = params.org || "";
    const riskFilter = params.risk || "";
    const statusFilter = params.status || "";
    const typeFilter = params.type || "";
    const page = Math.max(1, parseInt(params.page || "1"));

    const whereClause: any = {
        psychologistId: session.user.id,
        status: statusFilter
            ? { equals: statusFilter }
            : { in: ["COMPLETED", "SCORED", "REVIEWED", "SIGNED"] },
        ...(orgFilter && { organizationId: orgFilter }),
        ...(typeFilter && { questionnaireType: typeFilter }),
        ...(riskFilter && { scoredResult: { overallRiskCategory: riskFilter } }),
        ...(q && {
            worker: {
                OR: [
                    { fullName: { contains: q, mode: "insensitive" } },
                    { documentId: { contains: q, mode: "insensitive" } },
                ],
            },
        }),
    };

    const [assessments, totalCount, organizations] = await Promise.all([
        prisma.assessment.findMany({
            where: whereClause,
            include: {
                worker: { select: { fullName: true, documentId: true, jobTitle: true } },
                organization: { select: { id: true, name: true } },
                scoredResult: { select: { overallRiskCategory: true, totalScores: true } },
            },
            orderBy: { assessmentDate: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.assessment.count({ where: whereClause }),
        prisma.organization.findMany({
            where: { createdByPsychologist: session.user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasFilters = !!(q || orgFilter || riskFilter || statusFilter || typeFilter);

    const buildPageUrl = (p: number) => {
        const sp = new URLSearchParams();
        if (q) sp.set("q", q);
        if (orgFilter) sp.set("org", orgFilter);
        if (riskFilter) sp.set("risk", riskFilter);
        if (statusFilter) sp.set("status", statusFilter);
        if (typeFilter) sp.set("type", typeFilter);
        sp.set("page", String(p));
        return `/dashboard/assessments?${sp.toString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Evaluaciones Completadas</h2>
                    <p className="text-sm text-muted-foreground">
                        {totalCount} resultado{totalCount !== 1 ? "s" : ""}
                        {hasFilters ? " (filtrado)" : " en total"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a
                        href="/api/assessments/export"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        title="Exportar a CSV"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar CSV
                    </a>
                    <Button asChild className="gap-2">
                        <Link href="/dashboard/assessments/new/manual">
                            <Plus className="h-4 w-4" />
                            Digitalizar Papel
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter bar */}
            <Suspense>
                <FilterBar
                    searchPlaceholder="Buscar por trabajador o documento..."
                    filters={[
                        {
                            key: "org",
                            placeholder: "Todas las empresas",
                            options: organizations.map(o => ({ value: o.id, label: o.name })),
                        },
                        {
                            key: "status",
                            placeholder: "Todos los estados",
                            options: [
                                { value: "SCORED",   label: "Calificado" },
                                { value: "REVIEWED", label: "Revisado" },
                                { value: "SIGNED",   label: "Firmado" },
                            ],
                        },
                        {
                            key: "risk",
                            placeholder: "Todos los riesgos",
                            options: [
                                { value: "SIN_RIESGO", label: "Sin Riesgo" },
                                { value: "BAJO",       label: "Bajo" },
                                { value: "MEDIO",      label: "Medio" },
                                { value: "ALTO",       label: "Alto" },
                                { value: "MUY_ALTO",   label: "Muy Alto" },
                            ],
                        },
                        {
                            key: "type",
                            placeholder: "Todos los cuestionarios",
                            options: [
                                { value: "INTRALABORAL",  label: "Intralaboral" },
                                { value: "EXTRALABORAL",  label: "Extralaboral" },
                                { value: "STRESS",        label: "Estrés" },
                            ],
                        },
                    ]}
                />
            </Suspense>

            {assessments.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {hasFilters ? "Sin resultados" : "No hay evaluaciones"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        {hasFilters
                            ? "Intenta con otros filtros de búsqueda."
                            : "Comienza digitalizando los cuestionarios físicos de los trabajadores."
                        }
                    </p>
                    {!hasFilters && (
                        <Button asChild>
                            <Link href="/dashboard/assessments/new/manual">Digitalizar Primera Evaluacion</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trabajador</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organizacion</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuestionario</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Riesgo</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {assessments.map((assessment) => {
                                    const risk = assessment.scoredResult?.overallRiskCategory || "SIN_RIESGO";
                                    const totalScores = assessment.scoredResult?.totalScores as any;
                                    const transformedScore = totalScores?.transformedScore;
                                    const status = statusConfig[assessment.status] || statusConfig.SCORED;

                                    return (
                                        <tr key={assessment.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-foreground">{assessment.worker.fullName}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{assessment.worker.documentId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {assessment.organization.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10">
                                                    {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType}
                                                    {" "}Forma {assessment.formType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {new Date(assessment.assessmentDate).toLocaleDateString("es-CO", {
                                                    year: "numeric", month: "short", day: "numeric"
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${riskColors[risk]}`}>
                                                    {riskLabels[risk]}
                                                    {transformedScore !== undefined && (
                                                        <span className="opacity-70">({transformedScore.toFixed(1)})</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
                                                    {status.icon === "check"
                                                        ? <CheckCircle2 className="h-3 w-3" />
                                                        : <Clock className="h-3 w-3" />
                                                    }
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/dashboard/reports/${assessment.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                                                    >
                                                        {assessment.status === "SIGNED"
                                                            ? <><Eye className="h-3.5 w-3.5" /> Ver</>
                                                            : <><PenLine className="h-3.5 w-3.5" /> Revisar</>
                                                        }
                                                    </Link>
                                                    <a
                                                        href={`/api/assessments/${assessment.id}/report/pdf`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <FileDown className="h-3.5 w-3.5" />
                                                        PDF
                                                    </a>
                                                    <Link
                                                        href={`/dashboard/assessments/${assessment.id}/edit`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100 transition-colors"
                                                        title="Editar Respuestas"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        Editar
                                                    </Link>
                                                    <DeleteAssessmentButton id={assessment.id} />
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
                                Página {page} de {totalPages} ({totalCount} evaluaciones)
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
