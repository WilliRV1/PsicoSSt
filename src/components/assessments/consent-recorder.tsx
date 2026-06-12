"use client";
import { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type ConsentMethod = "VERBAL" | "WRITTEN" | "DIGITAL";

export default function ConsentRecorder({
    assessmentId,
    hasConsent,
    onConsented,
}: {
    assessmentId: string;
    hasConsent: boolean;
    onConsented?: () => void;
}) {
    const [recorded, setRecorded] = useState(false);
    const [open, setOpen] = useState(false);
    const [consentMethod, setConsentMethod] = useState<ConsentMethod>("VERBAL");
    const [submitting, setSubmitting] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const isConsented = hasConsent || recorded;

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/consent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ consentMethod }),
            });
            if (!res.ok) throw new Error("Error registrando consentimiento");
            setOpen(false);
            setRecorded(true);
            onConsented?.();
        } catch {
            alert("Error al registrar el consentimiento");
        } finally {
            setSubmitting(false);
        }
    };

    if (isConsented) {
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Consentimiento registrado
            </span>
        );
    }

    return (
        <div className="relative inline-flex items-center gap-2" ref={popoverRef}>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Sin consentimiento
            </span>
            <button
                onClick={() => setOpen((v) => !v)}
                className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
                Registrar
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 rounded-xl border border-border bg-background shadow-lg p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                        Registrar Consentimiento Informado
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        El psicólogo certifica que obtuvo el consentimiento informado del trabajador antes de la aplicación.
                    </p>

                    <label className="block text-xs font-medium text-foreground mb-1">
                        Método
                    </label>
                    <select
                        value={consentMethod}
                        onChange={(e) => setConsentMethod(e.target.value as ConsentMethod)}
                        className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="VERBAL">Verbal (presencial)</option>
                        <option value="WRITTEN">Escrito (firmado por trabajador)</option>
                        <option value="DIGITAL">Digital (firma electrónica)</option>
                    </select>

                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={() => setOpen(false)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Guardando..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
