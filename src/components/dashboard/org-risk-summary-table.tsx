"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const RISK_ORDER = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const RISK_DOT: Record<string, string> = {
    SIN_RIESGO: "bg-green-500",
    BAJO: "bg-lime-500",
    MEDIO: "bg-yellow-400",
    ALTO: "bg-orange-500",
    MUY_ALTO: "bg-red-500",
};

const RISK_BADGE: Record<string, string> = {
    SIN_RIESGO: "bg-green-100 text-green-800",
    BAJO: "bg-lime-100 text-lime-800",
    MEDIO: "bg-yellow-100 text-yellow-800",
    ALTO: "bg-orange-100 text-orange-800",
    MUY_ALTO: "bg-red-100 text-red-800",
};

export interface OrgSummary {
    id: string;
    name: string;
    workerCount: number;
    totalAssessments: number;
    signed: number;
    pending: number;
    criticalCount: number;
    predominantRisk: string | null;
    riskDistribution: { key: string; count: number }[];
}

interface Props {
    orgs: OrgSummary[];
}

export default function OrgRiskSummaryTable({ orgs }: Props) {
    if (orgs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-6">
                Crea una empresa para ver las métricas aquí.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-border">
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 text-left font-semibold" title="Nombre de la empresa u organización.">Empresa</th>
                        <th className="py-2.5 px-3 text-center font-semibold" title="Cantidad total de trabajadores registrados en esta empresa.">Trabajadores</th>
                        <th className="py-2.5 px-3 text-center font-semibold" title="Cantidad de evaluaciones ya procesadas y calculadas.">Evaluaciones</th>
                        <th className="py-2.5 px-3 text-center font-semibold" title="Nivel de riesgo más frecuente entre las evaluaciones realizadas.">Riesgo Predominante</th>
                        <th className="py-2.5 px-3 text-left font-semibold" title="Gráfico de distribución que muestra cuántos trabajadores están en cada nivel de riesgo (verde=bajo, rojo=alto, etc).">Distribución</th>
                        <th className="py-2.5 px-3 text-center font-semibold" title="Evaluaciones que aún no se han realizado a trabajadores registrados.">Pendientes</th>
                        <th className="py-2.5 px-1 text-center font-semibold" title="Número de trabajadores detectados con Riesgo Muy Alto.">Crítico</th>
                        <th className="py-2.5 px-3 text-right font-semibold"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {orgs.map(org => {
                        const totalRisk = org.riskDistribution.reduce((s, r) => s + r.count, 0);
                        const hasCritical = org.criticalCount > 0;

                        return (
                            <tr key={org.id} className="hover:bg-muted/30 transition-colors group">
                                {/* Name */}
                                <td className="py-3 pr-2">
                                    <span className="font-medium text-foreground line-clamp-1">{org.name}</span>
                                </td>

                                {/* Workers */}
                                <td className="py-3 px-3 text-center text-muted-foreground">
                                    {org.workerCount}
                                </td>

                                {/* Assessments */}
                                <td className="py-3 px-3 text-center">
                                    {org.totalAssessments > 0 ? (
                                        <span className="font-semibold text-foreground">{org.totalAssessments}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>

                                {/* Predominant risk badge */}
                                <td className="py-3 px-3 text-center">
                                    {org.predominantRisk ? (
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${RISK_BADGE[org.predominantRisk] ?? "bg-muted text-muted-foreground"}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT[org.predominantRisk] ?? "bg-gray-400"}`} />
                                            {RISK_LABELS[org.predominantRisk]}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sin datos</span>
                                    )}
                                </td>

                                {/* Mini bar distribution */}
                                <td className="py-3 px-3">
                                    {totalRisk > 0 ? (
                                        <div className="flex h-4 w-28 rounded-full overflow-hidden gap-px">
                                            {RISK_ORDER.map(key => {
                                                const found = org.riskDistribution.find(r => r.key === key);
                                                const count = found?.count ?? 0;
                                                if (count === 0) return null;
                                                const pct = (count / totalRisk) * 100;
                                                return (
                                                    <div
                                                        key={key}
                                                        title={`${RISK_LABELS[key]}: ${count}`}
                                                        className={`h-full ${RISK_DOT[key]}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-4 w-28 rounded-full bg-muted" />
                                    )}
                                </td>

                                {/* Pending */}
                                <td className="py-3 px-3 text-center">
                                    {org.pending > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                            <Clock className="h-3 w-3" />
                                            {org.pending}
                                        </span>
                                    ) : org.totalAssessments > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3" /> Al día
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                </td>

                                {/* Critical */}
                                <td className="py-3 px-1 text-center">
                                    {hasCritical ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                            <AlertTriangle className="h-3 w-3" />
                                            {org.criticalCount}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </td>

                                {/* Link */}
                                <td className="py-3 px-3 text-right">
                                    <Link
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Ver <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
