"use client";

import { useState } from "react";
import { Loader2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

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

interface CreateOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        nit: "",
        economicSector: "",
        city: "",
        department: "",
        employeeCount: ""
    });

    if (!isOpen) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al crear la empresa");
            }

            toast.success("Empresa creada exitosamente");
            setForm({ name: "", nit: "", economicSector: "", city: "", department: "", employeeCount: "" });
            onSuccess();
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-card rounded-[20px] w-full max-w-lg shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Nueva Empresa</h2>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium flex items-start gap-2">
                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                Nombre de la empresa *
                                <FormTooltip text="La razón social completa y oficial de la organización." />
                            </Label>
                            <Input
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ej: TechSolutions S.A.S."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                NIT *
                                <FormTooltip text="Número de Identificación Tributaria (sin dígito de verificación)." />
                            </Label>
                            <Input
                                required
                                value={form.nit}
                                onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                                placeholder="Ej: 900.123.456-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ciudad</Label>
                                <Input
                                    value={form.city}
                                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                    placeholder="Ej: Bogot&aacute;"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Departamento</Label>
                                <Input
                                    value={form.department}
                                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                    placeholder="Ej: Cundinamarca"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    Sector Económico
                                    <FormTooltip text="Actividad económica principal (ej. Comercio, Agricultura, Servicios, Industria)." />
                                </Label>
                                <Input
                                    value={form.economicSector}
                                    onChange={e => setForm(f => ({ ...f, economicSector: e.target.value }))}
                                    placeholder="Ej: Tecnología"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    N.º Empleados
                                    <FormTooltip text="Cantidad total aproximada de trabajadores directos en la empresa." />
                                </Label>
                                <Input
                                    type="number"
                                    value={form.employeeCount}
                                    onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))}
                                    placeholder="Ej: 150"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { onClose(); setError(null); }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Guardando...
                                    </>
                                ) : "Crear Empresa"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
