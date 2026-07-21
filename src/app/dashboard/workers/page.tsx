"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Eye, ClipboardList, FileDown, MoreVertical, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddWorkerGlobalButton from "@/components/workers/AddWorkerGlobalButton";
import { TableSkeleton } from "@/components/ui/molecules/TableSkeleton";
import { RiskBadge, RiskLevel } from "@/components/ui/atoms/RiskBadge";

interface Worker {
    id: string;
    fullName: string;
    documentId: string;
    jobTitle: string;
    jobLevel: string;
    organization: { id: string; name: string };
    lastRisk: RiskLevel | null;
    lastDate: string | null;
    isExpired: boolean;
    isExpiring: boolean;
}

const jobLevelLabels: Record<string, string> = {
    JEFATURA: "Jefatura",
    PROFESIONAL: "Profesional",
    TECNICO: "Técnico",
    AUXILIAR: "Auxiliar",
    OPERATIVO: "Operativo",
};

export default function WorkersPage() {
    // In a real application, we would use SWR or React Query here for fetching and caching with query params.
    // For this prototype, we'll fetch all workers and handle filtering client-side or build a simple fetcher.
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeRiskFilter, setActiveRiskFilter] = useState<string>("");
    const [activeStatusFilter, setActiveStatusFilter] = useState<string>("");

    const fetchWorkers = useCallback(async () => {
        try {
            const [workersRes, orgsRes] = await Promise.all([
                fetch("/api/workers"),
                fetch("/api/organizations")
            ]);

            if (workersRes.ok) {
                const data = await workersRes.json();
                setWorkers(data.data || []);
            } else {
                setWorkers([]);
            }

            if (orgsRes.ok) {
                const orgsData = await orgsRes.json();
                setOrganizations(orgsData.data || []);
            }
        } catch {
            console.error("Error fetching workers");
            setWorkers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    // Simulated Stats (in a real app, these come from backend)
    const totalWorkers = workers.length;
    const expiredCount = workers.filter(w => w.isExpired || !w.lastDate).length;
    const highRiskCount = workers.filter(w => w.lastRisk === "ALTO" || w.lastRisk === "MUY_ALTO").length;

    const quickFilters = [
        { label: "Todos", risk: "", status: "" },
        { label: "Sin Riesgo", risk: "SIN_RIESGO", status: "" },
        { label: "Bajo", risk: "BAJO", status: "" },
        { label: "Medio", risk: "MEDIO", status: "" },
        { label: "Alto", risk: "ALTO", status: "" },
        { label: "Muy Alto", risk: "MUY_ALTO", status: "" },
        { label: "Pendientes", risk: "", status: "expiring" }
    ];

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header & Compact KPIs */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground font-heading tracking-tight">Trabajadores</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-[13px] font-medium text-text-secondary">
                        <span className="flex items-center gap-1.5"><strong className="text-foreground">{loading ? "-" : totalWorkers}</strong> Registrados</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5"><strong className="text-foreground">{loading ? "-" : expiredCount}</strong> Pendientes</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5"><strong className="text-red-500">{loading ? "-" : highRiskCount}</strong> Riesgo Crítico</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <AddWorkerGlobalButton organizations={organizations} />
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <Filter className="w-4 h-4 text-text-muted flex-shrink-0 mr-2" />
                {quickFilters.map((qf, idx) => {
                    const isActive = activeRiskFilter === qf.risk && activeStatusFilter === qf.status;
                    return (
                        <button
                            key={idx}
                            onClick={() => { setActiveRiskFilter(qf.risk); setActiveStatusFilter(qf.status); }}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                                isActive 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "bg-surface text-text-secondary border-border hover:border-text-muted hover:text-text"
                            }`}
                        >
                            {qf.label}
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            {loading ? (
                <TableSkeleton columns={5} rows={8} />
            ) : workers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted py-20 text-center flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-foreground font-heading mb-2">No hay trabajadores</h2>
                    <p className="text-[14px] text-text-secondary mb-6 max-w-sm">
                        Agrega trabajadores a tus empresas para comenzar a aplicarles baterías de riesgo psicosocial.
                    </p>
                </div>
            ) : (
                <div className="w-full bg-card border-none overflow-x-auto">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-transparent border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium text-text-muted">Trabajador</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Empresa</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Cargo</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Estado Actual</th>
                                <th className="px-6 py-4 font-medium text-text-muted text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {workers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-muted/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{worker.fullName}</span>
                                            <span className="text-[11px] text-text-secondary font-mono mt-0.5">{worker.documentId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary hover:text-primary transition-colors cursor-pointer">
                                        {worker.organization.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-text">{worker.jobTitle || "—"}</span>
                                            <span className="text-[11px] text-text-muted mt-0.5">{jobLevelLabels[worker.jobLevel] || worker.jobLevel}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-1">
                                            {worker.lastRisk ? (
                                                <RiskBadge level={worker.lastRisk} showDot />
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border bg-surface-muted text-text-muted uppercase tracking-wider">
                                                    Sin evaluar
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/dashboard/workers/${worker.id}`}
                                                className="p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors"
                                                title="Ver Expediente"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/dashboard/assessments/new/manual?workerId=${worker.id}&orgId=${worker.organization.id}`}
                                                className="p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors"
                                                title="Evaluar"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                            </Link>
                                            <button
                                                className="p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors"
                                                title="Más Opciones"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
