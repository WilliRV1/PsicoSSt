"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Users, ClipboardList, CheckCircle2, Clock, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import RiskDistributionChart from "./risk-distribution-chart";
import AssessmentsByMonthChart, { MonthlyData } from "./assessments-by-month-chart";

interface OrgSummary {
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

interface OrgMonthlyData {
    orgId: string;
    monthly: MonthlyData[];
}

interface Props {
    orgs: OrgSummary[];
    orgMonthly: OrgMonthlyData[];
}

export default function OrgDetailPanel({ orgs, orgMonthly }: Props) {
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    const selectedOrg = orgs.find(o => o.id === selectedOrgId);
    const selectedMonthly = orgMonthly.find(o => o.orgId === selectedOrgId)?.monthly ?? [];
    const totalRisk = selectedOrg?.riskDistribution.reduce((s, r) => s + r.count, 0) ?? 0;

    return (
        <div className="space-y-4">
            {/* Org selector */}
            <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger className="w-72">
                        <SelectValue placeholder="Selecciona una empresa..." />
                    </SelectTrigger>
                    <SelectContent>
                        {orgs.map(org => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Detail panel */}
            {selectedOrg && (
                <div className="space-y-4 animate-in fade-in-0 duration-200">
                    {/* Metric cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: "Trabajadores", value: selectedOrg.workerCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Evaluaciones", value: selectedOrg.totalAssessments, icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50" },
                            { label: "Firmados", value: selectedOrg.signed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                            { label: "Pendientes", value: selectedOrg.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Críticos", value: selectedOrg.criticalCount, icon: AlertTriangle, color: selectedOrg.criticalCount > 0 ? "text-red-600" : "text-muted-foreground", bg: selectedOrg.criticalCount > 0 ? "bg-red-50" : "bg-muted" },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className="rounded-lg border border-border bg-card p-3 text-center">
                                <div className={`mx-auto mb-1.5 w-8 h-8 rounded-md flex items-center justify-center ${bg}`}>
                                    <Icon className={`h-4 w-4 ${color}`} />
                                </div>
                                <p className="text-xl font-bold text-foreground">{value}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Distribución de Riesgo</h4>
                            <RiskDistributionChart data={selectedOrg.riskDistribution.filter(r => r.count > 0)} total={totalRisk} />
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Evaluaciones por Mes</h4>
                            <AssessmentsByMonthChart data={selectedMonthly} />
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex gap-3">
                        <Link
                            href={`/dashboard/organizations/${selectedOrg.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Ver detalle de empresa
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                            href={`/dashboard/organizations/${selectedOrg.id}/reports/diagnostic`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Ver informe diagnóstico
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            )}

            {!selectedOrgId && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Selecciona una empresa para ver sus gráficas detalladas.
                </p>
            )}
        </div>
    );
}
