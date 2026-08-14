import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DimensionScore, DomainScore, TotalScore } from "@/types/battery";
import AIRecommendationsSection from "@/components/reports/AIRecommendationsSection";
import ReportToolbar from "./report-toolbar";
import AnalysisSignPanel from "./analysis-sign-panel";
import ConsentRecorder from "@/components/assessments/consent-recorder";
import { RECOMMENDED_ACTIONS } from "@/lib/scoring/recommendations";
import "./report.css";

/* ─── Labels ─────────────────────────────────────────────────── */
const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Riesgo Bajo",
    MEDIO: "Riesgo Medio",
    ALTO: "Riesgo Alto",
    MUY_ALTO: "Riesgo Muy Alto"
};
const stressRiskLabels: Record<string, string> = {
    SIN_RIESGO: "Muy Bajo", BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", MUY_ALTO: "Muy Alto"
};
const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Factores Intralaborales",
    EXTRALABORAL: "Factores Extralaborales",
    STRESS: "Evaluación de Estrés"
};
const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura / Dirección",
    PROFESIONAL: "Profesional / Técnico",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo / Producción"
};
const educationLabels: Record<string, string> = {
    PRIMARIA: "Primaria",
    BACHILLERATO: "Bachillerato",
    TECNICO: "Técnico",
    TECNOLOGO: "Tecnólogo",
    PROFESIONAL: "Profesional universitario",
    ESPECIALIZACION: "Especialización",
    MAESTRIA: "Maestría",
    DOCTORADO: "Doctorado"
};
const genderLabels: Record<string, string> = {
    MASCULINO: "Masculino", FEMENINO: "Femenino",
    NO_BINARIO: "No binario", PREFIERO_NO_DECIR: "Prefiero no declarar"
};
const contractLabels: Record<string, string> = {
    INDEFINIDO: "Término indefinido", FIJO: "Término fijo",
    OBRA: "Por obra o labor", PRESTACION: "Prestación de servicios",
    APRENDIZAJE: "Contrato de aprendizaje"
};
const scheduleLabels: Record<string, string> = {
    DIURNO: "Diurno", NOCTURNO: "Nocturno", MIXTO: "Mixto",
    ROTATIVO: "Rotativo por turnos", FLEXIBLE: "Flexible"
};

/* ─── Domain descriptions (Manual General, 2010) ──────────────── */
const DOMAIN_DESCRIPTIONS: Record<string, string> = {
    "Liderazgo y Relaciones Sociales en el Trabajo":
        "Evalúa el estilo de gestión de los jefes inmediatos, la calidad de las interacciones con pares y colaboradores, la retroalimentación recibida y el apoyo social disponible en el trabajo.",
    "Control sobre el Trabajo":
        "Evalúa el margen de autonomía del trabajador para decidir cómo realiza su trabajo, desarrollar habilidades, participar en cambios organizacionales y controlar el ritmo y los métodos de su actividad.",
    "Demandas del Trabajo":
        "Evalúa las exigencias del trabajo en cantidad de tareas, complejidad cognitiva, carga emocional, responsabilidad, demandas del entorno físico y las derivadas de la jornada y el horario laboral.",
    "Recompensa":
        "Evalúa la retribución —económica, de reconocimiento y de desarrollo— que recibe el trabajador en compensación por su desempeño y el sentido de pertenencia a la organización.",
};

/* ─── Clinical interpretation per risk level ──────────────────── */
const RISK_CLINICAL: Record<string, { description: string; action: string; urgency: string; color: string }> = {
    SIN_RIESGO: {
        description: "Exposición mínima o nula al factor evaluado. No se esperan efectos negativos sobre la salud.",
        action: "Mantener y fortalecer los factores protectores existentes mediante programas de promoción.",
        urgency: "Sin intervención urgente",
        color: "#065F46"
    },
    BAJO: {
        description: "Nivel de exposición que no producirá, probablemente, efectos negativos significativos sobre el bienestar.",
        action: "Implementar acciones preventivas para mantener el riesgo en niveles mínimos.",
        urgency: "Seguimiento periódico",
        color: "#166534"
    },
    MEDIO: {
        description: "Exposición moderada con posibilidad de efectos sobre la salud si no se interviene oportunamente.",
        action: "Diseñar e implementar intervención preventiva. Incluir en el SVE de Factores de Riesgo Psicosocial.",
        urgency: "Intervención preventiva requerida",
        color: "#92400E"
    },
    ALTO: {
        description: "Alta posibilidad de respuestas de estrés importantes. Riesgo real de afectación a la salud mental y el desempeño.",
        action: "Intervención prioritaria en el Sistema de Vigilancia Epidemiológica (SVE). Seguimiento individualizado.",
        urgency: "Intervención prioritaria",
        color: "#9A3412"
    },
    MUY_ALTO: {
        description: "Amplia posibilidad de respuestas de estrés muy significativas con alta probabilidad de afectación grave a la salud.",
        action: "Intervención INMEDIATA e impostergable. Activar programa de atención individual en el SVE. Remisión a especialista.",
        urgency: "Intervención inmediata",
        color: "#991B1B"
    }
};

/* ─── Helpers ────────────────────────────────────────────────── */
function getRiskClass(cat: string) {
    return ({ SIN_RIESGO: "risk-none", BAJO: "risk-low", MEDIO: "risk-medium", ALTO: "risk-high", MUY_ALTO: "risk-very-high" } as Record<string, string>)[cat] || "risk-none";
}
function isHighRisk(cat: string) { return cat === "ALTO" || cat === "MUY_ALTO"; }
function isCritical(cat: string) { return cat === "MUY_ALTO"; }

interface PageProps { params: Promise<{ assessmentId: string }> }

export default async function ReportPage({ params }: PageProps) {
    const { assessmentId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
            worker: {
                include: {
                    assessments: {
                        where: {
                            status: { in: ["SCORED", "SIGNED"] },
                            assessmentDate: { gte: new Date(new Date().getFullYear(), 0, 1) }
                        },
                        include: { scoredResult: true }
                    }
                }
            },
            organization: true,
            psychologist: {
                select: {
                    fullName: true, licenseNumber: true,
                    professionalCard: true, sstCredential: true, signature: true
                }
            },
            scoredResult: true,
            consent: true,
            generatedReports: { take: 1, orderBy: { generatedAt: "desc" } }
        }
    });

    if (!assessment || assessment.psychologistId !== session.user.id) return notFound();

    const report = assessment.generatedReports[0];
    const isSigned = report?.status === "SIGNED";

    if (!assessment.scoredResult) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-foreground)" }}>
                <h2>No hay resultados de calificación para esta evaluación.</h2>
            </div>
        );
    }

    const w = assessment.worker;
    const org = assessment.organization;

    const dimensionScores = ((assessment.scoredResult as any)?.dimensionScores ?? {}) as Record<string, DimensionScore>;
    const domainScores = ((assessment.scoredResult as any)?.domainScores ?? {}) as Record<string, DomainScore>;
    const totalScores = ((assessment.scoredResult as any)?.totalScores ?? { rawScore: 0, transformedScore: 0, riskCategory: "SIN_RIESGO" }) as TotalScore;
    const overallRisk = assessment.scoredResult.overallRiskCategory;

    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const generationDate = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

    const otherAssessments = ((w as any)?.assessments ?? []).filter((a: any) => a.id !== assessment.id);
    const isIntra = assessment.questionnaireType === "INTRALABORAL";
    const isExtra = assessment.questionnaireType === "EXTRALABORAL";
    const isStress = assessment.questionnaireType === "STRESS";

    const intralaboralResults = isIntra ? null : otherAssessments.find((a: any) => a.questionnaireType === "INTRALABORAL")?.scoredResult;
    const extralaboralResults = isExtra ? null : otherAssessments.find((a: any) => a.questionnaireType === "EXTRALABORAL")?.scoredResult;
    const stressResults = isStress ? null : otherAssessments.find((a: any) => a.questionnaireType === "STRESS")?.scoredResult;

    const calculateAge = (birthYear: number | null) => birthYear ? new Date().getFullYear() - birthYear : null;

    // Build domain-dimension groups
    const domainDimensionGroups: { domainKey: string; domainName: string; riskCategory: string; transformedScore: number; dimensions: DimensionScore[] }[] = [];
    if (Object.keys(domainScores).length > 0) {
        for (const [key, domain] of Object.entries(domainScores)) {
            const dims = domain.dimensions.map(dk => dimensionScores[dk]).filter(Boolean);
            domainDimensionGroups.push({ domainKey: key, domainName: domain.domainName, riskCategory: domain.riskCategory, transformedScore: domain.transformedScore, dimensions: dims });
        }
    } else {
        domainDimensionGroups.push({ domainKey: "total", domainName: questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType, riskCategory: overallRisk, transformedScore: totalScores.transformedScore, dimensions: Object.values(dimensionScores) });
    }

    // Collect all high-risk items for the intervention plan
    const highRiskDimensions: { name: string; risk: string; score: number; recommendation: string }[] = [];
    Object.values(dimensionScores).forEach(dim => {
        if (isHighRisk(dim.riskCategory)) {
            highRiskDimensions.push({
                name: dim.dimensionName,
                risk: dim.riskCategory,
                score: dim.transformedScore,
                recommendation: RECOMMENDED_ACTIONS[dim.dimensionName] || "Consultar con el psicólogo especialista para intervención personalizada."
            });
        }
    });
    // Sort by severity (MUY_ALTO first)
    highRiskDimensions.sort((a, b) => (b.risk === "MUY_ALTO" ? 1 : 0) - (a.risk === "MUY_ALTO" ? 1 : 0));

    const highRiskDomains = Object.values(domainScores).filter(d => isHighRisk(d.riskCategory));

    const savedRecommendations = report?.recommendationsAI ?? (report?.reportData as any)?.recommendations ?? null;
    const savedAnalysis = (report?.reportData as any)?.analysis ?? null;
    const shortRef = `PST-${assessmentId.slice(-8).toUpperCase()}`;

    const formLabel = assessment.questionnaireType === "INTRALABORAL"
        ? `Forma ${assessment.formType} — ${assessment.formType === "A" ? "Jefaturas, profesionales y técnicos (123 ítems)" : "Auxiliares y operativos (97 ítems)"}`
        : assessment.questionnaireType === "EXTRALABORAL"
        ? "Forma única — 31 ítems"
        : "Villalobos (2010) — 31 ítems";

    return (
        <>
            <ReportToolbar assessmentId={assessmentId} isSigned={isSigned} pdfUrl={`/api/assessments/${assessmentId}/report/pdf`} />
            <div className="no-print" style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem 0.5rem" }}>
                <ConsentRecorder assessmentId={assessmentId} hasConsent={!!assessment.consent} />
            </div>

            <div className="report-view-wrapper">
                <div className="report-container">

                    {/* ══ HEADER ════════════════════════════════════════════════ */}
                    <header className="report-header">
                        <div className="report-header-meta">
                            <div className="report-header-brand">
                                <span className="report-header-brand-name">PsicoSST</span>
                                <span className="report-header-brand-tagline">Plataforma de Evaluación Psicosocial · Colombia</span>
                            </div>
                            <div className="report-header-ref">
                                <span className="report-header-ref-label">Referencia</span>
                                <span className="report-header-ref-value">{shortRef}</span>
                            </div>
                        </div>
                        <h1>Informe Individual de Evaluación de Riesgo Psicosocial</h1>
                        <h2>Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial · Res. 2764/2022</h2>
                        <div className="report-header-type">
                            <span className="report-header-type-dot" />
                            <span className="report-header-type-text">
                                {questionnaireLabels[assessment.questionnaireType]} · {formLabel}
                            </span>
                        </div>
                    </header>

                    <div className="report-body">

                        {/* ══ AVISO ═════════════════════════════════════════════ */}
                        <div className="confidentiality-notice">
                            <strong>Documento confidencial — Uso exclusivo del trabajador evaluado</strong>
                            <p style={{ marginTop: "0.3rem" }}>
                                De acuerdo con las Resoluciones 2646/2008 y 2764/2022, este informe debe ser
                                entregado únicamente al trabajador por el psicólogo especialista en SST responsable
                                de la evaluación. La organización solo tiene acceso al diagnóstico grupal consolidado
                                y anonimizado, nunca a los resultados individuales. (Ley 1090/2006)
                            </p>
                        </div>

                        {/* ══ 1. MARCO NORMATIVO ═══════════════════════════════ */}
                        <section className="report-section">
                            <h3>1. Marco Normativo Aplicable</h3>
                            <div style={{ fontSize: "0.83rem", lineHeight: 1.75, color: "#374151" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 2rem" }}>
                                    {[
                                        { norm: "Resolución 2646/2008", desc: "Define responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de los factores de riesgo psicosocial en el trabajo y sus efectos en la salud." },
                                        { norm: "Resolución 2764/2022", desc: "Adopta oficialmente la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial como herramienta obligatoria en Colombia." },
                                        { norm: "Decreto 0728/2025", desc: "Establece acciones de promoción de salud mental, prevención de trastornos mentales y consumo de sustancias en el lugar de trabajo. Adiciona el Capítulo 13 al Decreto 1072/2015." },
                                        { norm: "Ley 1090/2006", desc: "Reglamenta el ejercicio de la Psicología. Garantiza la confidencialidad de la información obtenida en el proceso evaluativo y establece el secreto profesional." },
                                    ].map(({ norm, desc }) => (
                                        <div key={norm} style={{ padding: "0.75rem", background: "#F9FAFB", borderRadius: 4, border: "1px solid #E5E7EB" }}>
                                            <p style={{ fontWeight: 700, fontSize: "0.78rem", color: "#111827", marginBottom: "0.25rem" }}>{norm}</p>
                                            <p style={{ fontSize: "0.76rem", color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ══ 2. FICHA DE DATOS GENERALES ══════════════════════ */}
                        <section className="report-section">
                            <h3>2. Ficha de Datos Generales del Trabajador</h3>

                            {/* Datos personales */}
                            <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Identificación personal</p>
                            <div className="info-grid" style={{ marginBottom: "1rem" }}>
                                <div className="info-item">
                                    <label>Nombre completo</label>
                                    <span>{w.fullName}</span>
                                </div>
                                <div className="info-item">
                                    <label>Documento de identidad</label>
                                    <span>{w.documentType} {w.documentId}</span>
                                </div>
                                <div className="info-item">
                                    <label>Género</label>
                                    <span>{w.gender ? (genderLabels[w.gender] || w.gender) : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Edad</label>
                                    <span>{calculateAge(w.birthYear) ? `${calculateAge(w.birthYear)} años` : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Estado civil</label>
                                    <span>{w.maritalStatus || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Escolaridad</label>
                                    <span>{w.educationLevel ? (educationLabels[w.educationLevel] || w.educationLevel) : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Personas a cargo</label>
                                    <span>{w.dependentsCount !== null && w.dependentsCount !== undefined ? w.dependentsCount : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Ciudad de residencia</label>
                                    <span>{[w.residenceCity, w.residenceDepartment].filter(Boolean).join(", ") || "–"}</span>
                                </div>
                            </div>

                            {/* Datos laborales */}
                            <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Información ocupacional</p>
                            <div className="info-grid" style={{ marginBottom: "1rem" }}>
                                <div className="info-item">
                                    <label>Organización</label>
                                    <span>{org.name}</span>
                                </div>
                                <div className="info-item">
                                    <label>NIT</label>
                                    <span>{org.nit}</span>
                                </div>
                                <div className="info-item">
                                    <label>Cargo</label>
                                    <span>{w.jobTitle || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Nivel del cargo</label>
                                    <span>{jobLevelLabels[w.jobLevel] || w.jobLevel}</span>
                                </div>
                                <div className="info-item">
                                    <label>Área / Departamento</label>
                                    <span>{w.departmentArea || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Sector económico</label>
                                    <span>{org.economicSector || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Tipo de contrato</label>
                                    <span>{w.contractType ? (contractLabels[w.contractType] || w.contractType) : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Jornada</label>
                                    <span>{w.workSchedule ? (scheduleLabels[w.workSchedule] || w.workSchedule) : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Antigüedad en la empresa</label>
                                    <span>{w.yearsInCompany !== null && w.yearsInCompany !== undefined ? `${w.yearsInCompany} años` : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Antigüedad en el cargo</label>
                                    <span>{w.yearsInPosition !== null && w.yearsInPosition !== undefined ? `${w.yearsInPosition} años` : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Tiempo de desplazamiento</label>
                                    <span>{w.displacementTime ? `${w.displacementTime} min` : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Fecha de evaluación</label>
                                    <span>{assessmentDate}</span>
                                </div>
                            </div>
                        </section>

                        {/* ══ 3. RESULTADOS PRINCIPALES ════════════════════════ */}
                        <section className="report-section">
                            <h3>3. Resultados — {questionnaireLabels[assessment.questionnaireType]}</h3>

                            {/* Resultado total */}
                            <div className={`total-result-card ${getRiskClass(overallRisk)}`}>
                                <div>
                                    <div className="total-result-label">Nivel de riesgo total · {questionnaireLabels[assessment.questionnaireType]}</div>
                                    <div className="total-result-value">
                                        {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk] || overallRisk}
                                    </div>
                                    <div style={{ fontSize: "0.78rem", marginTop: "0.5rem", opacity: 0.8 }}>
                                        {RISK_CLINICAL[overallRisk]?.description}
                                    </div>
                                </div>
                                <div className="total-result-score">{totalScores.transformedScore.toFixed(0)}</div>
                            </div>

                            {/* Resultados por dominio */}
                            {domainDimensionGroups.map((group) => (
                                <div key={group.domainKey} className="domain-group">
                                    {Object.keys(domainScores).length > 0 && (
                                        <div className={`domain-header ${getRiskClass(group.riskCategory)}`}>
                                            <div>
                                                <span className="domain-name">{group.domainName}</span>
                                                {DOMAIN_DESCRIPTIONS[group.domainName] && (
                                                    <p style={{ fontSize: "0.72rem", opacity: 0.75, fontWeight: 400, marginTop: "2px" }}>
                                                        {DOMAIN_DESCRIPTIONS[group.domainName]}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="domain-risk">
                                                <span className={`risk-badge ${getRiskClass(group.riskCategory)}`}>
                                                    {riskLabels[group.riskCategory]}
                                                </span>
                                                {group.transformedScore.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Dimensión</th>
                                                <th className="center">Nivel de riesgo</th>
                                                <th className="center">Puntaje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.dimensions.map((dim) => (
                                                <tr key={dim.dimensionKey}>
                                                    <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                    <td className="center">
                                                        <span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>
                                                            {isStress ? stressRiskLabels[dim.riskCategory] : riskLabels[dim.riskCategory] || dim.riskCategory}
                                                        </span>
                                                    </td>
                                                    <td className="center">
                                                        <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                            <div className="score-bar-track">
                                                                <div className={`score-bar-fill ${getRiskClass(dim.riskCategory)}`} style={{ width: `${dim.transformedScore}%` }} />
                                                            </div>
                                                            <span className="score-value">{dim.transformedScore.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </section>

                        {/* ══ RESULTADOS COMPLEMENTARIOS ═══════════════════════ */}
                        {!isIntra && (
                            <section className="report-section">
                                <h3>4. Factores Intralaborales</h3>
                                {intralaboralResults ? (
                                    <div className={`total-result-card ${getRiskClass((intralaboralResults as any).overallRiskCategory)}`}>
                                        <div>
                                            <div className="total-result-label">Riesgo Intralaboral Total</div>
                                            <div className="total-result-value">{riskLabels[(intralaboralResults as any).overallRiskCategory]}</div>
                                            <div style={{ fontSize: "0.78rem", marginTop: "0.5rem", opacity: 0.8 }}>
                                                {RISK_CLINICAL[(intralaboralResults as any).overallRiskCategory]?.description}
                                            </div>
                                        </div>
                                        <div className="total-result-score">{((intralaboralResults as any).totalScores?.transformedScore || 0).toFixed(0)}</div>
                                    </div>
                                ) : (
                                    <p className="no-data">No se registran valoraciones intralaborales en el ciclo actual.</p>
                                )}
                            </section>
                        )}

                        {!isExtra && (
                            <section className="report-section">
                                <h3>{isIntra ? "4." : "5."} Factores Extralaborales</h3>
                                {extralaboralResults ? (
                                    <>
                                        <div className={`total-result-card ${getRiskClass((extralaboralResults as any).overallRiskCategory)}`}>
                                            <div>
                                                <div className="total-result-label">Riesgo Extralaboral Total</div>
                                                <div className="total-result-value">{riskLabels[(extralaboralResults as any).overallRiskCategory]}</div>
                                                <div style={{ fontSize: "0.78rem", marginTop: "0.5rem", opacity: 0.8 }}>
                                                    {RISK_CLINICAL[(extralaboralResults as any).overallRiskCategory]?.description}
                                                </div>
                                            </div>
                                            <div className="total-result-score">{((extralaboralResults as any).totalScores?.transformedScore || 0).toFixed(0)}</div>
                                        </div>
                                        <table className="results-table">
                                            <thead><tr><th>Dimensión</th><th className="center">Nivel</th><th className="center">Puntaje</th></tr></thead>
                                            <tbody>
                                                {Object.values((extralaboralResults as any).dimensionScores).map((dim: any) => (
                                                    <tr key={dim.dimensionKey}>
                                                        <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                        <td className="center"><span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>{riskLabels[dim.riskCategory]}</span></td>
                                                        <td className="center">
                                                            <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                                <div className="score-bar-track"><div className={`score-bar-fill ${getRiskClass(dim.riskCategory)}`} style={{ width: `${dim.transformedScore}%` }} /></div>
                                                                <span className="score-value">{dim.transformedScore.toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                ) : (
                                    <p className="no-data">No se registran valoraciones extralaborales en el ciclo actual.</p>
                                )}
                            </section>
                        )}

                        {!isStress && (
                            <section className="report-section">
                                <h3>{isIntra && isExtra ? "6." : isIntra || isExtra ? "5." : "4."} Evaluación del Estrés</h3>
                                {stressResults ? (
                                    <>
                                        <div className={`total-result-card ${getRiskClass((stressResults as any).overallRiskCategory)}`}>
                                            <div>
                                                <div className="total-result-label">Nivel de Síntomas de Estrés</div>
                                                <div className="total-result-value">{stressRiskLabels[(stressResults as any).overallRiskCategory]}</div>
                                                <div style={{ fontSize: "0.78rem", marginTop: "0.5rem", opacity: 0.8 }}>
                                                    {RISK_CLINICAL[(stressResults as any).overallRiskCategory]?.description}
                                                </div>
                                            </div>
                                            <div className="total-result-score">{((stressResults as any).totalScores?.transformedScore || 0).toFixed(0)}</div>
                                        </div>
                                        <table className="results-table">
                                            <thead><tr><th>Categoría de síntomas</th><th className="center">Nivel</th><th className="center">Puntaje</th></tr></thead>
                                            <tbody>
                                                {Object.values((stressResults as any).dimensionScores).map((dim: any) => (
                                                    <tr key={dim.dimensionKey}>
                                                        <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                        <td className="center"><span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>{stressRiskLabels[dim.riskCategory]}</span></td>
                                                        <td className="center">
                                                            <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                                <div className="score-bar-track"><div className={`score-bar-fill ${getRiskClass(dim.riskCategory)}`} style={{ width: `${dim.transformedScore}%` }} /></div>
                                                                <span className="score-value">{dim.transformedScore.toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                ) : (
                                    <p className="no-data">No se registran valoraciones de estrés en el ciclo actual.</p>
                                )}
                            </section>
                        )}

                        {/* ══ RESUMEN POR DOMINIO ═══════════════════════════════ */}
                        {Object.keys(domainScores).length > 0 && (
                            <section className="report-section">
                                <h3>Resumen por Dominio</h3>
                                <table className="results-table">
                                    <thead><tr><th>Dominio</th><th className="center">Puntaje transformado</th><th className="center">Categoría de riesgo</th></tr></thead>
                                    <tbody>
                                        {Object.values(domainScores).map((domain) => (
                                            <tr key={domain.domainKey}>
                                                <td style={{ fontWeight: 600 }}>{domain.domainName}</td>
                                                <td className="center">
                                                    <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                        <div className="score-bar-track"><div className={`score-bar-fill ${getRiskClass(domain.riskCategory)}`} style={{ width: `${domain.transformedScore}%` }} /></div>
                                                        <span className="score-value">{domain.transformedScore.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="center"><span className={`risk-badge ${getRiskClass(domain.riskCategory)}`}>{riskLabels[domain.riskCategory]}</span></td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: "2px solid #111827" }}>
                                            <td style={{ fontWeight: 800, color: "#111827", paddingTop: "0.875rem" }}>TOTAL</td>
                                            <td className="center" style={{ paddingTop: "0.875rem" }}>
                                                <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                    <div className="score-bar-track"><div className={`score-bar-fill ${getRiskClass(overallRisk)}`} style={{ width: `${totalScores.transformedScore}%` }} /></div>
                                                    <span className="score-value" style={{ fontWeight: 800 }}>{totalScores.transformedScore.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="center" style={{ paddingTop: "0.875rem" }}>
                                                <span className={`risk-badge ${getRiskClass(overallRisk)}`} style={{ fontWeight: 800 }}>
                                                    {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk]}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* ══ PLAN DE INTERVENCIÓN INDIVIDUAL ══════════════════ */}
                        {highRiskDimensions.length > 0 && (
                            <section className="report-section">
                                <h3>Plan de Intervención Individual — Dimensiones Prioritarias</h3>
                                <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1rem", lineHeight: 1.6 }}>
                                    Las siguientes dimensiones presentan niveles de riesgo <strong>Alto</strong> o <strong>Muy Alto</strong> y requieren
                                    intervención prioritaria conforme al Decreto 0728/2025 y la Resolución 2764/2022.
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {highRiskDimensions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: "1rem 1.25rem",
                                                border: `1px solid ${isCritical(item.risk) ? "#FECACA" : "#FDBA74"}`,
                                                borderLeft: `3px solid ${isCritical(item.risk) ? "#EF4444" : "#F97316"}`,
                                                borderRadius: "0 4px 4px 0",
                                                background: isCritical(item.risk) ? "#FEF2F2" : "#FFF7ED",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                                                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{item.name}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, marginLeft: "1rem" }}>
                                                    <span className={`risk-badge ${getRiskClass(item.risk)}`}>{riskLabels[item.risk]}</span>
                                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#6B7280" }}>{item.score.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.65 }}>
                                                <strong style={{ color: isCritical(item.risk) ? "#B91C1C" : "#9A3412" }}>Acción recomendada: </strong>
                                                {item.recommendation}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Urgencia de acción */}
                                <div style={{ marginTop: "1rem", padding: "0.875rem 1.125rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 4 }}>
                                    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B7280", marginBottom: "0.35rem" }}>
                                        Nivel de urgencia del caso — Res. 2764/2022, Art. 9
                                    </p>
                                    <p style={{ fontSize: "0.83rem", color: "#374151", lineHeight: 1.65 }}>
                                        {RISK_CLINICAL[overallRisk]?.action}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* ══ CONCLUSIONES CLÍNICAS ════════════════════════════ */}
                        <section className="report-section">
                            <h3>Conclusiones Clínicas</h3>
                            <div style={{ fontSize: "0.86rem", lineHeight: 1.8, color: "#374151" }}>
                                <p>
                                    Con base en la aplicación del cuestionario de{" "}
                                    <strong>{questionnaireLabels[assessment.questionnaireType]}</strong>{" "}
                                    ({formLabel}), el trabajador <strong>{w.fullName}</strong>,
                                    con cargo <strong>{w.jobTitle || "–"}</strong> en <strong>{org.name}</strong>,
                                    presenta un nivel de riesgo general clasificado como{" "}
                                    <strong style={{ color: RISK_CLINICAL[overallRisk]?.color }}>
                                        {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk]}
                                        {" "}({totalScores.transformedScore.toFixed(1)}%)
                                    </strong>.
                                </p>

                                {/* Risk level clinical box */}
                                <div style={{
                                    marginTop: "0.875rem",
                                    padding: "0.875rem 1.125rem",
                                    borderLeft: `3px solid ${RISK_CLINICAL[overallRisk]?.color}`,
                                    background: overallRisk === "MUY_ALTO" || overallRisk === "ALTO" ? "#FEF2F2" : overallRisk === "MEDIO" ? "#FFFBEB" : "#F0FFF9",
                                    borderRadius: "0 4px 4px 0"
                                }}>
                                    <p style={{ fontWeight: 700, fontSize: "0.78rem", color: RISK_CLINICAL[overallRisk]?.color, marginBottom: "0.25rem" }}>
                                        {RISK_CLINICAL[overallRisk]?.urgency}
                                    </p>
                                    <p>{RISK_CLINICAL[overallRisk]?.action}</p>
                                </div>

                                {/* Dominios críticos */}
                                {highRiskDomains.length > 0 && (
                                    <p style={{ marginTop: "0.75rem" }}>
                                        Los dominios que presentan mayor urgencia de intervención son:{" "}
                                        <strong>{highRiskDomains.map(d => d.domainName).join(", ")}</strong>.
                                    </p>
                                )}

                                {/* Complementary cross-analysis */}
                                {(intralaboralResults || extralaboralResults || stressResults) && (
                                    <div style={{ marginTop: "0.875rem", padding: "0.875rem 1.125rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 4 }}>
                                        <p style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", marginBottom: "0.5rem" }}>Análisis integrador del ciclo</p>
                                        {intralaboralResults && (
                                            <p style={{ fontSize: "0.83rem" }}>• <strong>Intralaboral:</strong> {riskLabels[(intralaboralResults as any).overallRiskCategory]} — {RISK_CLINICAL[(intralaboralResults as any).overallRiskCategory]?.description}</p>
                                        )}
                                        {extralaboralResults && (
                                            <p style={{ fontSize: "0.83rem", marginTop: "0.25rem" }}>• <strong>Extralaboral:</strong> {riskLabels[(extralaboralResults as any).overallRiskCategory]} — {RISK_CLINICAL[(extralaboralResults as any).overallRiskCategory]?.description}</p>
                                        )}
                                        {stressResults && (
                                            <p style={{ fontSize: "0.83rem", marginTop: "0.25rem" }}>• <strong>Estrés:</strong> {stressRiskLabels[(stressResults as any).overallRiskCategory]} — {RISK_CLINICAL[(stressResults as any).overallRiskCategory]?.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ══ ANÁLISIS Y RECOMENDACIONES ═══════════════════════ */}
                        <section className="report-section">
                            <h3>Análisis Profesional y Plan de Atención Individual</h3>
                            <AnalysisSignPanel
                                assessmentId={assessmentId}
                                isSigned={isSigned}
                                initialAnalysis={savedAnalysis}
                                savedRecommendations={savedRecommendations}
                                hasSignature={!!assessment.psychologist?.signature}
                            />
                            <AIRecommendationsSection
                                assessmentId={assessmentId}
                                initialRecommendations={savedRecommendations}
                                isSigned={isSigned}
                            />
                        </section>

                        {/* ══ LEYENDA ══════════════════════════════════════════ */}
                        <section className="report-section">
                            <div className="risk-legend">
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#10B981" }} /> Sin Riesgo</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#22C55E" }} /> Bajo</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#F59E0B" }} /> Medio</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#F97316" }} /> Alto</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#EF4444" }} /> Muy Alto</span>
                            </div>
                            <p style={{ fontSize: "0.68rem", color: "#9CA3AF", textAlign: "center", marginTop: "0.5rem" }}>
                                Clasificación basada en baremos percentílicos del Manual de la Batería · Ministerio del Trabajo (2010) · Muestra normativa: 2.360 trabajadores colombianos
                            </p>
                        </section>

                        {/* ══ FIRMA ════════════════════════════════════════════ */}
                        <section className="signature-section">
                            <div className="signature-box">
                                <div className="signature-img-wrap">
                                    {isSigned && (report?.signatureImage || assessment.psychologist?.signature) && (
                                        <img
                                            src={(report?.signatureImage || assessment.psychologist?.signature) as string}
                                            alt="Firma Digital"
                                            style={{ maxHeight: "90px", maxWidth: "200px", filter: "contrast(1.2)" }}
                                        />
                                    )}
                                </div>
                                <div className="signature-line" />
                                <p className="signature-name">{assessment.psychologist?.fullName}</p>
                                <p className="signature-detail">Psicólogo(a) Especialista en Seguridad y Salud en el Trabajo</p>
                                <p className="signature-detail">Licencia SST: {assessment.psychologist?.sstCredential || assessment.psychologist?.licenseNumber || "–"}</p>
                                <p className="signature-detail">Tarjeta Profesional: {assessment.psychologist?.professionalCard || "–"}</p>
                            </div>
                        </section>

                    </div>{/* /report-body */}

                    {/* ══ FOOTER ═══════════════════════════════════════════════ */}
                    <footer className="report-footer">
                        <div>
                            <p>Generado por PsicoSST · {generationDate} · Ref. {shortRef}</p>
                            <p>Informe válido únicamente con firma electrónica del profesional responsable.</p>
                        </div>
                        <span className="footer-badge">Res. 2764/2022 · Dec. 0728/2025</span>
                    </footer>

                </div>
            </div>
        </>
    );
}
