import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Eye, FileDown, CheckCircle2, Clock, PenLine } from "lucide-react";
import FilterBar from "@/components/psicosst/filter-bar";
import BulkExportButton from "@/components/psicosst/bulk-export-button";
import { Suspense } from "react";

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

const statusConfig: Record<string, { label: string; class: string }> = {
    SCORED:   { label: "Calificado", class: "bg-yellow-100 text-yellow-700" },
    REVIEWED: { label: "Revisado",   class: "bg-blue-100 text-blue-700" },
    SIGNED:   { label: "Firmado",    class: "bg-green-100 text-green-700" },
};

interface PageProps {
    searchParams: Promise<{ q?: string; org?: string; risk?: string; status?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const orgFilter = params.org || "";
    const riskFilter = params.risk || "";
    const statusFilter = params.status || "";

    const [assessments, organizations] = await Promise.all([
        prisma.assessment.findMany({
            where: {
                psychologistId: session.user.id,
                status: statusFilter
                    ? { equals: statusFilter as any }
                    : { in: ["SCORED", "REVIEWED", "SIGNED"] },
                ...(orgFilter && { organizationId: orgFilter }),
                ...(riskFilter && { scoredResult: { overallRiskCategory: riskFilter as any } }),
                ...(q && {
                    worker: {
                        OR: [
                            { fullName: { contains: q, mode: "insensitive" } },
                            { documentId: { contains: q, mode: "insensitive" } },
                        ],
                    },
                }),
            },
            include: {
                worker: { select: { fullName: true, documentId: true, jobTitle: true } },
                organization: { select: { id: true, name: true } },
                scoredResult: { select: { overallRiskCategory: true, totalScores: true } },
            },
            orderBy: { assessmentDate: "desc" },
            take: 200,
        }),
        prisma.organization.findMany({
            where: { createdByPsychologist: session.user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const signed = assessments.filter(a => a.status === "SIGNED").length;
    const pending = assessments.filter(a => a.status === "SCORED" || a.status === "REVIEWED").length;
    const hasFilters = !!(q || orgFilter || riskFilter || statusFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Informes Individuales</h2>
                    <p className="text-sm text-muted-foreground">
                        Revisa, firma y descarga los informes de riesgo psicosocial.
                    </p>
                </div>
                {assessments.length > 0 && (
                    <BulkExportButton organizations={organizations} />
                )}
            </div>

            {/* Stats — solo sin filtros activos */}
            {!hasFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-primary">{assessments.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">Total Informes</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-emerald-600">{signed}</div>
                        <p className="text-sm text-muted-foreground mt-1">Firmados</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
                        <div className="text-3xl font-bold text-amber-600">{pending}</div>
                        <p className="text-sm text-muted-foreground mt-1">Pendientes de Firma</p>
                    </div>
                </div>
            )}

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
                    ]}
                />
            </Suspense>

            {assessments.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {hasFilters ? "Sin resultados" : "No hay informes"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {hasFilters
                            ? "Intenta con otros filtros de búsqueda."
                            : "Los informes se generan automaticamente al calificar una evaluacion."
                        }
                    </p>
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
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{assessment.worker.fullName}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{assessment.worker.jobTitle}</div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
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
                                                    {assessment.status === "SIGNED"
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
                                                        title="Descargar PDF"
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                                                    >
                                                        <FileDown className="h-3.5 w-3.5" />
                                                        PDF
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
