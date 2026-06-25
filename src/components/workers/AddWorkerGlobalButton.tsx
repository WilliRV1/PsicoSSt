"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { WorkerFormFields, EMPTY_WORKER_FORM } from "@/components/workers/WorkerFormFields";

interface Organization {
    id: string;
    name: string;
}

interface Props {
    organizations: Organization[];
}

export default function AddWorkerGlobalButton({ organizations }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_WORKER_FORM });
    const [selectedOrgId, setSelectedOrgId] = useState("");

    const handleSave = async () => {
        if (!selectedOrgId) {
            setError("Debe seleccionar una empresa a la cual añadir el trabajador.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/workers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, organizationId: selectedOrgId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar");
            }
            setShowModal(false);
            setForm({ ...EMPTY_WORKER_FORM });
            setSelectedOrgId("");
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Plus className="h-4 w-4" />
                Añadir Trabajador
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-4xl rounded-xl shadow-lg flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h3 className="text-lg font-semibold text-foreground">Añadir Nuevo Trabajador</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1">
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="mb-6 p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg">
                                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                                    Empresa a la que pertenece *
                                </label>
                                <select
                                    required
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="">-- Seleccione una empresa --</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <WorkerFormFields form={form} setForm={setForm} organizationId={selectedOrgId} />
                        </div>

                        <div className="border-t border-border p-4 flex justify-end gap-3 bg-muted/20">
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar Trabajador"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
