"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Psychologist {
    id: string;
    email: string;
    fullName: string;
    licenseNumber: string;
    professionalCard: string;
    sstCredential: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
    isAdmin: boolean;
    mfaEnabled: boolean;
    createdAt: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
    PENDING: { label: "Pendiente", classes: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20" },
    ACTIVE: { label: "Activo", classes: "bg-green-100 text-green-700 ring-1 ring-green-600/20" },
    SUSPENDED: { label: "Suspendido", classes: "bg-red-100 text-red-700 ring-1 ring-red-600/20" },
    INACTIVE: { label: "Inactivo", classes: "bg-muted text-muted-foreground" },
};

export function PsychologistList() {
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchPsychologists = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/psychologists");
            const data = await res.json();
            if (res.ok) {
                setPsychologists(data.data);
            } else {
                setError(data.message || "Error al cargar psicologos");
            }
        } catch (err) {
            setError("Error de conexion");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPsychologists();
    }, []);

    const handleStatusChange = async (psychologistId: string, newStatus: string) => {
        try {
            setUpdatingId(psychologistId);
            const res = await fetch("/api/admin/psychologists", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ psychologistId, status: newStatus }),
            });
            const data = await res.json();

            if (res.ok) {
                setPsychologists(prev =>
                    prev.map(p => p.id === psychologistId ? { ...p, status: data.newStatus } : p)
                );
            } else {
                alert(data.message || "Error al actualizar estado");
            }
        } catch (err) {
            alert("Error de conexion");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                Cargando profesionales...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profesional</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Licencia / Tarjeta</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {psychologists.map((p) => {
                            const status = statusConfig[p.status] || statusConfig.INACTIVE;
                            return (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground flex items-center gap-2">
                                            {p.fullName}
                                            {p.isAdmin && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary ring-1 ring-primary/20">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{p.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-foreground">{p.licenseNumber}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{p.professionalCard}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.classes}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {p.status === "PENDING" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStatusChange(p.id, "ACTIVE")}
                                                    disabled={!!updatingId}
                                                >
                                                    Aprobar
                                                </Button>
                                            )}
                                            {p.status === "ACTIVE" && !p.isAdmin && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                                    onClick={() => handleStatusChange(p.id, "SUSPENDED")}
                                                    disabled={!!updatingId}
                                                >
                                                    Suspender
                                                </Button>
                                            )}
                                            {p.status === "SUSPENDED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                    onClick={() => handleStatusChange(p.id, "ACTIVE")}
                                                    disabled={!!updatingId}
                                                >
                                                    Activar
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
