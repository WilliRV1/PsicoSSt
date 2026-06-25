"use client";

import React, { useState } from "react";
import { PenLine, X, Loader2 } from "lucide-react";
import { WorkerFormFields, EMPTY_WORKER_FORM } from "@/components/workers/WorkerFormFields";

export default function EditWorkerProfileButton({ worker }: { worker: any }) {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...EMPTY_WORKER_FORM });

    const openModal = () => {
        setForm({
            id: worker.id,
            documentType: worker.documentType || "CC",
            documentId: worker.documentId || "",
            fullName: worker.fullName || "",
            gender: worker.gender || "",
            birthDate: worker.birthDate ? worker.birthDate.substring(0, 10) : "",
            birthYear: worker.birthYear ? String(worker.birthYear) : "",
            maritalStatus: worker.maritalStatus || "",
            educationLevel: worker.educationLevel || "",
            profession: worker.profession || "",
            residenceCity: worker.residenceCity || "",
            residenceDepartment: worker.residenceDepartment || "",
            socioeconomicStratum: worker.socioeconomicStratum ? String(worker.socioeconomicStratum) : "",
            housingType: worker.housingType || "",
            dependentsCount: worker.dependentsCount !== null ? String(worker.dependentsCount) : "",
            freeTimeUsage: worker.freeTimeUsage || [],
            yearsInCompany: worker.yearsInCompany !== null ? String(worker.yearsInCompany) : "",
            lessThanOneYearInCompany: worker.lessThanOneYearInCompany || false,
            jobTitle: worker.jobTitle || "",
            jobLevel: worker.jobLevel || "",
            departmentArea: worker.departmentArea || "",
            contractType: worker.contractType || "",
            hoursPerDay: worker.hoursPerDay || "",
            hoursPerWeek: worker.hoursPerWeek || "",
            paymentModality: worker.paymentModality || "",
            yearsInPosition: worker.yearsInPosition !== null ? String(worker.yearsInPosition) : "",
            lessThanOneYearInPosition: worker.lessThanOneYearInPosition || false,
            workCity: worker.workCity || "",
            workDepartment: worker.workDepartment || "",
            transportMeans: worker.transportMeans || "",
            displacementTime: worker.displacementTime !== null ? String(worker.displacementTime) : "",
            hasCustomerInteraction: worker.hasCustomerInteraction ?? true
        });
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/workers/${worker.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al actualizar el trabajador");
            }
            setShowModal(false);
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
                onClick={openModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
                <PenLine className="h-4 w-4" />
                Editar Trabajador
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-background w-full max-w-4xl rounded-xl shadow-lg flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h3 className="text-lg font-semibold text-foreground">Editar Trabajador</h3>
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

                            <WorkerFormFields form={form} setForm={setForm} organizationId={worker.organizationId} />
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
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
