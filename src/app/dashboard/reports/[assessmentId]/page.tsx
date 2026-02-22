import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DimensionScore, DomainScore, TotalScore, RiskCategory } from "@/types/battery";
import "./report.css";

const riskLabels: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Riesgo Bajo",
    MEDIO: "Riesgo Medio",
    ALTO: "Riesgo Alto",
    MUY_ALTO: "Riesgo Muy Alto"
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
                                gte: new Date(new Date().getFullYear(), 0, 1) // Current year
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
            reports: {
                take: 1,
                orderBy: { generatedAt: "desc" }
            }
        }
    });

    if (!assessment || assessment.psychologistId !== session.user.id) {
        return notFound();
    }

    const report = assessment.reports[0];
    const isSigned = report?.status === "SIGNED";

    if (!assessment.scoredResult) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>No hay resultados de calificación para esta evaluación.</h2>
            </div>
        );
    }

    const dimensionScores = (assessment.scoredResult as any)?.dimensionScores as Record<string, DimensionScore> || {};
    const domainScores = (assessment.scoredResult as any)?.domainScores as Record<string, DomainScore> || {};
    const totalScores = (assessment.scoredResult as any)?.totalScores as TotalScore || { rawScore: 0, transformedScore: 0, riskCategory: "SIN_RIESGO" };
    const overallRisk = assessment.scoredResult.overallRiskCategory;

    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const generationDate = new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    // Extract other assessment results for aggregation
    const assessments = (assessment.worker as any)?.assessments || [];
    const otherAssessments = assessments.filter((a: any) => a.id !== assessment.id);
    const extralaboralResults = otherAssessments.find((a: any) => a.questionnaireType === "EXTRALABORAL")?.scoredResult;
    const stressResults = otherAssessments.find((a: any) => a.questionnaireType === "STRESS")?.scoredResult;

    const calculateAge = (birthDate: Date | null) => {
        if (!birthDate) return "–";
        const ageDifMs = Date.now() - new Date(birthDate).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Group dimensions by domain for intralaboral reports
    const domainDimensionGroups: { domainKey: string; domainName: string; riskCategory: string; transformedScore: number; dimensions: DimensionScore[] }[] = [];

    if (Object.keys(domainScores).length > 0) {
        for (const [key, domain] of Object.entries(domainScores)) {
            const dims = domain.dimensions
                .map(dk => dimensionScores[dk])
                .filter(Boolean);
            domainDimensionGroups.push({
                domainKey: key,
                domainName: domain.domainName,
                riskCategory: domain.riskCategory,
                transformedScore: domain.transformedScore,
                dimensions: dims
            });
        }
    } else {
        // Extralaboral / Stress — no domains, just flat dimensions
        domainDimensionGroups.push({
            domainKey: "total",
            domainName: questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType,
            riskCategory: overallRisk,
            transformedScore: totalScores.transformedScore,
            dimensions: Object.values(dimensionScores)
        });
    }

    return (
        <>
            {/* Print Button (hidden on print) */}
            <div className="no-print" style={{
                padding: "1rem 2rem",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <a href="/dashboard/assessments" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                    ← Volver a Evaluaciones
                </a>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {!isSigned && (
                        <div style={{ display: "flex", gap: "12px" }}>
                            <textarea
                                id="analysis-input"
                                className="no-print"
                                placeholder="Escriba aquí el análisis clínico..."
                                style={{
                                    width: "300px",
                                    height: "40px",
                                    borderRadius: "4px",
                                    border: "1px solid #cbd5e1",
                                    padding: "8px",
                                    fontSize: "0.8rem",
                                    resize: "none"
                                }}
                            />
                            <textarea
                                id="recommendations-input"
                                className="no-print"
                                placeholder="Recomendaciones..."
                                style={{
                                    width: "300px",
                                    height: "40px",
                                    borderRadius: "4px",
                                    border: "1px solid #cbd5e1",
                                    padding: "8px",
                                    fontSize: "0.8rem",
                                    resize: "none"
                                }}
                            />
                            <button
                                id="sign-btn"
                                className="print-btn"
                                style={{ background: "#10b981" }}
                            >
                                ✍️ Firmar Reporte
                            </button>
                        </div>
                    )}
                    <button
                        onClick={undefined}
                        className="print-btn"
                    >
                        🖨️ Descargar PDF
                    </button>
                </div>
            </div>

            {/* Signature Logic Script */}
            {!isSigned && (
                <script dangerouslySetInnerHTML={{
                    __html: `
                        document.getElementById('sign-btn')?.addEventListener('click', async function() {
                            const analysis = document.getElementById('analysis-input')?.value;
                            const recommendations = document.getElementById('recommendations-input')?.value;

                            if (!analysis || !recommendations) {
                                alert('Por favor ingrese el análisis y las recomendaciones antes de firmar.');
                                return;
                            }

                            if (!confirm('¿Confirma que desea firmar este reporte? Una vez firmado será inmutable y legalmente válido.')) return;
                            
                            const btn = this;
                            btn.disabled = true;
                            btn.innerText = 'Firmando...';
                            
                            try {
                                const res = await fetch('/api/reports/${assessmentId}/sign', { 
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ analysis, recommendations })
                                });
                                if (res.ok) {
                                    alert('Reporte firmado correctamente.');
                                    window.location.reload();
                                } else {
                                    const data = await res.json();
                                    alert('Error: ' + (data.error || 'No se pudo firmar.'));
                                    btn.disabled = false;
                                    btn.innerText = '✍️ Firmar Reporte';
                                }
                            } catch (e) {
                                alert('Error de conexión.');
                                btn.disabled = false;
                                btn.innerText = '✍️ Firmar Reporte';
                            }
                        });
                    `
                }} />
            )}

            <div className="report-view-wrapper">
                <div className="report-container">
                    {/* ═══════════════ HEADER ═══════════════ */}
                    <header className="report-header">
                        <h1>Informe Individual de Evaluación</h1>
                        <h2>Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial</h2>
                        <p className="subtitle">
                            Cuestionario {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType}
                            {" — "}Forma {assessment.formType}
                        </p>
                    </header>

                    {/* ═══════════════ CONFIDENTIALITY NOTICE ═══════════════ */}
                    <div className="confidentiality-notice">
                        <p><strong>AVISO DE CONFIDENCIALIDAD:</strong> En Colombia, el informe individual de la Batería de Riesgo Psicosocial (regulado por las Resoluciones 2646 de 2008 y 2764 de 2022) es un documento confidencial que debe ser entregado únicamente al trabajador por un psicólogo especialista en Seguridad y Salud en el Trabajo. La empresa no puede conocer el contenido de los informes individuales; solo tiene acceso al informe diagnóstico general o consolidado.</p>
                    </div>

                    {/* ═══════════════ WORKER INFO ═══════════════ */}
                    <section className="report-section">
                        <h3>1. Datos Generales e Identificación</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Nombre completo</label>
                                <span>{assessment.worker.fullName}</span>
                            </div>
                            <div className="info-item">
                                <label>Documento</label>
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
                                <span>{calculateAge(assessment.worker.birthDate)} años</span>
                            </div>
                            <div className="info-item">
                                <label>Estado Civil</label>
                                <span>{assessment.worker.maritalStatus || "–"}</span>
                            </div>
                            <div className="info-item">
                                <label>Escolaridad</label>
                                <span>{educationLabels[assessment.worker.educationLevel] || assessment.worker.educationLevel}</span>
                            </div>
                            <div className="info-item">
                                <label>Antigüedad en Empresa</label>
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

                    {/* ═══════════════ INTRALABORAL RESULTS ═══════════════ */}
                    <section className="report-section">
                        <h3>2. Resultados de Factores Intralaborales</h3>
                        <div className={`total-result-card ${getRiskClass(overallRisk)}`}>
                            <div className="total-result-label">Nivel de Riesgo Intralaboral Total</div>
                            <div className="total-result-value">{riskLabels[overallRisk] || overallRisk}</div>
                        </div>

                        {domainDimensionGroups.map((group) => (
                            <div key={group.domainKey} className="domain-group">
                                {Object.keys(domainScores).length > 0 && (
                                    <div className={`domain-header ${getRiskClass(group.riskCategory)}`}>
                                        <span className="domain-name">{group.domainName}</span>
                                        <span className="domain-risk">
                                            {riskLabels[group.riskCategory]} — {group.transformedScore.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Dimensión</th>
                                            <th className="center">Categoría de Riesgo</th>
                                            <th className="center">Puntaje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.dimensions.map((dim) => (
                                            <tr key={dim.dimensionKey}>
                                                <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                <td className="center">
                                                    <span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>
                                                        {riskLabels[dim.riskCategory] || dim.riskCategory}
                                                    </span>
                                                </td>
                                                <td className="center" style={{ fontWeight: 700 }}>{dim.transformedScore.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </section>

                    {/* ═══════════════ EXTRALABORAL RESULTS (Aggregated) ═══════════════ */}
                    <section className="report-section">
                        <h3>3. Resultados de Factores Extralaborales</h3>
                        {extralaboralResults ? (
                            <>
                                <div className={`total-result-card ${getRiskClass((extralaboralResults as any).overallRiskCategory)}`}>
                                    <div className="total-result-label">Nivel de Riesgo Extralaboral Total</div>
                                    <div className="total-result-value">{riskLabels[(extralaboralResults as any).overallRiskCategory] || (extralaboralResults as any).overallRiskCategory}</div>
                                </div>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Dimensión</th>
                                            <th className="center">Categoría de Riesgo</th>
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
                                                <td className="center">{dim.transformedScore.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <p className="no-data">No se registran valoraciones extralaborales en el ciclo actual.</p>
                        )}
                    </section>

                    {/* ═══════════════ STRESS RESULTS (Aggregated) ═══════════════ */}
                    <section className="report-section">
                        <h3>4. Evaluación del Estrés</h3>
                        {stressResults ? (
                            <>
                                <div className={`total-result-card ${getRiskClass((stressResults as any).overallRiskCategory)}`}>
                                    <div className="total-result-label">Nivel de Síntomas de Estrés</div>
                                    <div className="total-result-value">{riskLabels[(stressResults as any).overallRiskCategory] || (stressResults as any).overallRiskCategory}</div>
                                </div>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Categoría de Síntomas</th>
                                            <th className="center">Categoría de Riesgo</th>
                                            <th className="center">Puntaje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values((stressResults as any).dimensionScores).map((dim: any) => (
                                            <tr key={dim.dimensionKey}>
                                                <td style={{ fontWeight: 500 }}>{dim.dimensionName}</td>
                                                <td className="center">
                                                    <span className={`risk-badge ${getRiskClass(dim.riskCategory)}`}>
                                                        {riskLabels[dim.riskCategory] || dim.riskCategory}
                                                    </span>
                                                </td>
                                                <td className="center">{dim.transformedScore.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <p className="no-data">No se registran valoraciones de estrés en el ciclo actual.</p>
                        )}
                    </section>

                    {/* ═══════════════ DOMAINS SUMMARY ═══════════════ */}
                    {Object.keys(domainScores).length > 0 && (
                        <section className="report-section">
                            <h3>Resumen por Dominio</h3>
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Dominio</th>
                                        <th className="center">Puntaje Transformado</th>
                                        <th className="center">Categoría de Riesgo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(domainScores).map((domain) => (
                                        <tr key={domain.domainKey}>
                                            <td style={{ fontWeight: 600 }}>{domain.domainName}</td>
                                            <td className="center" style={{ fontWeight: 700 }}>{domain.transformedScore.toFixed(1)}%</td>
                                            <td className="center">
                                                <span className={`risk-badge ${getRiskClass(domain.riskCategory)}`}>
                                                    {riskLabels[domain.riskCategory] || domain.riskCategory}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total row */}
                                    <tr className="total-row" style={{ background: "#f8fafc" }}>
                                        <td style={{ fontWeight: 800, color: "#0f172a" }}>TOTAL</td>
                                        <td className="center" style={{ fontWeight: 800, color: "#0f172a" }}>{totalScores.transformedScore.toFixed(1)}%</td>
                                        <td className="center">
                                            <span className={`risk-badge ${getRiskClass(overallRisk)}`} style={{ fontWeight: 800 }}>
                                                {riskLabels[overallRisk] || overallRisk}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* ═══════════════ ANALYSIS & RECOMMENDATIONS ═══════════════ */}
                    <section className="report-section">
                        <h3>5. Análisis y Recomendaciones</h3>
                        <div className="analysis-box">
                            <label>Interpretación Profesional</label>
                            <div className="analysis-content">
                                {(report?.reportData as any)?.analysis || (
                                    <span className="placeholder no-print">El psicólogo debe ingresar el análisis clínico al firmar el reporte.</span>
                                )}
                            </div>
                        </div>
                        <div className="analysis-box" style={{ marginTop: "1.5rem" }}>
                            <label>Sugerencias de Intervención</label>
                            <div className="analysis-content">
                                {(report?.reportData as any)?.recommendations || (
                                    <span className="placeholder no-print">Acciones recomendadas para la gestión del riesgo.</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════ RISK LEGEND ═══════════════ */}
                    <section className="report-section">
                        <div className="risk-legend">
                            <span className="legend-item"><span className="legend-dot risk-none" style={{ background: "#22c55e" }} /> Sin Riesgo</span>
                            <span className="legend-item"><span className="legend-dot risk-low" style={{ background: "#84cc16" }} /> Bajo</span>
                            <span className="legend-item"><span className="legend-dot risk-medium" style={{ background: "#eab308" }} /> Medio</span>
                            <span className="legend-item"><span className="legend-dot risk-high" style={{ background: "#f97316" }} /> Alto</span>
                            <span className="legend-item"><span className="legend-dot risk-very-high" style={{ background: "#ef4444" }} /> Muy Alto</span>
                        </div>
                    </section>

                    {/* ═══════════════ SIGNATURE ═══════════════ */}
                    <section className="report-section signature-section">
                        <div className="signature-box">
                            <div className="signature-img-wrap">
                                {isSigned && assessment.psychologist?.signature && (
                                    <img
                                        src={assessment.psychologist.signature}
                                        alt="Firma Digital"
                                        style={{ maxHeight: "100px", maxWidth: "220px", filter: "contrast(1.2)" }}
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

                    {/* ═══════════════ FOOTER ═══════════════ */}
                    <footer className="report-footer">
                        <p>
                            Este reporte tiene validez únicamente con la firma electrónica del profesional responsable.
                        </p>
                        <p>
                            Informe generado por PsicoSST el {generationDate}. Confidencial.
                        </p>
                        <p style={{ fontSize: "0.65rem", marginTop: "0.5rem", opacity: 0.6 }}>
                            Cumple con Resolución 2764 de 2022 — Ministerio del Trabajo de Colombia
                        </p>
                    </footer>
                </div>
            </div>

            {/* Client-side print trigger */}
            <script dangerouslySetInnerHTML={{
                __html: `
                    document.querySelector('.print-btn')?.addEventListener('click', function() {
                        window.print();
                    });
                `
            }} />
        </>
    );
}
