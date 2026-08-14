import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, FileDown, Eye, PenLine, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterBar from "@/components/psicosst/filter-bar";
import { Suspense } from "react";
import DeleteAssessmentButton from "./delete-assessment-button";

const riskCfg: Record<string, { label: string; cls: string }> = {
    SIN_RIESGO: { label: "Sin Riesgo", cls: "bg-green-100 text-green-700 border-green-200" },
    BAJO:       { label: "Bajo",       cls: "bg-lime-100 text-lime-700 border-lime-200" },
    MEDIO:      { label: "Medio",      cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    ALTO:       { label: "Alto",       cls: "bg-orange-100 text-orange-700 border-orange-200" },
    MUY_ALTO:   { label: "Muy Alto",   cls: "bg-red-100 text-red-700 border-red-200" },
};

const statusCfg: Record<string, { label: string; cls: string }> = {
    SCORED:    { label: "Calificado", cls: "bg-yellow-100 text-yellow-700" },
    REVIEWED:  { label: "Revisado",   cls: "bg-blue-100 text-blue-700" },
    SIGNED:    { label: "Firmado",    cls: "bg-green-100 text-green-700" },
    COMPLETED: { label: "Completado", cls: "bg-slate-100 text-slate-600" },
};

interface PageProps {
    searchParams: Promise<{ q?: string; org?: string }>;
}

interface SlotAssessment {
    id: string;
    questionnaireType: string;
    formType: string;
    assessmentDate: Date;
    status: string;
    overallRiskCategory: string | null;
}

function AssessmentSlot({
    type,
    label,
    assessment,
    workerId,
    orgId,
}: {
    type: string;
    label: string;
    assessment: SlotAssessment | null;
    workerId: string;
    orgId: string;
}) {
    if (!assessment) {
        return (
            <td className="px-3 py-4 align-middle">
                <div className="flex flex-col items-start gap-1.5">
                    <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
                    <Link
                        href={`/dashboard/assessments/new/manual?workerId=${workerId}&orgId=${orgId}&type=${type}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-border text-[12px] text-text-muted hover:border-primary hover:text-primary transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Pendiente
                    </Link>
                </div>
            </td>
        );
    }

    const risk = assessment.overallRiskCategory;
    const rc = risk ? riskCfg[risk] : null;
    const sc = statusCfg[assessment.status] || statusCfg.SCORED;
    const isSigned = assessment.status === "SIGNED";

    return (
        <td className="px-3 py-4 align-middle">
            <div className="flex flex-col items-start gap-1.5">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
                {rc && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${rc.cls}`}>
                        {rc.label}
                    </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${sc.cls}`}>
                    {isSigned ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {sc.label}
                </span>
                <span className="text-[11px] text-text-muted">
                    {new Date(assessment.assessmentDate).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <Link
                        href={`/dashboard/reports/${assessment.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-surface hover:bg-surface-muted transition-colors text-foreground"
                    >
                        {isSigned ? <Eye className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                        {isSigned ? "Ver" : "Revisar"}
                    </Link>
                    <a
                        href={`/api/assessments/${assessment.id}/report/pdf`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-surface hover:bg-surface-muted transition-colors text-foreground"
                        title="Descargar PDF"
                    >
                        <FileDown className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </td>
    );
}

export default async function AssessmentsPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const params = await searchParams;
    const q = params.q?.trim() || "";
    const orgFilter = params.org || "";

    const psychId = session.user.id;

    const [workers, organizations] = await Promise.all([
        prisma.worker.findMany({
            where: {
                organization: { createdByPsychologist: psychId },
                ...(orgFilter && { organizationId: orgFilter }),
                ...(q && {
                    OR: [
                        { fullName: { contains: q, mode: "insensitive" } },
                        { documentId: { contains: q, mode: "insensitive" } },
                    ],
                }),
            },
            select: {
                id: true,
                fullName: true,
                documentId: true,
                jobTitle: true,
                organization: { select: { id: true, name: true } },
                assessments: {
                    where: {
                        psychologistId: psychId,
                        status: { in: ["COMPLETED", "SCORED", "REVIEWED", "SIGNED"] },
                    },
                    select: {
                        id: true,
                        questionnaireType: true,
                        formType: true,
                        assessmentDate: true,
                        status: true,
                        scoredResult: { select: { overallRiskCategory: true } },
                    },
                    orderBy: { assessmentDate: "desc" },
                },
            },
            orderBy: [{ organization: { name: "asc" } }, { fullName: "asc" }],
            take: 200,
        }),
        prisma.organization.findMany({
            where: { createdByPsychologist: psychId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    // Per worker, get most recent assessment per type
    const workerRows = workers.map(w => {
        const byType = (type: string): SlotAssessment | null => {
            const found = w.assessments.find(a => a.questionnaireType === type);
            if (!found) return null;
            return {
                id: found.id,
                questionnaireType: found.questionnaireType,
                formType: found.formType,
                assessmentDate: found.assessmentDate,
                status: found.status,
                overallRiskCategory: found.scoredResult?.overallRiskCategory ?? null,
            };
        };
        const complete = ["INTRALABORAL", "EXTRALABORAL", "STRESS"].every(t =>
            w.assessments.some(a => a.questionnaireType === t && ["SCORED", "REVIEWED", "SIGNED"].includes(a.status))
        );
        return {
            ...w,
            intra: byType("INTRALABORAL"),
            extra: byType("EXTRALABORAL"),
            stress: byType("STRESS"),
            complete,
        };
    });

    const hasFilters = !!(q || orgFilter);
    const completeCount = workerRows.filter(w => w.complete).length;
    const pendingCount  = workerRows.filter(w => !w.complete).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground font-heading tracking-tight">Evaluaciones</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-[13px] font-medium text-text-secondary">
                        <span><strong className="text-foreground">{workers.length}</strong> trabajadores</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span><strong className="text-teal-700">{completeCount}</strong> batería completa</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span><strong className="text-amber-600">{pendingCount}</strong> incompletos</span>
                    </div>
                </div>
                <Button asChild size="sm">
                    <Link href="/dashboard/assessments/new/manual">
                        <Plus className="w-4 h-4 mr-2" />
                        Digitalizar evaluación
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Suspense>
                <FilterBar
                    searchPlaceholder="Buscar por trabajador o documento..."
                    filters={[
                        {
                            key: "org",
                            placeholder: "Todas las empresas",
                            options: organizations.map(o => ({ value: o.id, label: o.name })),
                        },
                    ]}
                />
            </Suspense>

            {/* Table */}
            {workerRows.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-surface-muted py-20 text-center flex flex-col items-center">
                    <ClipboardList className="w-10 h-10 text-text-muted mb-3" />
                    <h3 className="text-[16px] font-semibold text-foreground mb-1">
                        {hasFilters ? "Sin resultados" : "No hay trabajadores"}
                    </h3>
                    <p className="text-[13px] text-text-secondary max-w-sm">
                        {hasFilters ? "Prueba otros filtros." : "Agrega trabajadores a una empresa para comenzar."}
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-x-auto">
                    <table className="w-full text-[13px] text-left border-collapse">
                        <thead className="bg-surface-muted border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-text-muted text-[11px] uppercase tracking-wider w-[220px]">Trabajador</th>
                                <th className="px-3 py-3 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Intralaboral</th>
                                <th className="px-3 py-3 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Extralaboral</th>
                                <th className="px-3 py-3 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Estrés</th>
                                <th className="px-3 py-3 font-semibold text-text-muted text-[11px] uppercase tracking-wider text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {workerRows.map(worker => (
                                <tr key={worker.id} className="hover:bg-surface-muted/50 transition-colors">
                                    {/* Worker */}
                                    <td className="px-4 py-4 align-middle">
                                        <div className="flex flex-col">
                                            <Link
                                                href={`/dashboard/workers/${worker.id}`}
                                                className="font-semibold text-foreground hover:text-primary transition-colors"
                                            >
                                                {worker.fullName}
                                            </Link>
                                            <span className="text-[11px] text-text-muted font-mono mt-0.5">{worker.documentId}</span>
                                            <span className="text-[11px] text-text-muted mt-0.5">{worker.organization.name}</span>
                                        </div>
                                    </td>

                                    {/* 3 regulatory slots */}
                                    <AssessmentSlot
                                        type="INTRALABORAL"
                                        label="Intra"
                                        assessment={worker.intra}
                                        workerId={worker.id}
                                        orgId={worker.organization.id}
                                    />
                                    <AssessmentSlot
                                        type="EXTRALABORAL"
                                        label="Extra"
                                        assessment={worker.extra}
                                        workerId={worker.id}
                                        orgId={worker.organization.id}
                                    />
                                    <AssessmentSlot
                                        type="STRESS"
                                        label="Estrés"
                                        assessment={worker.stress}
                                        workerId={worker.id}
                                        orgId={worker.organization.id}
                                    />

                                    {/* Completion status */}
                                    <td className="px-3 py-4 align-middle text-right">
                                        {worker.complete ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Completa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                <AlertCircle className="w-3 h-3" />
                                                Incompleta
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
