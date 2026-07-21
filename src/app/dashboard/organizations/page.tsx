"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Eye, MoreVertical, ClipboardList, FileDown, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";
import { TableSkeleton } from "@/components/ui/molecules/TableSkeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Organization {
    id: string;
    name: string;
    nit: string;
    city: string | null;
    department: string | null;
    workersCount: number;
    evaluationsCount: number;
    healthScore: number;
    healthLabel: string;
    trend: string;
    trendDirection: "up" | "down" | "flat";
    lastActivity: string;
    pendingInterventions: number;
    highRiskCount: number;
}

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchOrgs = useCallback(async () => {
        try {
            const res = await fetch("/api/organizations");
            const data = await res.json();
            setOrgs(data.data || []);
        } catch {
            console.error("Error fetching organizations");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const formatLastActivity = (dateString: string) => {
        if (!dateString) return "—";
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground font-heading tracking-tight">Empresas</h1>
                    <p className="mt-1 text-[14px] text-text-secondary">
                        {loading ? "Cargando operaciones..." : `${orgs.length} empresa${orgs.length === 1 ? '' : 's'} en monitoreo continuo`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Empresa
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <TableSkeleton columns={7} rows={6} />
            ) : orgs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted text-center py-20 px-6 shadow-sm flex flex-col items-center">
                    <h2 className="text-lg font-semibold text-foreground font-heading mb-2">No tienes empresas registradas</h2>
                    <p className="text-[14px] text-text-secondary mb-6 max-w-sm">Crea tu primera empresa para comenzar a analizar riesgos psicosociales y proteger la salud de sus trabajadores.</p>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Primera Empresa
                    </Button>
                </div>
            ) : (
                <div className="w-full bg-card border-none overflow-hidden">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-transparent border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium text-text-muted">Empresa</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Trabajadores</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Health Score</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Riesgo Crítico</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Intervenciones</th>
                                <th className="px-6 py-4 font-medium text-text-muted">Última Actividad</th>
                                <th className="px-6 py-4 font-medium text-text-muted text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orgs.map((org) => {
                                const isHealthy = org.healthScore > 80;
                                const isCritical = org.healthScore <= 50;

                                return (
                                    <tr key={org.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Link href={`/dashboard/organizations/${org.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                    {org.name}
                                                </Link>
                                                <span className="text-[11px] text-text-secondary font-mono mt-0.5">NIT: {org.nit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                            {org.workersCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isHealthy ? 'text-green-500' : isCritical ? 'text-red-500' : 'text-yellow-500'}`}>
                                                        {org.healthScore}
                                                    </span>
                                                    <span className="text-[11px] text-text-secondary">{org.healthLabel}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {org.trendDirection === "up" ? (
                                                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                                                    ) : org.trendDirection === "down" ? (
                                                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                                                    ) : (
                                                        <Minus className="w-3 h-3 text-text-muted" />
                                                    )}
                                                    <span className={`text-[11px] font-medium ${org.trendDirection === "up" ? 'text-green-500' : org.trendDirection === "down" ? 'text-red-500' : 'text-text-muted'}`}>
                                                        {org.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {org.highRiskCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full text-[11px]">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    {org.highRiskCount} Casos
                                                </span>
                                            ) : (
                                                <span className="text-text-muted text-[12px]">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                            {org.pendingInterventions > 0 ? `${org.pendingInterventions} activas` : "—"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                            {formatLastActivity(org.lastActivity)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/organizations/${org.id}`}
                                                    className="p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors"
                                                    title="Ver Expediente"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/reports?orgId=${org.id}`}
                                                    className="p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors"
                                                    title="Generar PDF General"
                                                >
                                                    <FileDown className="w-4 h-4" />
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateOrganizationModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                onSuccess={() => {
                    setShowModal(false);
                    fetchOrgs();
                }} 
            />
        </div>
    );
}
