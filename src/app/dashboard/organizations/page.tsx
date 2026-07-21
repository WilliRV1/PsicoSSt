"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Building2, Users, MapPin, Loader2, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";

const FormTooltip = ({ text }: { text: string }) => (
    <Tooltip>
        <TooltipTrigger type="button" tabIndex={-1} className="ml-1 cursor-help">
            <Info className="h-4 w-4 text-gray-400 hover:text-primary transition-colors inline-block" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px]">
            <p className="text-xs font-normal leading-relaxed">{text}</p>
        </TooltipContent>
    </Tooltip>
);

interface Organization {
    id: string;
    name: string;
    nit: string;
    economicSector: string | null;
    city: string | null;
    department: string | null;
    employeeCount: number | null;
    createdAt: string;
    _count: { workers: number };
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

    const handleDeleteOrg = async (e: React.MouseEvent, org: Organization) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(`¿Eliminar la empresa "${org.name}"? Esta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch(`/api/organizations/${org.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Error al eliminar");
                return;
            }
            fetchOrgs();
        } catch {
            alert("Error al eliminar la organización");
        }
    };

    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground font-heading tracking-tight">Empresas</h1>
                    <p className="mt-1 text-sm text-text-secondary">Gestiona las organizaciones de tu workspace.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-surface-muted p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => setViewMode("cards")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                            title="Vista de Tarjetas"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </button>
                        <button 
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                            title="Vista de Tabla"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </button>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Empresa
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : orgs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted text-center py-16 px-6 shadow-sm">
                    <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Building2 className="w-8 h-8 text-text-muted" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground font-heading mb-2">Sin empresas registradas</h2>
                    <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">Crea tu primera empresa para comenzar a agregar trabajadores y realizar evaluaciones psicosociales.</p>
                    <Button onClick={() => setShowModal(true)} className="mx-auto">
                        Crear Empresa
                    </Button>
                </div>
            ) : viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgs.map(org => (
                        <div key={org.id} className="relative group">
                            <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="flex flex-col justify-between bg-card border border-border rounded-xl p-6 hover:border-primary hover:ring-1 hover:ring-primary transition-all shadow-sm h-full"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-primary/10">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <span className="px-2.5 py-1 bg-surface-muted text-text-secondary text-[10px] font-bold uppercase tracking-wider rounded-md border border-border-muted font-mono">
                                            NIT: {org.nit}
                                        </span>
                                    </div>
                                    <h3 className="text-[16px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{org.name}</h3>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex items-center gap-4 text-sm text-text-secondary font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        {org._count.workers} trab.
                                    </div>
                                    {org.city && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate max-w-[100px]">{org.city}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Delete button overlay */}
                            <button
                                onClick={(e) => handleDeleteOrg(e, org)}
                                title="Eliminar empresa"
                                className="absolute top-3 right-3 w-8 h-8 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface-muted border-b border-border">
                            <tr>
                                <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">NIT</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Ubicación</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Trabajadores</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orgs.map((org) => (
                                <tr key={org.id} className="hover:bg-surface-muted/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/dashboard/organizations/${org.id}`} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-text group-hover:text-primary transition-colors">{org.name}</span>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary font-mono text-[13px]">
                                        {org.nit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                        {org.city ? `${org.city}${org.department ? `, ${org.department}` : ''}` : "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-text-secondary border border-border">
                                            <Users className="w-3.5 h-3.5" />
                                            {org._count.workers}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/organizations/${org.id}`}
                                                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                                            >
                                                Gestionar
                                            </Link>
                                            <button
                                                onClick={(e) => handleDeleteOrg(e, org)}
                                                className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
