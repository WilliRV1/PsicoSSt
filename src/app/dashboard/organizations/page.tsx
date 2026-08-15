"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Eye, AlertTriangle, Clock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";
import { TableSkeleton } from "@/components/ui/molecules/TableSkeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type ComplianceStatus = "vencida" | "por_vencer" | "sin_evaluar" | "vigente";

const complianceCfg: Record<ComplianceStatus, { label: string; cls: string; icon: React.FC<any> }> = {
    vencida:    { label: "Vencida",     cls: "bg-red-100 text-red-700 border-red-200",       icon: AlertTriangle },
    por_vencer: { label: "Por vencer",  cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    sin_evaluar:{ label: "Sin evaluar", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: Users },
    vigente:    { label: "Vigente",     cls: "bg-teal-50 text-teal-700 border-teal-200",     icon: CheckCircle2 },
};

interface Organization {
    id: string;
    name: string;
    nit: string;
    city: string | null;
    department: string | null;
    workersCount: number;
    evaluatedWorkers: number;
    criticalWorkers: number;
    pendingSignatures: number;
    complianceStatus: ComplianceStatus;
    expiryDate: string | null;
    daysLeft: number | null;
    lastActivity: string;
    pendingInterventions: number;
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
                        {loading ? "Cargando..." : `${orgs.length} empresa${orgs.length === 1 ? '' : 's'} registrada${orgs.length === 1 ? '' : 's'}`}
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Empresa
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <TableSkeleton columns={6} rows={6} />
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
                <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Cumplimiento</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Evaluados</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Riesgo crítico</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Sin firmar</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider">Última actividad</th>
                                <th className="px-6 py-3.5 font-semibold text-text-muted text-[11px] uppercase tracking-wider text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orgs.map((org) => {
                                const cfg = complianceCfg[org.complianceStatus] ?? complianceCfg.sin_evaluar;
                                const Icon = cfg.icon;

                                return (
                                    <tr key={org.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Link href={`/dashboard/organizations/${org.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                    {org.name}
                                                </Link>
                                                <span className="text-[11px] text-text-secondary font-mono mt-0.5">
                                                    NIT: {org.nit}{org.city ? ` · ${org.city}` : ""}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
                                                <Icon className="w-3 h-3" />
                                                {cfg.label}
                                            </span>
                                            {org.daysLeft !== null && org.daysLeft >= 0 && org.daysLeft <= 90 && (
                                                <p className="text-[11px] text-amber-600 font-medium mt-0.5">{org.daysLeft} días</p>
                                            )}
                                            {org.daysLeft !== null && org.daysLeft < 0 && (
                                                <p className="text-[11px] text-red-600 font-medium mt-0.5">Vencida hace {Math.abs(org.daysLeft)} días</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-foreground">{org.evaluatedWorkers}</span>
                                            <span className="text-text-muted"> / {org.workersCount}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {org.criticalWorkers > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full text-[11px] border border-red-200">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    {org.criticalWorkers}
                                                </span>
                                            ) : (
                                                <span className="text-text-muted text-[12px]">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {org.pendingSignatures > 0 ? (
                                                <span className="text-amber-600 font-semibold">{org.pendingSignatures}</span>
                                            ) : (
                                                <span className="text-text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                            {formatLastActivity(org.lastActivity)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                href={`/dashboard/organizations/${org.id}`}
                                                className="inline-flex items-center gap-1.5 p-1.5 rounded text-text-secondary hover:text-foreground hover:bg-surface-muted transition-colors opacity-60 hover:opacity-100"
                                                title="Ver empresa"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
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
