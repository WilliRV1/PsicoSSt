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

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Mis Empresas</h1>
                    <p className="mt-1 text-sm text-muted-foreground font-medium">Gestiona las organizaciones que est&aacute;s evaluando.</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-5 h-5" />
                    Nueva Empresa
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : orgs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 text-center py-16 px-6">
                    <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-2">Sin empresas registradas</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Crea tu primera empresa para comenzar a agregar trabajadores y realizar evaluaciones psicosociales.</p>
                    <Button onClick={() => setShowModal(true)} className="mx-auto">
                        Crear Primera Empresa
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgs.map(org => (
                        <div key={org.id} className="relative group">
                            <Link
                                href={`/dashboard/organizations/${org.id}`}
                                className="flex flex-col justify-between bg-card border border-border rounded-xl p-6 hover:border-primary hover:ring-1 hover:ring-primary transition-all shadow-sm h-full"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-md border border-border">
                                            NIT: {org.nit}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{org.name}</h3>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex items-center gap-4 text-sm text-muted-foreground font-medium">
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
                                className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
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
