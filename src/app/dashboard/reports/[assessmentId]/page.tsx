import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DimensionScore, DomainScore, TotalScore, RiskCategory } from "@/types/battery";
import AIRecommendationsSection from "@/components/reports/AIRecommendationsSection";
import ReportToolbar from "./report-toolbar";
import AnalysisSignPanel from "./analysis-sign-panel";
import ConsentRecorder from "@/components/assessments/consent-recorder";
import "./report.css";

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Riesgo Bajo",
    MEDIO: "Riesgo Medio",
    ALTO: "Riesgo Alto",
    MUY_ALTO: "Riesgo Muy Alto"
};

const stressRiskLabels: Record<string, string> = {
    SIN_RIESGO: "Muy Bajo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto"
};

const questionnaireLabels: Record<string, string> = {
    INTRALABORAL: "Factores Intralaborales",
    EXTRALABORAL: "Factores Extralaborales",
    STRESS: "Evaluación de Estrés"
};

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo"
};

const educationLabels: Record<string, string> = {
    PRIMARIA: "Primaria",
    BACHILLERATO: "Bachillerato",
    TECNICO: "Técnico",
    TECNOLOGO: "Tecnólogo",
    PROFESIONAL: "Profesional",
    ESPECIALIZACION: "Especialización",
    MAESTRIA: "Maestría",
    DOCTORADO: "Doctorado"
};

function getRiskClass(category: string): string {
    const map: Record<string, string> = {
        SIN_RIESGO: "risk-none",
        BAJO: "risk-low",
        MEDIO: "risk-medium",
        ALTO: "risk-high",
        MUY_ALTO: "risk-very-high"
    };
    return map[category] || "risk-none";
}

function getRiskBarColor(category: string): string {
    const map: Record<string, string> = {
        SIN_RIESGO: "#10B981",
        BAJO: "#22C55E",
        MEDIO: "#F59E0B",
        ALTO: "#F97316",
        MUY_ALTO: "#EF4444"
    };
    return map[category] || "#10B981";
}

interface PageProps {
    params: Promise<{ assessmentId: string }>;
}

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
                            assessmentDate: {
                                gte: new Date(new Date().getFullYear(), 0, 1)
                            }
                        },
                        include: { scoredResult: true }
                    }
                }
            },
            organization: true,
            psychologist: {
                select: {
                    fullName: true,
                    licenseNumber: true,
                    professionalCard: true,
                    sstCredential: true,
                    signature: true
                }
            },
            scoredResult: true,
            consent: true,
            generatedReports: {
                take: 1,
                orderBy: { generatedAt: "desc" }
            }
        }
    });

    if (!assessment || assessment.psychologistId !== session.user.id) {
        return notFound();
    }

    const report = assessment.generatedReports[0];
    const isSigned = report?.status === "SIGNED";

    if (!assessment.scoredResult) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#C8D5DE" }}>
                <h2>No hay resultados de calificación para esta evaluación.</h2>
            </div>
        );
    }

    const dimensionScores = (assessment.scoredResult as any)?.dimensionScores as Record<string, DimensionScore> || {};
    const domainScores = (assessment.scoredResult as any)?.domainScores as Record<string, DomainScore> || {};
    const totalScores = (assessment.scoredResult as any)?.totalScores as TotalScore || { rawScore: 0, transformedScore: 0, riskCategory: "SIN_RIESGO" };
    const overallRisk = assessment.scoredResult.overallRiskCategory;

    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString("es-CO", {
        year: "numeric", month: "long", day: "numeric"
    });

    const generationDate = new Date().toLocaleDateString("es-CO", {
        year: "numeric", month: "long", day: "numeric"
    });

    const assessments = (assessment.worker as any)?.assessments || [];
    const otherAssessments = assessments.filter((a: any) => a.id !== assessment.id);

    const isIntra = assessment.questionnaireType === "INTRALABORAL";
    const isExtra = assessment.questionnaireType === "EXTRALABORAL";
    const isStress = assessment.questionnaireType === "STRESS";

    const intralaboralResults = isIntra ? null : otherAssessments.find((a: any) => a.questionnaireType === "INTRALABORAL")?.scoredResult;
    const extralaboralResults = isExtra ? null : otherAssessments.find((a: any) => a.questionnaireType === "EXTRALABORAL")?.scoredResult;
    const stressResults = isStress ? null : otherAssessments.find((a: any) => a.questionnaireType === "STRESS")?.scoredResult;

    const calculateAge = (birthYear: number | null) => {
        if (!birthYear) return "–";
        return new Date().getFullYear() - birthYear;
    };

    const domainDimensionGroups: { domainKey: string; domainName: string; riskCategory: string; transformedScore: number; dimensions: DimensionScore[] }[] = [];

    if (Object.keys(domainScores).length > 0) {
        for (const [key, domain] of Object.entries(domainScores)) {
            const dims = domain.dimensions.map(dk => dimensionScores[dk]).filter(Boolean);
            domainDimensionGroups.push({
                domainKey: key,
                domainName: domain.domainName,
                riskCategory: domain.riskCategory,
                transformedScore: domain.transformedScore,
                dimensions: dims
            });
        }
    } else {
        domainDimensionGroups.push({
            domainKey: "total",
            domainName: questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType,
            riskCategory: overallRisk,
            transformedScore: totalScores.transformedScore,
            dimensions: Object.values(dimensionScores)
        });
    }

    const savedRecommendations = report?.recommendationsAI ?? (report?.reportData as any)?.recommendations ?? null;
    const savedAnalysis = (report?.reportData as any)?.analysis ?? null;

    const shortRef = `PST-${assessmentId.slice(-8).toUpperCase()}`;

    return (
        <>
            <ReportToolbar
                assessmentId={assessmentId}
                isSigned={isSigned}
                pdfUrl={`/api/assessments/${assessmentId}/report/pdf`}
            />
            <div className="no-print" style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem 0.5rem" }}>
                <ConsentRecorder assessmentId={assessmentId} hasConsent={!!assessment.consent} />
            </div>

            <div className="report-view-wrapper">
                <div className="report-container">

                    {/* ══════════════ HEADER ══════════════ */}
                    <header className="report-header">
                        <div className="report-header-meta">
                            <div className="report-header-brand">
                                <span className="report-header-brand-name">PsicoSST</span>
                                <span className="report-header-brand-tagline">Batería de Riesgo Psicosocial · Colombia</span>
                            </div>
                            <div className="report-header-ref">
                                <span className="report-header-ref-label">Referencia</span>
                                <span className="report-header-ref-value">{shortRef}</span>
                            </div>
                        </div>

                        <h1>Informe Individual de Evaluación</h1>
                        <h2>Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial · Res. 2764/2022</h2>

                        <div className="report-header-type">
                            <span className="report-header-type-dot" />
                            <span className="report-header-type-text">
                                {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType}
                                {assessment.formType ? ` — Forma ${assessment.formType}` : ""}
                            </span>
                        </div>
                    </header>

                    {/* ══════════════ BODY ══════════════ */}
                    <div className="report-body">

                        {/* AVISO */}
                        <div className="confidentiality-notice">
                            <strong>Confidencial — Uso exclusivo del trabajador</strong>
                            <p style={{ marginTop: "0.35rem" }}>
                                De acuerdo con las Resoluciones 2646/2008 y 2764/2022 del Ministerio del Trabajo,
                                este informe debe ser entregado únicamente al trabajador por un psicólogo especialista
                                en SST. La organización no tiene acceso a los resultados individuales.
                            </p>
                        </div>

                        {/* 1. MARCO NORMATIVO */}
                        <section className="report-section">
                            <h3>1. Marco Normativo</h3>
                            <div style={{ fontSize: "0.83rem", lineHeight: 1.75, color: "#374151" }}>
                                <p>El presente informe se enmarca en la normatividad colombiana vigente:</p>
                                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem", listStyleType: "disc", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <li><strong>Resolución 2646 de 2008</strong> — Define responsabilidades para la identificación, evaluación, prevención e intervención de factores de riesgo psicosocial.</li>
                                    <li><strong>Resolución 2764 de 2022</strong> — Adopta oficialmente la Batería de Instrumentos y sus protocolos de evaluación e intervención.</li>
                                    <li><strong>Decreto 0728 de 2025</strong> — Establece acciones de promoción de salud mental y prevención de trastornos mentales en el trabajo.</li>
                                    <li><strong>Ley 1090 de 2006</strong> — Garantiza la confidencialidad de la información obtenida en el proceso evaluativo.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. DATOS GENERALES */}
                        <section className="report-section">
                            <h3>2. Identificación del Trabajador</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Nombre completo</label>
                                    <span>{assessment.worker.fullName}</span>
                                </div>
                                <div className="info-item">
                                    <label>Documento de identidad</label>
                                    <span>{assessment.worker.documentType} {assessment.worker.documentId}</span>
                                </div>
                                <div className="info-item">
                                    <label>Cargo</label>
                                    <span>{assessment.worker.jobTitle || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Nivel del cargo</label>
                                    <span>{jobLevelLabels[assessment.worker.jobLevel] || assessment.worker.jobLevel}</span>
                                </div>
                                <div className="info-item">
                                    <label>Edad</label>
                                    <span>{calculateAge(assessment.worker.birthYear)} años</span>
                                </div>
                                <div className="info-item">
                                    <label>Estado civil</label>
                                    <span>{assessment.worker.maritalStatus || "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Escolaridad</label>
                                    <span>{assessment.worker.educationLevel ? (educationLabels[assessment.worker.educationLevel] || assessment.worker.educationLevel) : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Antigüedad en la empresa</label>
                                    <span>{assessment.worker.yearsInCompany !== null ? `${assessment.worker.yearsInCompany} años` : "–"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Organización</label>
                                    <span>{assessment.organization.name}</span>
                                </div>
                                <div className="info-item">
                                    <label>Fecha de evaluación</label>
                                    <span>{assessmentDate}</span>
                                </div>
                            </div>
                        </section>

                        {/* 3. RESULTADOS PRINCIPALES */}
                        <section className="report-section">
                            <h3>3. Resultados — {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType}</h3>

                            <div className={`total-result-card ${getRiskClass(overallRisk)}`}>
                                <div>
                                    <div className="total-result-label">Nivel de riesgo total</div>
                                    <div className="total-result-value">
                                        {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk] || overallRisk}
                                    </div>
                                </div>
                                <div className="total-result-score">
                                    {totalScores.transformedScore.toFixed(0)}
                                </div>
                            </div>

                            {domainDimensionGroups.map((group) => (
                                <div key={group.domainKey} className="domain-group">
                                    {Object.keys(domainScores).length > 0 && (
                                        <div className={`domain-header ${getRiskClass(group.riskCategory)}`}>
                                            <span className="domain-name">{group.domainName}</span>
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
                                                                <div
                                                                    className={`score-bar-fill ${getRiskClass(dim.riskCategory)}`}
                                                                    style={{ width: `${dim.transformedScore}%` }}
                                                                />
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

                        {/* RESULTADOS COMPLEMENTARIOS */}
                        {!isIntra && (
                            <section className="report-section">
                                <h3>4. Factores Intralaborales</h3>
                                {intralaboralResults ? (
                                    <div className={`total-result-card ${getRiskClass((intralaboralResults as any).overallRiskCategory)}`}>
                                        <div>
                                            <div className="total-result-label">Riesgo Intralaboral Total</div>
                                            <div className="total-result-value">{riskLabels[(intralaboralResults as any).overallRiskCategory] || (intralaboralResults as any).overallRiskCategory}</div>
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
                                                <div className="total-result-value">{riskLabels[(extralaboralResults as any).overallRiskCategory] || (extralaboralResults as any).overallRiskCategory}</div>
                                            </div>
                                            <div className="total-result-score">{((extralaboralResults as any).totalScores?.transformedScore || 0).toFixed(0)}</div>
                                        </div>
                                        <table className="results-table">
                                            <thead>
                                                <tr>
                                                    <th>Dimensión</th>
                                                    <th className="center">Nivel de riesgo</th>
                                                    <th className="center">Puntaje</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values((extralaboralResults as any).dimensionScores).map((dim: any) => (
                                                    <tr key={dim.dimensionKey}>
                                                        <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                        <td className="center">
                                                            <span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>
                                                                {riskLabels[dim.riskCategory] || dim.riskCategory}
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
                                    </>
                                ) : (
                                    <p className="no-data">No se registran valoraciones extralaborales en el ciclo actual.</p>
                                )}
                            </section>
                        )}

                        {!isStress && (
                            <section className="report-section">
                                <h3>{isIntra && isExtra ? "6." : (isIntra || isExtra ? "5." : "4.")} Evaluación del Estrés</h3>
                                {stressResults ? (
                                    <>
                                        <div className={`total-result-card ${getRiskClass((stressResults as any).overallRiskCategory)}`}>
                                            <div>
                                                <div className="total-result-label">Nivel de Síntomas de Estrés</div>
                                                <div className="total-result-value">{stressRiskLabels[(stressResults as any).overallRiskCategory] || (stressResults as any).overallRiskCategory}</div>
                                            </div>
                                            <div className="total-result-score">{((stressResults as any).totalScores?.transformedScore || 0).toFixed(0)}</div>
                                        </div>
                                        <table className="results-table">
                                            <thead>
                                                <tr>
                                                    <th>Categoría de síntomas</th>
                                                    <th className="center">Nivel</th>
                                                    <th className="center">Puntaje</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values((stressResults as any).dimensionScores).map((dim: any) => (
                                                    <tr key={dim.dimensionKey}>
                                                        <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                        <td className="center">
                                                            <span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>
                                                                {stressRiskLabels[dim.riskCategory] || dim.riskCategory}
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
                                    </>
                                ) : (
                                    <p className="no-data">No se registran valoraciones de estrés en el ciclo actual.</p>
                                )}
                            </section>
                        )}

                        {/* RESUMEN POR DOMINIO */}
                        {Object.keys(domainScores).length > 0 && (
                            <section className="report-section">
                                <h3>Resumen por Dominio</h3>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Dominio</th>
                                            <th className="center">Puntaje transformado</th>
                                            <th className="center">Categoría de riesgo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(domainScores).map((domain) => (
                                            <tr key={domain.domainKey}>
                                                <td style={{ fontWeight: 600 }}>{domain.domainName}</td>
                                                <td className="center">
                                                    <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                        <div className="score-bar-track">
                                                            <div className={`score-bar-fill ${getRiskClass(domain.riskCategory)}`} style={{ width: `${domain.transformedScore}%` }} />
                                                        </div>
                                                        <span className="score-value">{domain.transformedScore.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="center">
                                                    <span className={`risk-badge ${getRiskClass(domain.riskCategory)}`}>
                                                        {riskLabels[domain.riskCategory] || domain.riskCategory}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: "2px solid #111827" }}>
                                            <td style={{ fontWeight: 800, color: "#111827", paddingTop: "0.875rem" }}>TOTAL</td>
                                            <td className="center" style={{ paddingTop: "0.875rem" }}>
                                                <div className="score-bar-wrap" style={{ justifyContent: "center" }}>
                                                    <div className="score-bar-track">
                                                        <div className={`score-bar-fill ${getRiskClass(overallRisk)}`} style={{ width: `${totalScores.transformedScore}%` }} />
                                                    </div>
                                                    <span className="score-value" style={{ fontWeight: 800 }}>{totalScores.transformedScore.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="center" style={{ paddingTop: "0.875rem" }}>
                                                <span className={`risk-badge ${getRiskClass(overallRisk)}`} style={{ fontWeight: 800 }}>
                                                    {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk] || overallRisk}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* CONCLUSIONES */}
                        <section className="report-section">
                            <h3>Conclusiones Clínicas</h3>
                            <div style={{ fontSize: "0.86rem", lineHeight: 1.8, color: "#374151" }}>
                                <p>
                                    Con base en los resultados de la aplicación del cuestionario de{" "}
                                    {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType},
                                    el trabajador <strong>{assessment.worker.fullName}</strong> presenta un nivel de
                                    riesgo general clasificado como{" "}
                                    <strong style={{ color: overallRisk === "MUY_ALTO" || overallRisk === "ALTO" ? "#991B1B" : undefined }}>
                                        {isStress ? stressRiskLabels[overallRisk] : riskLabels[overallRisk] || overallRisk}
                                    </strong>.
                                </p>
                                {(overallRisk === "ALTO" || overallRisk === "MUY_ALTO") && (
                                    <p style={{ marginTop: "0.75rem", padding: "0.875rem 1rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "4px", color: "#991B1B" }}>
                                        <strong>Acción requerida:</strong> De acuerdo con la Resolución 2764 de 2022, los niveles
                                        de riesgo Alto y Muy Alto requieren intervención inmediata dentro del Sistema de Vigilancia
                                        Epidemiológica de Factores de Riesgo Psicosocial. Se recomienda remisión prioritaria.
                                    </p>
                                )}
                                {overallRisk === "MEDIO" && (
                                    <p style={{ marginTop: "0.75rem", padding: "0.875rem 1rem", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "4px", color: "#92400E" }}>
                                        <strong>Seguimiento recomendado:</strong> Este nivel de riesgo amerita observación sistemática
                                        e intervención preventiva orientada a evitar la progresión hacia niveles superiores.
                                    </p>
                                )}
                                {(overallRisk === "BAJO" || overallRisk === "SIN_RIESGO") && (
                                    <p style={{ marginTop: "0.75rem", padding: "0.875rem 1rem", background: "#F0FFF9", border: "1px solid #A7F3D0", borderRadius: "4px", color: "#065F46" }}>
                                        <strong>Condiciones favorables:</strong> Se recomienda mantener y fortalecer las acciones
                                        de promoción y prevención que contribuyen a preservar este nivel.
                                    </p>
                                )}
                                {Object.keys(domainScores).length > 0 && (() => {
                                    const critical = Object.values(domainScores).filter(d => d.riskCategory === "ALTO" || d.riskCategory === "MUY_ALTO");
                                    if (!critical.length) return null;
                                    return (
                                        <p style={{ marginTop: "0.75rem" }}>
                                            Dominios prioritarios de intervención:{" "}
                                            <strong>{critical.map(d => d.domainName).join(", ")}</strong>.
                                        </p>
                                    );
                                })()}
                            </div>
                        </section>

                        {/* ANÁLISIS Y RECOMENDACIONES */}
                        <section className="report-section">
                            <h3>Análisis Profesional y Plan de Intervención</h3>
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

                        {/* LEYENDA */}
                        <section className="report-section">
                            <div className="risk-legend">
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#10B981" }} /> Sin Riesgo</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#22C55E" }} /> Bajo</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#F59E0B" }} /> Medio</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#F97316" }} /> Alto</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: "#EF4444" }} /> Muy Alto</span>
                            </div>
                        </section>

                        {/* FIRMA */}
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
                                <p className="signature-detail">Psicólogo(a) Especialista en SST</p>
                                <p className="signature-detail">Licencia SST: {assessment.psychologist?.sstCredential || assessment.psychologist?.licenseNumber}</p>
                                <p className="signature-detail">Tarjeta Profesional: {assessment.psychologist?.professionalCard || "–"}</p>
                            </div>
                        </section>
                    </div>

                    {/* ══════════════ FOOTER ══════════════ */}
                    <footer className="report-footer">
                        <div>
                            <p>Generado por PsicoSST · {generationDate}</p>
                            <p>Válido únicamente con firma del profesional responsable · {shortRef}</p>
                        </div>
                        <span className="footer-badge">Res. 2764/2022</span>
                    </footer>
                </div>
            </div>
        </>
    );
}
