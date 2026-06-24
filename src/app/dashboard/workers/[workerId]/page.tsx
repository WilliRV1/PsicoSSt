import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Eye, PenLine, CheckCircle2, Clock, User, Briefcase, MapPin, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import WorkerTrendChart from "@/components/workers/worker-trend-chart";

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

const riskBarColor: Record<string, string> = {
    SIN_RIESGO: "bg-green-500",
    BAJO:       "bg-lime-500",
    MEDIO:      "bg-yellow-400",
    ALTO:       "bg-orange-500",
    MUY_ALTO:   "bg-red-500",
};

const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Intralaboral",
    EXTRALABORAL: "Extralaboral",
    STRESS: "Estrés",
};

const statusConfig: Record<string, { label: string; class: string }> = {
    SCORED:    { label: "Calificado", class: "bg-yellow-100 text-yellow-700" },
    REVIEWED:  { label: "Revisado",   class: "bg-blue-100 text-blue-700" },
    SIGNED:    { label: "Firmado",    class: "bg-green-100 text-green-700" },
    COMPLETED: { label: "Completado", class: "bg-gray-100 text-gray-600" },
};

const educationLabels: Record<string, string> = {
    PRIMARIA: "Primaria", BACHILLERATO: "Bachillerato", TECNICO: "Técnico",
    TECNOLOGO: "Tecnólogo", TECNICO_TECNOLOGO: "Técnico/Tecnólogo",
    PROFESIONAL: "Profesional", ESPECIALIZACION: "Especialización",
    MAESTRIA: "Maestría", DOCTORADO: "Doctorado",
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

    const worker = await (prisma.worker as any).findUnique({
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

    const assessments = worker.assessments as any[];
    const age = worker.birthYear
        ? new Date().getFullYear() - worker.birthYear
        : null;

    // Latest risk per questionnaire type
    const latestByType: Record<string, any> = {};
    for (const a of [...assessments].reverse()) {
        latestByType[a.questionnaireType] = a;
    }

    // Expiration alert (2-year rule, Res. 2764/2022)
    const signedAssessments = assessments.filter(a => a.status === "SIGNED");
    const lastSignedDate = signedAssessments.length > 0
        ? new Date(signedAssessments[0].assessmentDate)
        : null;
    const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
    const expiresAt = lastSignedDate ? new Date(lastSignedDate.getTime() + TWO_YEARS_MS) : null;
    const daysUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const expirationStatus = daysUntilExpiry === null ? "NEVER" : daysUntilExpiry <= 0 ? "EXPIRED" : daysUntilExpiry <= 180 ? "EXPIRING_SOON" : "OK";

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
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-2xl border border-primary/20">
                        {worker.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-black text-foreground">{worker.fullName}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {worker.documentType} {worker.documentId}
                            {age !== null && <span className="ml-3">· {age} años</span>}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {worker.jobTitle && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold ring-1 ring-indigo-600/10">
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
                        <Link
                            href={`/dashboard/organizations/${worker.organization.id}?editWorker=${worker.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
                        >
                            <PenLine className="h-4 w-4" />
                            Editar Trabajador
                        </Link>
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
                    {["INTRALABORAL", "EXTRALABORAL", "STRESS"].map(type => {
                        const a = latestByType[type];
                        if (!a) return (
                            <div key={type} className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{questionnaireLabels[type]}</p>
                                <p className="text-sm text-muted-foreground italic">Sin evaluación</p>
                            </div>
                        );
                        const risk = a.scoredResult?.overallRiskCategory || "SIN_RIESGO";
                        const score = (a.scoredResult?.totalScores as any)?.transformedScore;
                        return (
                            <div key={type} className={`rounded-xl border p-4 text-center ${riskColors[risk]}`}>
                                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">{questionnaireLabels[type]}</p>
                                <p className="text-xl font-black">{riskLabels[risk]}</p>
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
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800 text-sm">Evaluación vencida</p>
                        <p className="text-red-700 text-xs mt-0.5">
                            La última evaluación firmada fue el {lastSignedDate!.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}. Han pasado más de 2 años — se requiere reevaluación según la Res. 2764/2022.
                        </p>
                        <a href={`/dashboard/assessments/new/manual?workerId=${worker.id}`} className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-700 hover:text-red-900 underline">
                            <RefreshCw className="h-3 w-3" /> Iniciar reevaluación
                        </a>
                    </div>
                </div>
            )}
            {expirationStatus === "EXPIRING_SOON" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800 text-sm">Evaluación próxima a vencer</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                            Vence el {expiresAt!.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })} — en {daysUntilExpiry} días. Planifica la reevaluación con anticipación.
                        </p>
                    </div>
                </div>
            )}
            {expirationStatus === "NEVER" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800 text-sm">Sin evaluaciones firmadas</p>
                        <p className="text-amber-700 text-xs mt-0.5">Este trabajador no tiene evaluaciones firmadas registradas.</p>
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
                        { label: "Escolaridad", value: educationLabels[worker.educationLevel] || worker.educationLevel },
                        { label: "Ciudad de residencia", value: worker.residenceCity },
                        { label: "Área / Departamento", value: worker.departmentArea },
                        { label: "Tipo de contrato", value: worker.contractType },
                        { label: "Jornada laboral", value: worker.workSchedule },
                        { label: "Horas por semana", value: worker.hoursPerWeek ? `${worker.hoursPerWeek} h` : null },
                        { label: "Antigüedad en empresa", value: worker.yearsInCompany !== null ? `${worker.yearsInCompany} años` : null },
                        { label: "Antigüedad en cargo", value: worker.yearsInPosition !== null ? `${worker.yearsInPosition} años` : null },
                        { label: "Estrato socioeconómico", value: worker.socioeconomicStratum ? `Estrato ${worker.socioeconomicStratum}` : null },
                        { label: "Tipo de vivienda", value: worker.housingType },
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
                                        const score = (a.scoredResult?.totalScores as any)?.transformedScore;
                                        const status = statusConfig[a.status] || statusConfig.SCORED;
                                        return (
                                            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10">
                                                        {questionnaireLabels[a.questionnaireType] || a.questionnaireType} Forma {a.formType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(a.assessmentDate).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${riskColors[risk]}`}>
                                                        {riskLabels[risk]}
                                                        {score !== undefined && <span className="opacity-70">({score.toFixed(1)})</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
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
