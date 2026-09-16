import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Eye, PenLine, CheckCircle2, Clock, User, Briefcase, Calendar, AlertTriangle, RefreshCw, Info } from "lucide-react";
import EditWorkerProfileButton from "@/components/workers/EditWorkerProfileButton";
import WorkerTrendChart from "@/components/workers/worker-trend-chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { dueInfo, isCriticalLevel, workerValidity } from "@/lib/compliance/cadence";
import { INSTRUMENT_IDS } from "@/config/instruments";

const RiskTooltip = ({ riskLevel, children }: { riskLevel: string, children: React.ReactNode }) => {
    const texts: Record<string, string> = {
        SIN_RIESGO: "No se requiere intervención. Es indicativo de un ambiente de trabajo saludable en esta dimensión.",
        BAJO: "No se espera que la respuesta al estrés sea alta. Se recomienda mantener las acciones preventivas actuales.",
        MEDIO: "Nivel en el que se esperaría una respuesta de estrés moderada. Requiere observación y acciones preventivas concretas.",
        ALTO: "Importante posibilidad de asociación con respuestas de estrés alto. Requiere intervención psicosocial en el marco de un sistema de vigilancia epidemiológica.",
        MUY_ALTO: "Amplia posibilidad de asociarse con respuestas muy altas de estrés. Requiere intervención inmediata y seguimiento estrecho."
    };
    
    return (
        <Tooltip>
            <TooltipTrigger type="button" tabIndex={-1} className="cursor-help flex items-center justify-center gap-1.5 mx-auto">
                {children}
                <Info className="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition-opacity" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px] p-3 text-center">
                <p className="text-xs font-normal leading-relaxed">{texts[riskLevel]}</p>
            </TooltipContent>
        </Tooltip>
    );
};

/** Forma de `ScoredResult.totalScores`: lo escribimos nosotros mismos desde
 * el motor de puntuación (ver `TotalScore` en lib/scoring), así que basta con
 * afirmar el campo que se lee — mismo patrón que en lib/reports/individual-data.ts. */
interface StoredTotalScore {
    transformedScore?: number;
}

const riskColors: Record<string, string> = {
    SIN_RIESGO: "bg-green-100 text-green-700 border-green-200",
    BAJO:       "bg-lime-100 text-lime-700 border-lime-200",
    MEDIO:      "bg-yellow-100 text-yellow-700 border-yellow-200",
    ALTO:       "bg-orange-100 text-orange-700 border-orange-200",
    MUY_ALTO:   "bg-red-100 text-red-700 border-red-200",
};

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Intralaboral",
    EXTRALABORAL: "Extralaboral",
    STRESS: "Estrés",
    CLIMA: "Clima",
};

const statusStyle: Record<string, { label: string; background: string; color: string }> = {
    SCORED:    { label: "Calificado", background: "var(--color-risk-medium-bg)", color: "var(--color-risk-medium-text)" },
    REVIEWED:  { label: "Revisado",   background: "color-mix(in srgb, var(--color-info) 14%, transparent)", color: "var(--color-info)" },
    SIGNED:    { label: "Firmado",    background: "var(--color-teal-light)", color: "var(--color-teal-dark)" },
    COMPLETED: { label: "Completado", background: "var(--color-surface-muted)", color: "var(--color-text-secondary)" },
};

const educationLabels: Record<string, string> = {
    Ninguno: "Ninguno",
    Primaria_incompleta: "Primaria incompleta",
    Primaria_completa: "Primaria completa",
    Bachillerato_incompleto: "Bachillerato incompleto",
    Bachillerato_completo: "Bachillerato completo",
    Tecnico_incompleto: "Técnico incompleto",
    Tecnico_completo: "Técnico completo",
    Tecnologo_incompleto: "Tecnólogo incompleto",
    Tecnologo_completo: "Tecnólogo completo",
    Profesional_incompleto: "Profesional incompleto",
    Profesional_completo: "Profesional completo",
    Especializacion_incompleta: "Especialización incompleta",
    Especializacion_completa: "Especialización completa",
    Maestria_incompleta: "Maestría incompleta",
    Maestria_completa: "Maestría completa",
    Doctorado_incompleto: "Doctorado incompleto",
    Doctorado_completo: "Doctorado completo"
};

const contractLabels: Record<string, string> = {
    Temporal_menos_1_ano: "Temporal < 1 año",
    Temporal_1_ano_o_mas: "Temporal >= 1 año",
    A_termino_indefinido: "A término indefinido",
    Cooperativa: "Cooperativa",
    Prestacion_de_servicios: "Prestación de servicios",
    No_se: "No sabe"
};

const housingLabels: Record<string, string> = {
    Propia: "Propia",
    Familiar: "Familiar",
    Arriendo: "Arriendo"
};

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura", PROFESIONAL: "Profesional",
    TECNICO: "Técnico", AUXILIAR: "Auxiliar", OPERATIVO: "Operativo",
};

interface PageProps {
    params: Promise<{ workerId: string }>;
}

export default async function WorkerDetailPage({ params }: PageProps) {
    const { workerId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            organization: {
                select: { id: true, name: true, nit: true, createdByPsychologist: true },
            },
            assessments: {
                where: { status: { in: ["SCORED", "REVIEWED", "SIGNED"] } },
                include: {
                    scoredResult: { select: { overallRiskCategory: true, totalScores: true } },
                },
                orderBy: { assessmentDate: "desc" },
            },
        },
    });

    if (!worker || worker.organization.createdByPsychologist !== session.user.id) {
        return notFound();
    }

    const assessments = worker.assessments;
    const age = worker.birthYear
        ? new Date().getFullYear() - worker.birthYear
        : null;

    // Latest risk per questionnaire type
    const latestByType: Record<string, (typeof assessments)[number]> = {};
    for (const a of [...assessments].reverse()) {
        latestByType[a.questionnaireType] = a;
    }

    // Vigencia (Res. 2764/2022 art. 3): anual si la última medición tuvo
    // riesgo alto o muy alto en cualquiera de sus cuestionarios, bienal si no.
    const signedAssessments = assessments.filter(a => a.status === "SIGNED");
    const lastSignedDate = signedAssessments.length > 0
        ? new Date(signedAssessments[0].assessmentDate)
        : null;
    const lastCycleCritical = signedAssessments
        .slice(0, 3)
        .some(a => isCriticalLevel(a.scoredResult?.overallRiskCategory));
    const validity = workerValidity(lastCycleCritical ? "ALTO" : signedAssessments[0]?.scoredResult?.overallRiskCategory);
    // Server Component: sin el re-render concurrente que esta regla vigila
    // en cliente — necesita la hora real del servidor para este cálculo.
    // eslint-disable-next-line react-hooks/purity
    const due = lastSignedDate ? dueInfo(lastSignedDate, validity, new Date()) : null;
    const expiresAt = due?.dueDate ?? null;
    const daysUntilExpiry = due?.daysLeft ?? null;
    const expirationStatus = !due ? "NEVER" : due.status === "VENCIDA" ? "EXPIRED" : due.status === "POR_VENCER" ? "EXPIRING_SOON" : "OK";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/organizations" className="hover:text-primary transition-colors">Empresas</Link>
                <span>/</span>
                <Link href={`/dashboard/organizations/${worker.organization.id}`} className="hover:text-primary transition-colors">{worker.organization.name}</Link>
                <span>/</span>
                <span className="text-foreground font-medium">{worker.fullName}</span>
            </nav>

            {/* Worker header */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold text-2xl border border-primary/20">
                        {worker.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-semibold text-foreground">{worker.fullName}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {worker.documentType} {worker.documentId}
                            {age !== null && <span className="ml-3">· {age} años</span>}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {worker.jobTitle && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                                    style={{ background: "var(--color-teal-light)", color: "var(--color-teal-dark)" }}
                                >
                                    <Briefcase className="h-3 w-3" />
                                    {worker.jobTitle}
                                </span>
                            )}
                            {worker.jobLevel && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                                    {jobLevelLabels[worker.jobLevel] || worker.jobLevel}
                                </span>
                            )}
                            {worker.organization.name && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                                    {worker.organization.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <EditWorkerProfileButton worker={worker} />
                        <Link
                            href={`/dashboard/organizations/${worker.organization.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Link>
                    </div>
                </div>
            </div>

            {/* Risk summary cards */}
            {Object.keys(latestByType).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {INSTRUMENT_IDS.map(type => {
                        const a = latestByType[type];
                        if (!a) return (
                            <div key={type} className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{questionnaireLabels[type]}</p>
                                <p className="text-sm text-muted-foreground italic">Sin evaluación</p>
                            </div>
                        );
                        const risk = a.scoredResult?.overallRiskCategory || "SIN_RIESGO";
                        const score = (a.scoredResult?.totalScores as StoredTotalScore | null)?.transformedScore;
                        return (
                            <div key={type} className="rounded-xl border p-4 text-center" style={riskStyle[risk]}>
                                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">{questionnaireLabels[type]}</p>
                                <RiskTooltip riskLevel={risk}>
                                    <span className="text-xl font-semibold">{riskLabels[risk]}</span>
                                </RiskTooltip>
                                {score !== undefined && <p className="text-sm font-semibold opacity-70 mt-0.5">{score.toFixed(1)}%</p>}
                                <p className="text-xs opacity-60 mt-1">
                                    {new Date(a.assessmentDate).toLocaleDateString("es-CO", { year: "numeric", month: "short" })}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Expiration alert */}
            {expirationStatus === "EXPIRED" && (
                <div
                    className="rounded-xl border px-5 py-3.5 flex items-start gap-3"
                    style={{ borderColor: "var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)" }}
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-risk-veryhigh-solid)" }} />
                    <div>
                        <p className="font-semibold text-red-800 text-sm">Evaluación vencida</p>
                        <p className="text-red-700 text-xs mt-0.5">
                            La última evaluación firmada fue el {lastSignedDate!.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}. Venció la vigencia de {validity.years === 1 ? "un año (riesgo alto o muy alto)" : "dos años"} — se requiere reevaluación según la Res. 2764/2022, art. 3.
                        </p>
                        <a
                            href={`/dashboard/assessments/new/manual?workerId=${worker.id}`}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold underline"
                            style={{ color: "var(--color-risk-veryhigh-text)" }}
                        >
                            <RefreshCw className="h-3 w-3" /> Iniciar reevaluación
                        </a>
                    </div>
                </div>
            )}
            {expirationStatus === "EXPIRING_SOON" && (
                <div
                    className="rounded-xl border px-5 py-3.5 flex items-start gap-3"
                    style={{ borderColor: "var(--color-risk-medium-border)", background: "var(--color-risk-medium-bg)" }}
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-risk-medium-solid)" }} />
                    <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-risk-medium-text)" }}>Evaluación próxima a vencer</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-risk-medium-text)" }}>
                            Vence el {expiresAt!.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })} — en {daysUntilExpiry} días. Planifica la reevaluación con anticipación.
                        </p>
                    </div>
                </div>
            )}
            {expirationStatus === "NEVER" && (
                <div
                    className="rounded-xl border px-5 py-3.5 flex items-start gap-3"
                    style={{ borderColor: "var(--color-risk-medium-border)", background: "var(--color-risk-medium-bg)" }}
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-risk-medium-solid)" }} />
                    <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-risk-medium-text)" }}>Sin evaluaciones firmadas</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-risk-medium-text)" }}>Este trabajador no tiene evaluaciones firmadas registradas.</p>
                    </div>
                </div>
            )}

            {/* Profile data */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold text-foreground text-sm">Perfil Sociodemográfico</h2>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                    {[
                        { label: "Género", value: worker.gender === "M" ? "Masculino" : worker.gender === "F" ? "Femenino" : null },
                        { label: "Estado civil", value: worker.maritalStatus },
                        { label: "Escolaridad", value: worker.educationLevel ? (educationLabels[worker.educationLevel] || worker.educationLevel.replace(/_/g, " ")) : null },
                        { label: "Ciudad de residencia", value: worker.residenceCity },
                        { label: "Área / Departamento", value: worker.departmentArea },
                        { label: "Tipo de contrato", value: worker.contractType ? (contractLabels[worker.contractType] || worker.contractType.replace(/_/g, " ")) : null },
                        { label: "Jornada laboral", value: worker.workSchedule },
                        { label: "Horas por semana", value: worker.hoursPerWeek ? `${worker.hoursPerWeek} h` : null },
                        { label: "Antigüedad en empresa", value: worker.lessThanOneYearInCompany ? "Menos de un año" : worker.yearsInCompany !== null ? `${worker.yearsInCompany} años` : null },
                        { label: "Antigüedad en cargo", value: worker.lessThanOneYearInPosition ? "Menos de un año" : worker.yearsInPosition !== null ? `${worker.yearsInPosition} años` : null },
                        { label: "Estrato socioeconómico", value: worker.socioeconomicStratum ? `Estrato ${worker.socioeconomicStratum}` : null },
                        { label: "Tipo de vivienda", value: worker.housingType ? (housingLabels[worker.housingType] || worker.housingType) : null },
                    ].map(({ label, value }) => value ? (
                        <div key={label}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
                            <p className="font-medium text-foreground">{value}</p>
                        </div>
                    ) : null)}
                </div>
            </div>

            {/* Assessment history */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-foreground text-sm">Historial de Evaluaciones</h2>
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{assessments.length}</span>
                    </div>
                </div>

                {assessments.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-muted-foreground">No hay evaluaciones registradas para este trabajador.</p>
                        <Link
                            href={`/dashboard/assessments/new/manual?workerId=${worker.id}`}
                            className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Iniciar evaluación
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Trend chart */}
                        <div className="px-6 py-4 border-b border-border">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tendencia longitudinal</p>
                            <WorkerTrendChart assessments={assessments} />
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuestionario</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Riesgo</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {assessments.map(a => {
                                        const risk = a.scoredResult?.overallRiskCategory || "SIN_RIESGO";
                                        const score = (a.scoredResult?.totalScores as StoredTotalScore | null)?.transformedScore;
                                        const status = statusConfig[a.status] || statusConfig.SCORED;
                                        return (
                                            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
                                                        style={{ background: "var(--color-teal-light)", color: "var(--color-teal-dark)" }}
                                                    >
                                                        {questionnaireLabels[a.questionnaireType] || a.questionnaireType} Forma {a.formType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(a.assessmentDate).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                        style={{ background: riskStyle[risk].background, color: riskStyle[risk].color, boxShadow: `inset 0 0 0 1px ${riskStyle[risk].borderColor}` }}
                                                    >
                                                        {riskLabels[risk]}
                                                        {score !== undefined && <span className="opacity-70">({score.toFixed(1)})</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                        style={{ background: status.background, color: status.color }}
                                                    >
                                                        {a.status === "SIGNED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={`/dashboard/reports/${a.id}`}
                                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                                        >
                                                            {a.status === "SIGNED" ? <><Eye className="h-3 w-3" /> Ver</> : <><PenLine className="h-3 w-3" /> Revisar</>}
                                                        </Link>
                                                        <a
                                                            href={`/api/assessments/${a.id}/report/pdf`}
                                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                                        >
                                                            <FileDown className="h-3 w-3" /> PDF
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
