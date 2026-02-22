import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const riskColors: Record<string, string> = {
    SIN_RIESGO: "#22c55e",
    BAJO: "#84cc16",
    MEDIO: "#eab308",
    ALTO: "#f97316",
    MUY_ALTO: "#ef4444"
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
    STRESS: "Estrés"
};

export default async function AssessmentsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const assessments = await prisma.assessment.findMany({
        where: {
            psychologistId: session.user.id,
            status: { in: ["COMPLETED", "SCORED", "REVIEWED", "SIGNED"] }
        },
        include: {
            worker: {
                select: {
                    fullName: true,
                    documentId: true,
                    jobTitle: true,
                    jobLevel: true
                }
            },
            organization: {
                select: { name: true }
            },
            scoredResult: {
                select: {
                    overallRiskCategory: true,
                    totalScores: true
                }
            }
        },
        orderBy: { assessmentDate: "desc" },
        take: 100
    });

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <Link href="/dashboard" style={{ color: "#6366f1", textDecoration: "none", fontSize: "0.875rem" }}>
                        ← Volver al Dashboard
                    </Link>
                    <h1 style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 700, color: "#1e293b" }}>
                        Evaluaciones Completadas
                    </h1>
                    <p style={{ color: "#64748b", margin: "0.25rem 0 0" }}>
                        {assessments.length} evaluación{assessments.length !== 1 ? "es" : ""} encontrada{assessments.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {assessments.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1"
                }}>
                    <p style={{ fontSize: "1.125rem", color: "#64748b", margin: 0 }}>
                        No hay evaluaciones completadas aún.
                    </p>
                    <Link href="/dashboard/assessments/new/manual" style={{
                        display: "inline-block",
                        marginTop: "1rem",
                        padding: "0.75rem 1.5rem",
                        background: "#6366f1",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 600
                    }}>
                        Digitalizar Primera Evaluación
                    </Link>
                </div>
            ) : (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                <th style={thStyle}>Trabajador</th>
                                <th style={thStyle}>Organización</th>
                                <th style={thStyle}>Cuestionario</th>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Riesgo Total</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map((assessment) => {
                                const risk = assessment.scoredResult?.overallRiskCategory || "SIN_RIESGO";
                                const totalScores = assessment.scoredResult?.totalScores as any;
                                const transformedScore = totalScores?.transformedScore;

                                return (
                                    <tr key={assessment.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                                {assessment.worker.fullName}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                                {assessment.worker.documentId}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: "#475569" }}>{assessment.organization.name}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                display: "inline-block",
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "9999px",
                                                fontSize: "0.8rem",
                                                fontWeight: 600,
                                                background: "#eef2ff",
                                                color: "#4f46e5"
                                            }}>
                                                {questionnaireLabels[assessment.questionnaireType] || assessment.questionnaireType}
                                                {" "}Forma {assessment.formType}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: "#475569" }}>
                                                {new Date(assessment.assessmentDate).toLocaleDateString("es-CO", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.375rem",
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "9999px",
                                                fontSize: "0.8rem",
                                                fontWeight: 700,
                                                background: riskColors[risk] + "18",
                                                color: riskColors[risk]
                                            }}>
                                                <span style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    background: riskColors[risk]
                                                }} />
                                                {riskLabels[risk]}
                                                {transformedScore !== undefined && (
                                                    <span style={{ fontWeight: 400, opacity: 0.8 }}>
                                                        ({transformedScore.toFixed(1)}%)
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center" }}>
                                            <Link
                                                href={`/dashboard/reports/${assessment.id}`}
                                                style={{
                                                    display: "inline-block",
                                                    padding: "0.5rem 1rem",
                                                    background: "#6366f1",
                                                    color: "white",
                                                    borderRadius: "6px",
                                                    textDecoration: "none",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                    transition: "background 0.2s"
                                                }}
                                            >
                                                Ver Informe
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: "0.875rem 1rem",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b"
};

const tdStyle: React.CSSProperties = {
    padding: "1rem",
    verticalAlign: "middle"
};
