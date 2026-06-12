"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, ClipboardList, TrendingUp } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
    SIN_RIESGO: "#22c55e",
    BAJO: "#84cc16",
    MEDIO: "#eab308",
    ALTO: "#f97316",
    MUY_ALTO: "#ef4444",
};

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const RISK_BG: Record<string, string> = {
    SIN_RIESGO: "bg-green-100 text-green-800",
    BAJO: "bg-lime-100 text-lime-800",
    MEDIO: "bg-yellow-100 text-yellow-800",
    ALTO: "bg-orange-100 text-orange-800",
    MUY_ALTO: "bg-red-100 text-red-800",
};

interface MetricsData {
    summary: { total: number; signed: number; pending: number; criticalCount: number };
    riskDistribution: { key: string; count: number }[];
    monthlyData: { month: string; label: string; intralaboral: number; extralaboral: number; stress: number }[];
    predominantRisk: string | null;
    workers: {
        id: string;
        fullName: string;
        jobTitle: string | null;
        assessments: {
            id: string;
            status: string;
            questionnaireType: string;
            assessmentDate: string;
            scoredResult: { overallRiskCategory: string } | null;
        }[];
    }[];
}

export default function OrgMetricsDashboard({ orgId }: { orgId: string }) {
    const [data, setData] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/organizations/${orgId}/metrics`)
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [orgId]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-40 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.summary.total === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin evaluaciones registradas para esta empresa.</p>
            </div>
        );
    }

    const { summary, riskDistribution, monthlyData, predominantRisk, workers } = data;
    const totalRisk = riskDistribution.reduce((s, r) => s + r.count, 0);
    const activeRisk = riskDistribution.filter(r => r.count > 0);
    const hasMonthlyData = monthlyData.some(m => m.intralaboral > 0 || m.extralaboral > 0 || m.stress > 0);

    const workersWithRisk = workers.filter(w => w.assessments.length > 0);

    return (
        <div className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <ClipboardList className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs text-muted-foreground font-medium">Evaluaciones</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground font-medium">Firmados</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{summary.signed}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground font-medium">Pendientes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
                </div>
                <div className={`rounded-xl border p-4 shadow-sm ${summary.criticalCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${summary.criticalCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground font-medium">Riesgo Crítico</span>
                    </div>
                    <p className={`text-2xl font-bold ${summary.criticalCount > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {summary.criticalCount}
                    </p>
                </div>
            </div>

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Risk distribution pie */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">Distribución de Riesgo</h4>
                        {predominantRisk && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RISK_BG[predominantRisk] ?? "bg-muted text-muted-foreground"}`}>
                                Predominante: {RISK_LABELS[predominantRisk]}
                            </span>
                        )}
                    </div>
                    {activeRisk.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={activeRisk.map(r => ({ name: RISK_LABELS[r.key] ?? r.key, value: r.count, key: r.key }))}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={50}
                                    outerRadius={78}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {activeRisk.map(r => (
                                        <Cell key={r.key} fill={RISK_COLORS[r.key] ?? "#94a3b8"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number | undefined) => [`${v ?? 0} (${totalRisk > 0 ? (((v ?? 0) / totalRisk) * 100).toFixed(0) : 0}%)`, "Evaluaciones"]}
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                                />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Sin datos de riesgo.</p>
                    )}
                </div>

                {/* Monthly bar chart */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Evaluaciones por Mes (6 meses)</h4>
                    {hasMonthlyData ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="intralaboral" name="Intralaboral" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="extralaboral" name="Extralaboral" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="stress" name="Estrés" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Sin evaluaciones en los últimos 6 meses.</p>
                    )}
                </div>
            </div>

            {/* Workers risk table */}
            {workersWithRisk.length > 0 && (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            Resultados por Trabajador
                        </h4>
                        <span className="text-xs text-muted-foreground">{workersWithRisk.length} con evaluaciones</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                                <tr>
                                    <th className="px-5 py-2.5 text-left font-semibold">Trabajador</th>
                                    <th className="px-5 py-2.5 text-left font-semibold">Cargo</th>
                                    <th className="px-5 py-2.5 text-center font-semibold">Intralaboral</th>
                                    <th className="px-5 py-2.5 text-center font-semibold">Extralaboral</th>
                                    <th className="px-5 py-2.5 text-center font-semibold">Estrés</th>
                                    <th className="px-5 py-2.5 text-center font-semibold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {workersWithRisk.map(worker => {
                                    const intra = worker.assessments.find(a => a.questionnaireType === "INTRALABORAL");
                                    const extra = worker.assessments.find(a => a.questionnaireType === "EXTRALABORAL");
                                    const stress = worker.assessments.find(a => a.questionnaireType === "STRESS");
                                    const anyPending = worker.assessments.some(a => a.status === "SCORED" || a.status === "REVIEWED");

                                    const RiskCell = ({ a }: { a: typeof intra }) => {
                                        if (!a) return <td className="px-5 py-3 text-center text-xs text-muted-foreground">—</td>;
                                        const risk = a.scoredResult?.overallRiskCategory ?? "SIN_RIESGO";
                                        return (
                                            <td className="px-5 py-3 text-center">
                                                <Link href={`/dashboard/reports/${a.id}`}>
                                                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${RISK_BG[risk] ?? "bg-muted text-muted-foreground"}`}>
                                                        {RISK_LABELS[risk]}
                                                    </span>
                                                </Link>
                                            </td>
                                        );
                                    };

                                    return (
                                        <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-foreground">{worker.fullName}</td>
                                            <td className="px-5 py-3 text-muted-foreground text-xs">{worker.jobTitle || "—"}</td>
                                            <RiskCell a={intra} />
                                            <RiskCell a={extra} />
                                            <RiskCell a={stress} />
                                            <td className="px-5 py-3 text-center">
                                                {anyPending ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                        <Clock className="h-3 w-3" /> Pendiente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 className="h-3 w-3" /> Firmado
                                                    </span>
                                                )}
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
