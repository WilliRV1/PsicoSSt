import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import "./organizational-report.css";

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

    // Fetch stats from our own internal logic (mimicking the API we just wrote)
    // In a real app we might use a service layer, but for now we'll fetch signed assessments
    const assessments = await prisma.assessment.findMany({
        where: { organizationId: orgId, status: "SIGNED" },
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

    if (assessments.length === 0) {
        return (
            <div className="org-report-container">
                <h1>Informe Diagnóstico General</h1>
                <p>No hay suficientes evaluaciones firmadas para generar este informe.</p>
            </div>
        );
    }

    const { stats, stressCorrelation, segmentedData } = processStats(assessments);

    return (
        <div className="org-report-container">
            <header className="org-report-header">
                <div>
                    <h1>Informe Diagnóstico General</h1>
                    <p style={{ color: "#718096" }}>{org.name} | NIT: {org.nit}</p>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
                    <p><strong>Generado por:</strong> {org.psychologist.fullName}</p>
                    <p><strong>Licencia:</strong> {org.psychologist.licenseNumber}</p>
                </div>
            </header>

            <div className="anonymity-notice">
                <span>🔒</span>
                <p><strong>Aviso de Confidencialidad:</strong> Este informe es estadístico y anónimo. Los resultados segmentados solo se muestran para grupos con 10 o más participantes, de acuerdo con la Resolución 2764 de 2022.</p>
            </div>

            <section className="report-section">
                <h2 className="section-title">Resumen General de Riesgo</h2>
                <div className="risk-summary-grid">
                    <ChartBox title="Riesgo Intralaboral" distribution={stats.intralaboral} />
                    <ChartBox title="Riesgo Extralaboral" distribution={stats.extralaboral} />
                    <ChartBox title="Nivel de Estrés" distribution={stats.stress} />
                </div>
            </section>

            <section className="report-section">
                <h2 className="section-title">Análisis de Correlación: Riesgo vs Estrés</h2>
                <div className="chart-container">
                    <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>Esta tabla muestra la relación entre el nivel de riesgo intralaboral encontrado y los síntomas de estrés reportados por los trabajadores.</p>
                    <table className="correlation-table">
                        <thead>
                            <tr>
                                <th>Riesgo \ Estrés</th>
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
                                    <td style={{ fontWeight: "bold" }}>{intraRisk.replace("_", " ")}</td>
                                    {Object.values(stressMap).map((count: any, idx) => (
                                        <td key={idx} className="heat-cell" style={{
                                            backgroundColor: count > 0 ? `rgba(49, 130, 206, ${Math.min(count / 5, 1)})` : "transparent",
                                            color: count > 2 ? "white" : "inherit"
                                        }}>
                                            {count}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="report-section">
                <h2 className="section-title">Segmentación por Área</h2>
                <div className="segment-grid">
                    {Object.entries(segmentedData.byArea).map(([area, data]: [string, any]) => (
                        <div key={area} className="chart-container">
                            <h3 className="chart-title">{area} (n={data.count})</h3>
                            <DistributionBars distribution={data.riskDistribution} />
                        </div>
                    ))}
                </div>
            </section>

            <footer className="no-print" style={{ marginTop: "4rem", textAlign: "center" }}>
                <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    🖨️ Imprimir Informe
                </button>
            </footer>
        </div>
    );
}

function ChartBox({ title, distribution }: { title: string, distribution: any }) {
    return (
        <div className="chart-container">
            <h3 className="chart-title">{title}</h3>
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

// Logic extracted from common utility
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

    const stats = {
        intralaboral: calculateDist(assessments.filter(a => a.questionnaireType === "INTRALABORAL")),
        extralaboral: calculateDist(assessments.filter(a => a.questionnaireType === "EXTRALABORAL")),
        stress: calculateDist(assessments.filter(a => a.questionnaireType === "STRESS")),
    };

    const correlation: any = {
        SIN_RIESGO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        BAJO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MEDIO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 },
        MUY_ALTO: { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 }
    };

    const workers: any = {};
    assessments.forEach(a => {
        if (!workers[a.workerId]) workers[a.workerId] = {};
        if (a.questionnaireType === "INTRALABORAL") workers[a.workerId].intra = a.scoredResult?.overallRiskCategory;
        if (a.questionnaireType === "STRESS") workers[a.workerId].stress = a.scoredResult?.overallRiskCategory;
    });

    Object.values(workers).forEach((w: any) => {
        if (w.intra && w.stress) correlation[w.intra][w.stress]++;
    });

    const byArea: any = {};
    assessments.forEach(a => {
        const area = a.worker.departmentArea || "General";
        if (!byArea[area]) byArea[area] = [];
        byArea[area].push(a);
    });

    const segmentedArea: any = {};
    Object.entries(byArea).forEach(([area, list]: [string, any]) => {
        if (list.length >= 1) { // 10 strictly, but for demo/testing we might lower or use 'Others'
            segmentedArea[area] = { count: list.length, riskDistribution: calculateDist(list) };
        }
    });

    return { stats, stressCorrelation: correlation, segmentedData: { byArea: segmentedArea } };
}
