"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormType, QuestionnaireType, JobLevel } from "@/types/battery";

interface Worker {
    id: string;
    fullName: string;
    documentId: string;
    organizationId: string;
    jobLevel: JobLevel;
    organization: { name: string };
}

const ALL_TYPES: { value: QuestionnaireType; label: string }[] = [
    { value: "INTRALABORAL", label: "Intralaboral" },
    { value: "EXTRALABORAL", label: "Extralaboral" },
    { value: "STRESS", label: "Estrés" },
];

function defaultFormType(jobLevel: Worker["jobLevel"]): FormType {
    return jobLevel === "AUXILIAR" || jobLevel === "OPERATIVO" ? "B" : "A";
}

export default function InviteWorkerPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [formType, setFormType] = useState<FormType>("A");
    const [plannedTypes, setPlannedTypes] = useState<QuestionnaireType[]>(["INTRALABORAL", "EXTRALABORAL", "STRESS"]);
    const [contactEmail, setContactEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!selectedWorker) inputRef.current?.focus();
    }, [selectedWorker]);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setWorkers([]);
            return;
        }
        const t = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/workers/search?q=${encodeURIComponent(searchTerm)}`);
                const data = await res.json();
                setWorkers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const selectWorker = (w: Worker) => {
        setSelectedWorker(w);
        setFormType(defaultFormType(w.jobLevel));
    };

    const toggleType = (t: QuestionnaireType) => {
        setPlannedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    };

    const handleSubmit = async () => {
        if (!selectedWorker || plannedTypes.length === 0 || !contactEmail) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/assessments/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workerId: selectedWorker.id,
                    formType,
                    plannedTypes,
                    contactEmail,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear la invitación");
            setResult({ url: data.url, expiresAt: data.expiresAt });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyLink = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (result) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4">
                <div className="w-full bg-card border border-border shadow-xl rounded-3xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                        <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Invitación enviada</h2>
                    <p className="text-sm text-muted-foreground">
                        Se envió un correo a <strong>{contactEmail}</strong> con el enlace. Guarda una copia ahora —
                        por seguridad no podrás volver a verlo en texto claro; si lo necesitas de nuevo, tendrás que
                        reenviarlo desde el listado de evaluaciones.
                    </p>
                    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3">
                        <input readOnly value={result.url} className="flex-1 bg-transparent text-xs text-foreground outline-none truncate" />
                        <button onClick={copyLink} className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors" title="Copiar enlace">
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    </div>
                    <Link href="/dashboard/assessments">
                        <Button className="w-full h-12 rounded-xl">Volver a Evaluaciones</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300">
            {!selectedWorker ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4">
                    <div className="w-full space-y-4">
                        <Link href="/dashboard/assessments" className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Volver a Evaluaciones
                        </Link>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Enviar enlace al trabajador</h1>
                            <p className="text-muted-foreground mt-2">Busca al trabajador que va a diligenciar su propia evaluación.</p>
                        </div>
                        <div className="relative shadow-xl rounded-2xl bg-card border border-border overflow-hidden">
                            <div className="flex items-center px-4 py-4 border-b border-border bg-muted/30">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Buscar trabajador..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none px-2 text-lg text-foreground placeholder:text-muted-foreground"
                                />
                                {isSearching && <span className="text-xs text-muted-foreground">Buscando...</span>}
                            </div>
                            {workers.length > 0 && (
                                <div className="max-h-[300px] overflow-y-auto">
                                    {workers.map((w) => (
                                        <div
                                            key={w.id}
                                            onClick={() => selectWorker(w)}
                                            className="px-6 py-4 cursor-pointer flex justify-between items-center hover:bg-muted transition-colors border-l-4 border-transparent"
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">{w.fullName}</p>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    CC: {w.documentId} <span className="mx-2">•</span> {w.organization.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchTerm.length >= 2 && workers.length === 0 && !isSearching && (
                                <div className="px-6 py-8 text-center text-muted-foreground">No se encontraron trabajadores.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4">
                    <div className="w-full bg-card border border-border shadow-xl rounded-3xl p-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-foreground">{selectedWorker.fullName}</h2>
                            <p className="text-muted-foreground text-sm mt-1">{selectedWorker.organization.name}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cuestionarios a incluir</label>
                            <div className="space-y-2">
                                {ALL_TYPES.map((t) => (
                                    <label key={t.value} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50">
                                        <input
                                            type="checkbox"
                                            checked={plannedTypes.includes(t.value)}
                                            onChange={() => toggleType(t.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {plannedTypes.includes("INTRALABORAL") && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forma (Intralaboral)</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as FormType)}
                                    className="w-full h-11 rounded-xl border border-input bg-muted/50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="A">Forma A (Jefaturas / Profesionales / Técnicos)</option>
                                    <option value="B">Forma B (Auxiliares / Operativos)</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Correo del trabajador</label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                className="w-full h-11 rounded-xl border border-input bg-muted/50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setSelectedWorker(null)} className="flex-1 h-12 rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || plannedTypes.length === 0 || !contactEmail}
                                className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                {isSubmitting ? "Enviando..." : "Enviar enlace"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
