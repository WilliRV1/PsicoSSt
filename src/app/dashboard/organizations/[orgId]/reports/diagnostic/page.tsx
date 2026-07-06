import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import "./organizational-report.css";

import { getBaremos } from "@/config/battery";
import { RECOMMENDED_ACTIONS } from "@/lib/scoring/recommendations";
import { PrintButton } from "./print-button";
import { GaugeChart } from "@/components/reports/GaugeChart";

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const RISK_SEVERITY: Record<string, number> = {
    SIN_RIESGO: 0,
    BAJO: 1,
    MEDIO: 2,
    ALTO: 3,
    MUY_ALTO: 4,
};

interface PageProps {
    params: Promise<{ orgId: string }>;
}

export default async function DiagnosticReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                select: {
                    fullName: true,
                    licenseNumber: true
                }
            }
        }
    });

    if (!org || (org.createdByPsychologist !== session.user.id && !session.user.isAdmin)) {
        return notFound();
    }

    // Fetch assessments that are finished (COMPLETED, SCORED, or SIGNED)
    const assessments = await prisma.assessment.findMany({
        where: {
            organizationId: orgId,
            status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] }
        },
        include: {
            worker: {
                select: {
                    departmentArea: true,
                    jobTitle: true
                }
            },
            scoredResult: true
        }
    });

    const hasUnsigned = assessments.some(a => a.status !== "SIGNED");

    if (assessments.length === 0) {
        return (
            <div className="org-report-container text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Informe Diagnóstico General</h1>
                <p className="text-slate-500 max-w-md mx-auto">No hay suficientes evaluaciones firmadas en esta organización para generar un informe estadístico válido.</p>
                <div className="mt-8">
                    <a href={`/dashboard/organizations/${orgId}`} className="text-blue-600 font-semibold hover:underline">← Volver a la organización</a>
                </div>
            </div>
        );
    }

    const { 
        stats, stressCorrelation, segmentedData, dimensionAnalysis, 
        executiveSummary, domainsFormaA, domainsFormaB, recommendations 
    } = processStats(assessments);

    // Date range of assessments
    const dates = assessments.map(a => new Date(a.assessmentDate).getTime());
    const earliestDate = new Date(Math.min(...dates)).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const latestDate = new Date(Math.max(...dates)).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="org-report-container">
                <header className="org-report-header">
                    <div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 block">SGSST - Reporte Oficial</span>
                        <h1>Informe Diagnóstico Organizacional</h1>
                        <p className="text-slate-500 font-medium mt-1">{org.name} <span className="mx-2 text-slate-300">|</span> NIT: {org.nit}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-600 font-bold">{org.psychologist.fullName}</p>
                        <p className="text-xs text-slate-500">Licencia SST: {org.psychologist.licenseNumber}</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">Fecha: {new Date().toLocaleDateString('es-CO')}</p>
                    </div>
                </header>

                <div className="flex justify-end mb-6 -mt-16">
                    <PrintButton data={{
                        orgInfo: {
                            organizationName: org.name,
                            organizationNit: org.nit,
                            reportDate: new Date().toLocaleDateString('es-CO'),
                            psychologistName: org.psychologist.fullName,
                            psychologistLicense: org.psychologist.licenseNumber
                        },
                        executiveSummary: {
                            totalWorkers: executiveSummary.uniqueWorkers,
                            criticalPercent: executiveSummary.criticalPercent,
                            predominantRisk: executiveSummary.predominantRisk,
                            priorityMatrix: {
                                group1D: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'ALTO' || k === 'MUY_ALTO' ? stressCorrelation[k]['ALTO'] + stressCorrelation[k]['MUY_ALTO'] : 0), 0),
                                vulnerables: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'SIN_RIESGO' || k === 'BAJO' || k === 'MEDIO' ? stressCorrelation[k]['ALTO'] + stressCorrelation[k]['MUY_ALTO'] : 0), 0),
                                adaptados: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'ALTO' || k === 'MUY_ALTO' ? stressCorrelation[k]['SIN_RIESGO'] + stressCorrelation[k]['BAJO'] + stressCorrelation[k]['MEDIO'] : 0), 0),
                                sanos: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'SIN_RIESGO' || k === 'BAJO' || k === 'MEDIO' ? stressCorrelation[k]['SIN_RIESGO'] + stressCorrelation[k]['BAJO'] + stressCorrelation[k]['MEDIO'] : 0), 0),
                            }
                        },
                        domainsFormaA,
                        domainsFormaB,
                        recommendations
                    }} />
                </div>

                <div className="anonymity-notice">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p><strong>Custodia de Datos:</strong> Este informe cumple con la Ley 1090 de 2006. Los resultados son estrictamente estadísticos y no permiten la identificación individual de los trabajadores, garantizando el anonimato en grupos menores a 10 personas.</p>
                </div>

                {hasUnsigned && (
                    <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 rounded-r-lg flex items-center gap-3 animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-sm font-bold uppercase tracking-tight">Atención: Este informe incluye datos de evaluaciones completadas pero aún no firmadas digitalmente.</p>
                    </div>
                )}

                {/* ═══════════════ 1. RESUMEN EJECUTIVO ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">1. Resumen Ejecutivo</h2>
                    <div className="chart-container">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-3xl font-black text-slate-800">{executiveSummary.uniqueWorkers}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Trabajadores evaluados</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-3xl font-black text-slate-800">{executiveSummary.totalAssessments}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Evaluaciones totales</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-3xl font-black text-slate-800">{executiveSummary.intraCount} / {executiveSummary.extraCount} / {executiveSummary.stressCount}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Intra / Extra / Estrés</p>
                            </div>
                            <div className={`text-center p-4 rounded-lg ${executiveSummary.criticalPercent > 30 ? "bg-red-50" : executiveSummary.criticalPercent > 15 ? "bg-orange-50" : "bg-green-50"}`}>
                                <p className={`text-3xl font-black ${executiveSummary.criticalPercent > 30 ? "text-red-700" : executiveSummary.criticalPercent > 15 ? "text-orange-700" : "text-green-700"}`}>{executiveSummary.criticalPercent}%</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">En zona crítica (Alto + Muy Alto)</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                            <p>
                                Se evaluaron <strong>{executiveSummary.uniqueWorkers} trabajadores</strong> de la organización <strong>{org.name}</strong>,
                                mediante la aplicación de la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial,
                                completando un total de <strong>{executiveSummary.totalAssessments} evaluaciones</strong> distribuidas en los
                                tres cuestionarios de la batería.
                            </p>
                            <p>
                                {executiveSummary.criticalPercent > 30
                                    ? "Los resultados revelan una proporción significativamente alta de trabajadores en zona de riesgo crítico (Alto y Muy Alto), lo que requiere intervención prioritaria e inmediata según la normatividad vigente."
                                    : executiveSummary.criticalPercent > 15
                                    ? "Se identifica una proporción moderada de trabajadores en zona de riesgo crítico que amerita implementar acciones de intervención y seguimiento."
                                    : "Los resultados generales muestran un perfil de riesgo favorable. Se recomienda mantener las acciones de promoción y prevención implementadas."
                                }
                            </p>
                            {executiveSummary.predominantRisk && (
                                <p>
                                    El nivel de riesgo predominante en la organización es <strong>{RISK_LABELS[executiveSummary.predominantRisk]}</strong>.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ 2. METODOLOGÍA ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">2. Metodología</h2>
                    <div className="chart-container">
                        <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                            <p>
                                <strong>Instrumento utilizado:</strong> Batería de Instrumentos para la Evaluación de Factores de Riesgo
                                Psicosocial, adoptada mediante la Resolución 2764 de 2022 del Ministerio del Trabajo de Colombia.
                                La batería fue desarrollada por la Pontificia Universidad Javeriana y el Ministerio de la Protección Social.
                            </p>
                            <p>
                                <strong>Cuestionarios aplicados:</strong> Cuestionario de Factores de Riesgo Psicosocial Intralaboral
                                (Formas A y B según nivel del cargo), Cuestionario de Factores de Riesgo Psicosocial Extralaboral,
                                y Cuestionario para la Evaluación del Estrés.
                            </p>
                            <p>
                                <strong>Baremos:</strong> Se utilizaron los baremos poblacionales establecidos en la Resolución 2764 de 2022,
                                aplicando las tablas correspondientes según el tipo de cuestionario y la forma utilizada.
                            </p>
                            <p>
                                <strong>Período de evaluación:</strong> Del {earliestDate} al {latestDate}.
                            </p>
                            <p>
                                <strong>Responsable:</strong> {org.psychologist.fullName} — Psicólogo(a) Especialista en SST,
                                Licencia SST: {org.psychologist.licenseNumber}.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ 3. PERFIL GENERAL DE RIESGO ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">3. Perfil General de Riesgo</h2>
                    <div className="risk-summary-grid">
                        <ChartBox title="Riesgo Intralaboral" distribution={stats.intralaboral} count={executiveSummary.intraCount} icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                        <ChartBox title="Riesgo Extralaboral" distribution={stats.extralaboral} count={executiveSummary.extraCount} icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
                        <ChartBox title="Sintomatología de Estrés" distribution={stats.stress} count={executiveSummary.stressCount} icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
                    </div>
                </section>

                {/* ═══════════════ 4. CORRELACIÓN RIESGO VS ESTRÉS ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">4. Correlación Riesgo vs. Estrés</h2>
                    <div className="chart-container">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">Distribución de casos según el cruce de Riesgo Intralaboral y Niveles de Estrés.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="correlation-table">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50">Riesgo \ Estrés</th>
                                        <th>Sin Riesgo</th>
                                        <th>Bajo</th>
                                        <th>Medio</th>
                                        <th>Alto</th>
                                        <th>Muy Alto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(stressCorrelation).map(([intraRisk, stressMap]: [string, any]) => (
                                        <tr key={intraRisk}>
                                            <td className="text-left font-bold text-slate-700 bg-slate-50">{intraRisk.replace("_", " ")}</td>
                                            {Object.values(stressMap).map((count: any, idx) => (
                                                <td key={idx} className="heat-cell" style={{
                                                    backgroundColor: count > 0 ? `rgba(59, 130, 246, ${Math.min(0.1 + (count / 10), 0.8)})` : "transparent",
                                                    color: count > 3 ? "white" : "inherit"
                                                }}>
                                                    {count || "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ 5. EVALUACIÓN POR DOMINIOS (FORMA A - JEFATURAS) ═══════════════ */}
                {domainsFormaA.length > 0 && (
                    <section className="report-section">
                        <h2 className="section-title">5. Evaluación por Dominios (Jefaturas - Forma A)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {domainsFormaA.map((domain: any, idx: number) => (
                                <div key={idx} className="chart-container flex flex-col items-center">
                                    <div className="w-full h-48 flex items-center justify-center pt-4">
                                        <GaugeChart
                                            title={domain.name}
                                            value={domain.average}
                                            baremos={{
                                                maxSinRiesgo: domain.thresholds[0],
                                                maxBajo: domain.thresholds[1],
                                                maxMedio: domain.thresholds[2],
                                                maxAlto: domain.thresholds[3],
                                                maxMuyAlto: domain.thresholds[4]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════ 6. EVALUACIÓN POR DOMINIOS (FORMA B - OPERATIVOS) ═══════════════ */}
                {domainsFormaB.length > 0 && (
                    <section className="report-section">
                        <h2 className="section-title">6. Evaluación por Dominios (Auxiliares y Operativos - Forma B)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {domainsFormaB.map((domain: any, idx: number) => (
                                <div key={idx} className="chart-container flex flex-col items-center">
                                    <div className="w-full h-48 flex items-center justify-center pt-4">
                                        <GaugeChart
                                            title={domain.name}
                                            value={domain.average}
                                            baremos={{
                                                maxSinRiesgo: domain.thresholds[0],
                                                maxBajo: domain.thresholds[1],
                                                maxMedio: domain.thresholds[2],
                                                maxAlto: domain.thresholds[3],
                                                maxMuyAlto: domain.thresholds[4]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════ 7. ANÁLISIS POR DIMENSIONES ═══════════════ */}
                {dimensionAnalysis.length > 0 && (
                    <section className="report-section">
                        <h2 className="section-title">5. Análisis por Dimensiones</h2>
                        <div className="chart-container">
                            <p className="text-sm text-slate-600 mb-4">
                                Dimensiones con mayor puntaje transformado promedio, indicando las áreas que requieren mayor atención.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="correlation-table">
                                    <thead>
                                        <tr>
                                            <th className="text-left">Dimensión</th>
                                            <th className="text-center">Cuestionario</th>
                                            <th className="text-center">Puntaje Promedio</th>
                                            <th className="text-center">Trabajadores Evaluados</th>
                                            <th className="text-center">% Alto/Muy Alto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dimensionAnalysis.slice(0, 10).map((dim, idx) => (
                                            <tr key={idx}>
                                                <td className="text-left font-medium text-slate-700">{dim.name}</td>
                                                <td className="text-center text-sm text-slate-500">{dim.questionnaire}</td>
                                                <td className="text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                                        dim.avgScore >= 40 ? "bg-red-100 text-red-800"
                                                        : dim.avgScore >= 30 ? "bg-orange-100 text-orange-800"
                                                        : dim.avgScore >= 20 ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                        {dim.avgScore.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="text-center text-sm text-slate-600">{dim.count}</td>
                                                <td className="text-center">
                                                    <span className={`font-bold ${dim.criticalPercent > 30 ? "text-red-600" : dim.criticalPercent > 15 ? "text-orange-600" : "text-slate-600"}`}>
                                                        {dim.criticalPercent}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════ 8. PRIORIZACIÓN DE INTERVENCIÓN ═══════════════ */}
                {dimensionAnalysis.length > 0 && (
                    <section className="report-section">
                        <h2 className="section-title">6. Priorización de Intervención</h2>
                        <div className="chart-container">
                            <p className="text-sm text-slate-600 mb-4">
                                Matriz de prioridad basada en la combinación del nivel de riesgo promedio y el número de trabajadores afectados.
                                Las dimensiones se ordenan por prioridad de intervención.
                            </p>
                            <div className="space-y-2">
                                {dimensionAnalysis
                                    .filter(d => d.criticalPercent > 0 || d.avgScore >= 25)
                                    .sort((a, b) => b.priorityScore - a.priorityScore)
                                    .slice(0, 8)
                                    .map((dim, idx) => {
                                        const priority = dim.priorityScore >= 70 ? "CRITICA" : dim.priorityScore >= 40 ? "ALTA" : "MEDIA";
                                        const priorityColor = priority === "CRITICA" ? "bg-red-500" : priority === "ALTA" ? "bg-orange-500" : "bg-yellow-400";
                                        const priorityBadge = priority === "CRITICA" ? "bg-red-100 text-red-800 border-red-200" : priority === "ALTA" ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-yellow-100 text-yellow-800 border-yellow-200";

                                        return (
                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                                <div className={`w-2 h-10 rounded-full ${priorityColor} flex-shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm text-slate-800">{idx + 1}. {dim.name}</span>
                                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${priorityBadge}`}>
                                                            {priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Promedio: {dim.avgScore.toFixed(1)}% · {dim.criticalPercent}% en zona crítica · {dim.count} evaluados
                                                    </p>
                                                </div>
                                                {/* Priority bar */}
                                                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                                                    <div className={`h-full rounded-full ${priorityColor}`} style={{ width: `${Math.min(dim.priorityScore, 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════ 9. ANÁLISIS POR ÁREAS ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">7. Análisis por Áreas de Trabajo</h2>
                    <div className="segment-grid">
                        {Object.entries(segmentedData.byArea).map(([area, data]: [string, any]) => (
                            <div key={area} className="chart-container hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                                    <h3 className="font-bold text-slate-800">{area}</h3>
                                    <span className="px-2 py-1 bg-slate-200 rounded text-[10px] font-black text-slate-600">N = {data.count}</span>
                                </div>
                                <DistributionBars distribution={data.riskDistribution} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════ 10. CONCLUSIONES Y RECOMENDACIONES ═══════════════ */}
                <section className="report-section">
                    <h2 className="section-title">10. Conclusiones y Recomendaciones</h2>
                    <div className="chart-container">
                        <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                            <h3 className="font-bold text-slate-800 text-base">Conclusiones</h3>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>
                                    De los <strong>{executiveSummary.uniqueWorkers}</strong> trabajadores evaluados,
                                    el <strong>{executiveSummary.criticalPercent}%</strong> se encuentra en zona de riesgo
                                    crítico (Alto o Muy Alto) en al menos uno de los cuestionarios aplicados.
                                </li>
                                {executiveSummary.predominantRisk && (
                                    <li>
                                        El nivel de riesgo predominante en la organización es <strong>{RISK_LABELS[executiveSummary.predominantRisk]}</strong>.
                                    </li>
                                )}
                                {dimensionAnalysis.length > 0 && (
                                    <li>
                                        Las dimensiones que requieren intervención prioritaria son:{" "}
                                        <strong>
                                            {dimensionAnalysis
                                                .filter(d => d.criticalPercent > 0)
                                                .sort((a, b) => b.priorityScore - a.priorityScore)
                                                .slice(0, 3)
                                                .map(d => d.name)
                                                .join(", ") || "No se identificaron dimensiones críticas."}
                                        </strong>
                                    </li>
                                )}
                            </ul>

                            <h3 className="font-bold text-slate-800 text-base mt-6">Recomendaciones</h3>

                            {executiveSummary.criticalPercent > 30 && (
                                <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                    <p className="font-bold text-red-800 text-xs uppercase tracking-wide mb-1">Intervención Obligatoria</p>
                                    <p className="text-red-700">
                                        De acuerdo con la Resolución 2764 de 2022, cuando más del 20% de los trabajadores
                                        se encuentran en nivel de riesgo Alto o Muy Alto, la organización debe implementar
                                        un Sistema de Vigilancia Epidemiológica (SVE) de Factores de Riesgo Psicosocial
                                        con intervención inmediata y seguimiento anual.
                                    </p>
                                </div>
                            )}

                            <ul className="list-disc pl-5 space-y-1.5">
                                {executiveSummary.criticalPercent > 0 && (
                                    <li>
                                        <strong>Intervención inmediata:</strong> Priorizar la atención de los trabajadores
                                        clasificados en riesgo Alto y Muy Alto, incluyendo remisión a programas de
                                        asistencia al empleado y valoración especializada cuando se requiera.
                                    </li>
                                )}
                                <li>
                                    <strong>Actividades de prevención:</strong> Implementar programas de prevención
                                    enfocados en las dimensiones identificadas como prioritarias, incluyendo
                                    capacitaciones, talleres y ajustes organizacionales pertinentes.
                                </li>
                                <li>
                                    <strong>Seguimiento:</strong> Realizar reevaluación de los factores de riesgo
                                    psicosocial en un plazo máximo de 2 años (o 1 año si hay riesgo Alto/Muy Alto),
                                    conforme a lo establecido en la Resolución 2764 de 2022.
                                </li>
                                <li>
                                    <strong>Promoción:</strong> Fortalecer los factores protectores identificados
                                    (dimensiones en nivel Sin Riesgo o Bajo) mediante acciones de promoción de
                                    la salud mental y bienestar en el trabajo.
                                </li>
                            </ul>

                            <div className="mt-8">
                                <h3 className="font-bold text-slate-800 text-base mb-4">Matriz de Acciones Recomendadas (SVE)</h3>
                                {recommendations.length > 0 ? (
                                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
                                                <tr>
                                                    <th className="px-4 py-3 border-b border-slate-200">Dimensión en Riesgo Crítico</th>
                                                    <th className="px-4 py-3 border-b border-slate-200">Acción de Intervención Recomendada</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {recommendations.map((rec: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-800">{rec.dimension}</td>
                                                        <td className="px-4 py-3 text-slate-600">{rec.recommendation}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No se encontraron dimensiones en nivel de riesgo alto o muy alto que requieran intervención obligatoria según la matriz.</p>
                                )}
                            </div>

                            <div className="mt-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-800">
                                    <strong>Nota legal:</strong> Este informe diagnóstico organizacional es un documento
                                    técnico que forma parte del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)
                                    de la empresa, según lo dispuesto en la Resolución 2764 de 2022 y la Resolución 2646 de 2008.
                                    Los datos presentados son exclusivamente estadísticos y no permiten la identificación
                                    individual de trabajadores, en cumplimiento de la Ley 1090 de 2006 sobre confidencialidad.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="no-print mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
                    <a href={`/dashboard/organizations/${orgId}`} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">
                        ← Volver
                    </a>
                    <PrintButton data={{
                        orgInfo: {
                            organizationName: org.name,
                            organizationNit: org.nit,
                            reportDate: new Date().toLocaleDateString('es-CO'),
                            psychologistName: org.psychologist.fullName,
                            psychologistLicense: org.psychologist.licenseNumber
                        },
                        executiveSummary: {
                            totalWorkers: executiveSummary.uniqueWorkers,
                            criticalPercent: executiveSummary.criticalPercent,
                            predominantRisk: executiveSummary.predominantRisk,
                            priorityMatrix: {
                                group1D: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'ALTO' || k === 'MUY_ALTO' ? stressCorrelation[k]['ALTO'] + stressCorrelation[k]['MUY_ALTO'] : 0), 0),
                                vulnerables: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'SIN_RIESGO' || k === 'BAJO' || k === 'MEDIO' ? stressCorrelation[k]['ALTO'] + stressCorrelation[k]['MUY_ALTO'] : 0), 0),
                                adaptados: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'ALTO' || k === 'MUY_ALTO' ? stressCorrelation[k]['SIN_RIESGO'] + stressCorrelation[k]['BAJO'] + stressCorrelation[k]['MEDIO'] : 0), 0),
                                sanos: Object.keys(stressCorrelation).reduce((sum, k) => sum + (k === 'SIN_RIESGO' || k === 'BAJO' || k === 'MEDIO' ? stressCorrelation[k]['SIN_RIESGO'] + stressCorrelation[k]['BAJO'] + stressCorrelation[k]['MEDIO'] : 0), 0),
                            }
                        },
                        domainsFormaA,
                        domainsFormaB,
                        recommendations
                    }} />
                </footer>
            </div>
        </div>
    );
}

function ChartBox({ title, distribution, count, icon }: { title: string, distribution: any, count?: number, icon?: React.ReactNode }) {
    return (
        <div className="chart-container shadow-sm border-slate-200/60">
            <div className="flex items-center gap-2 mb-4 justify-center">
                {icon}
                <h3 className="chart-title mb-0">{title}</h3>
                {count !== undefined && <span className="text-[10px] text-slate-400 font-bold">N={count}</span>}
            </div>
            <DistributionBars distribution={distribution} />
        </div>
    );
}

function DistributionBars({ distribution }: { distribution: any }) {
    const categories = [
        { key: "SIN_RIESGO", label: "Sin Riesgo", color: "bg-sin-riesgo" },
        { key: "BAJO", label: "Bajo", color: "bg-bajo" },
        { key: "MEDIO", label: "Medio", color: "bg-medio" },
        { key: "ALTO", label: "Alto", color: "bg-alto" },
        { key: "MUY_ALTO", label: "Muy Alto", color: "bg-muy-alto" }
    ];

    return (
        <div>
            {categories.map(cat => (
                <div key={cat.key} className="bar-row">
                    <div className="bar-label">
                        <span>{cat.label}</span>
                        <span>{distribution[cat.key] || 0}%</span>
                    </div>
                    <div className="bar-outer">
                        <div className={`bar-inner ${cat.color}`} style={{ width: `${distribution[cat.key] || 0}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface DimensionStat {
    name: string;
    questionnaire: string;
    avgScore: number;
    count: number;
    criticalPercent: number;
    priorityScore: number;
}

function processStats(assessments: any[]) {
    const calculateDist = (filtered: any[]) => {
        const dist: any = { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 };
        filtered.forEach(a => {
            const risk = a.scoredResult?.overallRiskCategory;
            if (risk && dist[risk] !== undefined) dist[risk]++;
        });
        const total = filtered.length || 1;
        Object.keys(dist).forEach(k => dist[k] = Math.round((dist[k] / total) * 100));
        return dist;
    };

    const intraAssessments = assessments.filter(a => a.questionnaireType === "INTRALABORAL");
    const extraAssessments = assessments.filter(a => a.questionnaireType === "EXTRALABORAL");
    const stressAssessments = assessments.filter(a => a.questionnaireType === "STRESS");

    const stats = {
        intralaboral: calculateDist(intraAssessments),
        extralaboral: calculateDist(extraAssessments),
        stress: calculateDist(stressAssessments),
    };

    // Stress correlation & Domain aggregations
    const correlation: any = {
        SIN_RIESGO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        BAJO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MEDIO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MUY_ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 }
    };

    const domainMapA: Record<string, { sum: number, count: number }> = {};
    const domainMapB: Record<string, { sum: number, count: number }> = {};
    const recommendationsSet = new Set<string>();

    const workers: any = {};
    assessments.forEach(a => {
        if (!workers[a.workerId]) workers[a.workerId] = {};
        if (a.questionnaireType === "INTRALABORAL") workers[a.workerId].intra = a.scoredResult?.overallRiskCategory;
        if (a.questionnaireType === "STRESS") workers[a.workerId].stress = a.scoredResult?.overallRiskCategory;
    });

    Object.values(workers).forEach((w: any) => {
        if (w.intra && w.stress) correlation[w.intra][w.stress]++;
    });

    // Segmented by area
    const byArea: any = {};
    assessments.forEach(a => {
        const area = a.worker.departmentArea || "General";
        if (!byArea[area]) byArea[area] = [];
        byArea[area].push(a);
    });

    const segmentedArea: any = {};
    Object.entries(byArea).forEach(([area, list]: [string, any]) => {
        if (list.length >= 1) {
            segmentedArea[area] = { count: list.length, riskDistribution: calculateDist(list) };
        }
    });

    // Dimension analysis — extract from scoredResult.dimensionScores
    const dimensionMap: Record<string, { scores: number[]; riskCategories: string[]; questionnaire: string }> = {};

    assessments.forEach(a => {
        const sr = a.scoredResult as any;
        if (!sr?.dimensionScores) return;
        const qt = a.questionnaireType === "INTRALABORAL" ? "Intralaboral"
            : a.questionnaireType === "EXTRALABORAL" ? "Extralaboral"
            : "Estrés";
        const dimScores = sr.dimensionScores as Record<string, any>;
        Object.values(dimScores).forEach((dim: any) => {
            const key = `${dim.dimensionName || dim.dimensionKey}__${qt}`;
            if (!dimensionMap[key]) {
                dimensionMap[key] = { scores: [], riskCategories: [], questionnaire: qt };
            }
            if (typeof dim.transformedScore === "number") {
                dimensionMap[key].scores.push(dim.transformedScore);
            }
            if (dim.riskCategory) {
                dimensionMap[key].riskCategories.push(dim.riskCategory);
                if (dim.riskCategory === "ALTO" || dim.riskCategory === "MUY_ALTO") {
                    recommendationsSet.add(dim.dimensionName || dim.dimensionKey);
                }
            }
        });

        // Domains for A and B
        if (sr.domainScores) {
            Object.values(sr.domainScores as Record<string, any>).forEach((dom: any) => {
                if (!dom.domainName) return;
                const dMap = a.formType === "A" ? domainMapA : domainMapB;
                if (!dMap[dom.domainName]) dMap[dom.domainName] = { sum: 0, count: 0 };
                dMap[dom.domainName].sum += dom.transformedScore || 0;
                dMap[dom.domainName].count++;
            });
        }
    });

    const dimensionAnalysis: DimensionStat[] = Object.entries(dimensionMap)
        .map(([key, data]) => {
            const name = key.split("__")[0];
            const avgScore = data.scores.length > 0
                ? data.scores.reduce((s, v) => s + v, 0) / data.scores.length
                : 0;
            const criticalCount = data.riskCategories.filter(r => r === "ALTO" || r === "MUY_ALTO").length;
            const criticalPercent = data.riskCategories.length > 0
                ? Math.round((criticalCount / data.riskCategories.length) * 100)
                : 0;
            // Priority = weighted combination of avg score and critical percent
            const priorityScore = Math.round(avgScore * 0.6 + criticalPercent * 0.4);
            return {
                name,
                questionnaire: data.questionnaire,
                avgScore,
                count: data.scores.length,
                criticalPercent,
                priorityScore,
            };
        })
        .sort((a, b) => b.avgScore - a.avgScore);

    // Executive summary
    const uniqueWorkerIds = new Set(assessments.map(a => a.workerId));
    const allRisks = assessments
        .map(a => a.scoredResult?.overallRiskCategory)
        .filter(Boolean);
    const criticalAll = allRisks.filter((r: string) => r === "ALTO" || r === "MUY_ALTO").length;
    const criticalPercent = allRisks.length > 0 ? Math.round((criticalAll / allRisks.length) * 100) : 0;

    // Predominant risk by highest severity that has entries
    const riskCounts: Record<string, number> = {};
    allRisks.forEach((r: string) => { riskCounts[r] = (riskCounts[r] ?? 0) + 1; });
    const predominantRisk = ["MUY_ALTO", "ALTO", "MEDIO", "BAJO", "SIN_RIESGO"].find(k => (riskCounts[k] ?? 0) > 0) ?? null;

    const executiveSummary = {
        uniqueWorkers: uniqueWorkerIds.size,
        totalAssessments: assessments.length,
        intraCount: intraAssessments.length,
        extraCount: extraAssessments.length,
        stressCount: stressAssessments.length,
        criticalPercent,
        predominantRisk,
    };

    const baremos = getBaremos();
    
    const getThresholds = (domainName: string, isFormA: boolean) => {
        const formKey = isFormA ? 'intralaboral_a' : 'intralaboral_b';
        const baremosAny = baremos as any;
        const key = Object.keys(baremosAny[formKey].domains || {}).find(k => k.includes(domainName.toLowerCase().split(' ')[0]) || domainName.toLowerCase().includes(k));
        if (key && baremosAny[formKey].domains[key]) {
            const d = baremosAny[formKey].domains[key];
            return [d.sinRiesgo[1], d.bajo[1], d.medio[1], d.alto[1], d.muyAlto[1]];
        }
        return [20, 40, 60, 80, 100]; // default fallback
    };

    const formatDomains = (dMap: any, isFormA: boolean) => {
        return Object.entries(dMap).map(([name, val]: [string, any]) => ({
            name,
            average: parseFloat((val.sum / val.count).toFixed(1)),
            thresholds: getThresholds(name, isFormA)
        }));
    };

    const domainsFormaA = formatDomains(domainMapA, true);
    const domainsFormaB = formatDomains(domainMapB, false);

    const recommendations = Array.from(recommendationsSet).map(dim => {
        // match dimension string against keys in recommendations object
        const keyMatch = Object.keys(RECOMMENDED_ACTIONS).find(k => k === dim || k.replace(/_/g, ' ').toLowerCase() === dim.toLowerCase());
        const rec = keyMatch ? RECOMMENDED_ACTIONS[keyMatch as keyof typeof RECOMMENDED_ACTIONS] : "Implementar programa de vigilancia y control específico para este factor.";
        return { dimension: dim, recommendation: rec };
    });

    return {
        stats,
        stressCorrelation: correlation,
        segmentedData: { byArea: segmentedArea },
        dimensionAnalysis,
        executiveSummary,
        domainsFormaA,
        domainsFormaB,
        recommendations
    };
}
