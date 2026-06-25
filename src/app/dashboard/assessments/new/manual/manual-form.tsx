"use client";

import { useState, useEffect, useRef } from "react";
import {
    FormType,
    QuestionnaireType,
    ItemResponses,
    DimensionScore,
    ScoredResultData
} from "@/types/battery";
import { getFormConfig } from "@/config/battery";
import { scoreQuestionnaire } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ManualFormProps {
    workerId: string;
    organizationId: string;
    hasCustomerInteraction?: boolean;
    onSuccess: (result: any) => void;
}

export default function ManualForm({ workerId, organizationId, hasCustomerInteraction = true, onSuccess }: ManualFormProps) {
    const [attendsCustomers, setAttendsCustomers] = useState<boolean>(hasCustomerInteraction);

    useEffect(() => {
        setAttendsCustomers(hasCustomerInteraction);
    }, [hasCustomerInteraction]);

    const [isBoss, setIsBoss] = useState<boolean>(true);

    const [formType, setFormType] = useState<FormType>("A");
    const [qType, setQType] = useState<QuestionnaireType>("INTRALABORAL");
    const [responsesCache, setResponsesCache] = useState<Record<QuestionnaireType, ItemResponses>>({
        INTRALABORAL: {},
        EXTRALABORAL: {},
        STRESS: {}
    });
    const responses = responsesCache[qType];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [realTimeScore, setRealTimeScore] = useState<ScoredResultData | null>(null);
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().substring(0, 10));

    const config = getFormConfig(formType, qType);
    const rawTotalItems = config?.totalItems || 0;
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Items list (1 to totalItems), filtering out omitted ones
    const items = Array.from({ length: rawTotalItems }, (_, i) => i + 1).filter(item => {
        if (qType === "INTRALABORAL") {
            const dim = config?.dimensions?.find((d: any) => d.items.includes(item));
            if (dim?.key === "demandas_emocionales" && attendsCustomers === false) {
                return false;
            }
            if (formType === "A" && dim?.key === "relacion_colaboradores" && isBoss === false) {
                return false;
            }
        }
        return true;
    });
    const totalItems = items.length;

    // Calculate real-time score when responses change
    useEffect(() => {
        if (Object.keys(responses).length > 0) {
            try {
                const score = scoreQuestionnaire(responses, formType, qType, {
                    hasCustomerInteraction: attendsCustomers,
                    jobLevel: isBoss ? "JEFATURA" : "PROFESIONAL"
                } as any);
                setRealTimeScore(score);
            } catch (e) {
                console.error(e);
            }
        }
    }, [responses, formType, qType, attendsCustomers, isBoss]);

    const handleValueChange = (item: number, value: number) => {
        if (value < 0 || value > 4) return;

        setResponsesCache(prev => ({
            ...prev,
            [qType]: {
                ...prev[qType],
                [String(item)]: value
            }
        }));

        // Auto-tab to next item if it's a fast entry (keyboard)
        if (currentIndex < totalItems - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        const maxVal = qType === 'STRESS' ? 4 : 5;
        const keyVal = parseInt(e.key);
        if (!isNaN(keyVal) && keyVal >= 1 && keyVal <= maxVal) {
            e.preventDefault();
            handleValueChange(items[index], keyVal - 1);
        } else if (e.key === "ArrowDown" || e.key === "Enter") {
            e.preventDefault();
            if (index < totalItems - 1) {
                setCurrentIndex(index + 1);
                inputRefs.current[index + 1]?.focus();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (index > 0) {
                setCurrentIndex(index - 1);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const [consentGranted, setConsentGranted] = useState(false);

    const handleSubmit = async () => {
        if (Object.keys(responses).length < totalItems) {
            setError(`Faltan ${totalItems - Object.keys(responses).length} ítems por completar.`);
            return;
        }

        if (!consentGranted) {
            setError("Debe confirmar que cuenta con el consentimiento informado firmado.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workerId,
                    organizationId,
                    formType,
                    questionnaireType: qType,
                    responses,
                    assessmentDate: new Date(assessmentDate).toISOString(),
                    hasCustomerInteraction: attendsCustomers,
                    occupationalGroup: isBoss ? "JEFATURA" : "PROFESIONAL",
                    informedConsent: {
                        consentGranted: true,
                        consentMethod: "WRITTEN",
                        consentText: "Confirmación de consentimiento físico firmado (capturado vía digitalización manual)."
                    }
                })
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.code === "INSUFFICIENT_CREDITS") {
                    setError("INSUFFICIENT_CREDITS");
                    return;
                }
                throw new Error(data.error || "Error al guardar la evaluación");
            }

            const result = await res.json();
            toast.success("Evaluación guardada exitosamente");
            onSuccess(result);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || "Error al guardar la evaluación");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-card overflow-hidden rounded-b-xl">
            {/* Header / Selector */}
            <div className="p-6 border-b border-border bg-muted">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de Cuestionario</label>
                        <select
                            value={qType}
                            onChange={(e) => {
                                setQType(e.target.value as QuestionnaireType);
                                setCurrentIndex(0);
                                setConsentGranted(false);
                            }}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm font-medium"
                        >
                            <option value="INTRALABORAL">Intralaboral</option>
                            <option value="EXTRALABORAL">Extralaboral</option>
                            <option value="STRESS">Estrés</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fecha Aplicación</label>
                        <Input
                            type="date"
                            value={assessmentDate}
                            onChange={(e) => setAssessmentDate(e.target.value)}
                            max={new Date().toISOString().substring(0, 10)}
                            className="h-9 font-medium"
                        />
                    </div>
                    {qType === "INTRALABORAL" && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forma</label>
                            <select
                                value={formType}
                                onChange={(e) => {
                                    setFormType(e.target.value as FormType);
                                    // Limpiamos intralaboral al cambiar la forma A/B
                                    setResponsesCache(prev => ({ ...prev, INTRALABORAL: {} }));
                                    setCurrentIndex(0);
                                    setConsentGranted(false);
                                }}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm font-medium"
                            >
                                <option value="A">Forma A (Jefes/Profesionales)</option>
                                <option value="B">Forma B (Auxiliares/Operativos)</option>
                            </select>
                        </div>
                    )}
                    {qType === "INTRALABORAL" && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Atiende clientes?</label>
                            <div className="flex h-9 rounded-md border border-input p-0.5 bg-muted/30">
                                <button
                                    onClick={() => setAttendsCustomers(true)}
                                    className={`flex-1 rounded text-xs font-bold transition-colors ${attendsCustomers ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    SÍ
                                </button>
                                <button
                                    onClick={() => setAttendsCustomers(false)}
                                    className={`flex-1 rounded text-xs font-bold transition-colors ${!attendsCustomers ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    )}
                    {qType === "INTRALABORAL" && formType === "A" && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Es jefe de otras personas?</label>
                            <div className="flex h-9 rounded-md border border-input p-0.5 bg-muted/30">
                                <button
                                    onClick={() => setIsBoss(true)}
                                    className={`flex-1 rounded text-xs font-bold transition-colors ${isBoss ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    SÍ
                                </button>
                                <button
                                    onClick={() => setIsBoss(false)}
                                    className={`flex-1 rounded text-xs font-bold transition-colors ${!isBoss ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="w-full lg:w-auto lg:ml-auto flex flex-col gap-2 min-w-[250px]">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progreso</span>
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{Object.keys(responses).length} / {totalItems}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full overflow-hidden bg-muted-foreground/20">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                style={{ width: `${(Object.keys(responses).length / totalItems) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
                {/* Entry Area */}
                <div className="p-6 h-[600px] overflow-y-auto lg:col-span-3 bg-muted/30 relative scroll-smooth flex flex-col gap-4">
                    {/* Legend */}
                    <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Convenciones del Cuestionario</p>
                        {qType === 'STRESS' ? (
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">1</kbd> = Siempre</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">2</kbd> = Casi siempre</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">3</kbd> = A veces</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">4</kbd> = Nunca</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">1</kbd> = Siempre</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">2</kbd> = Casi siempre</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">3</kbd> = Algunas veces</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">4</kbd> = Casi nunca</span>
                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">5</kbd> = Nunca</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${currentIndex === idx
                                    ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                                    : "border-border bg-card hover:border-indigo-300"
                                    }`}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    inputRefs.current[idx]?.focus();
                                }}
                            >
                                <span className="w-12 font-black text-muted-foreground text-lg">#{item}</span>
                                <input
                                    ref={el => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    value={responses[String(item)] !== undefined ? responses[String(item)] + 1 : ""}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    readOnly
                                    placeholder="?"
                                    className={`w-14 h-12 text-center font-black text-xl border-2 rounded-lg focus:outline-none transition-colors ${currentIndex === idx ? 'border-indigo-500 bg-card text-indigo-700 focus:ring-4 focus:ring-indigo-500/20' : 'border-border bg-muted text-foreground'}`}
                                />
                                <div className="ml-6 flex gap-2">
                                    {(qType === 'STRESS' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map(v => (
                                        <button
                                            key={v}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleValueChange(item, v - 1);
                                            }}
                                            className={`w-10 h-10 text-sm font-bold rounded-lg flex items-center justify-center transition-all ${responses[String(item)] === v - 1
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                {responses[String(item)] !== undefined && (
                                    <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-md hidden sm:block">
                                        {responses[String(item)] === 0 && "Siempre"}
                                        {responses[String(item)] === 1 && "Casi siempre"}
                                        {responses[String(item)] === 2 && (qType === 'STRESS' ? "A veces" : "Algunas veces")}
                                        {responses[String(item)] === 3 && (qType === 'STRESS' ? "Nunca" : "Casi nunca")}
                                        {responses[String(item)] === 4 && "Nunca"}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Result Area */}
                <div className="p-6 flex flex-col lg:col-span-2 bg-card">
                    <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2 border-b border-border pb-4">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Puntuación en Tiempo Real
                    </h3>

                    {realTimeScore ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            {/* Total Risk Card */}
                            <div className="p-5 rounded-xl border border-border shadow-sm bg-muted">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Riesgo Total Estimado</span>
                                <div className="flex items-end justify-between">
                                    <span className={`text-2xl font-black px-3 py-1 rounded-md ${realTimeScore.total.riskCategory === "MUY_ALTO" ? "bg-red-100 text-red-700" :
                                        realTimeScore.total.riskCategory === "ALTO" ? "bg-orange-100 text-orange-700" :
                                            realTimeScore.total.riskCategory === "MEDIO" ? "bg-yellow-100 text-yellow-700" :
                                                realTimeScore.total.riskCategory === "BAJO" ? "bg-emerald-100 text-emerald-700" :
                                                    "bg-teal-100 text-teal-700"
                                        }`}>
                                        {realTimeScore.total.riskCategory.replace("_", " ")}
                                    </span>
                                    <div className="text-right">
                                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider block">Puntaje</span>
                                        <span className="text-foreground text-lg font-black">{realTimeScore.total.transformedScore.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dimension Breakdown */}
                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.values(realTimeScore.dimensions)
                                    .filter(d => d.itemCount > 0)
                                    .map(dim => (
                                        <div key={dim.dimensionKey} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-xs font-bold text-foreground">
                                                <span className="truncate pr-2">{dim.dimensionName}</span>
                                                <span className={`flex-shrink-0 px-2 py-0.5 rounded ${dim.riskCategory === "MUY_ALTO" ? "bg-red-50 text-red-600" :
                                                    dim.riskCategory === "ALTO" ? "bg-orange-50 text-orange-600" :
                                                        "bg-muted text-muted-foreground"
                                                    }`}>{dim.riskCategory.replace("_", " ")}</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                                                <div
                                                    className={`h-full transition-all duration-500 ${dim.riskCategory === "MUY_ALTO" ? "bg-red-500" :
                                                        dim.riskCategory === "ALTO" ? "bg-orange-500" :
                                                            dim.riskCategory === "MEDIO" ? "bg-yellow-500" :
                                                                "bg-emerald-500"
                                                        }`}
                                                    style={{ width: `${dim.transformedScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-6 border-t border-border">
                                {/* Consent Checkbox */}
                                {Object.keys(responses).length >= totalItems && (
                                    <div className="mb-5 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 transition-all animate-in fade-in slide-in-from-bottom-2">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={consentGranted}
                                                    onChange={(e) => setConsentGranted(e.target.checked)}
                                                    className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground group-hover:text-indigo-700 transition-colors">Consentimiento Informado</span>
                                                <span className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                                                    Confirmo bajo mi responsabilidad profesional que el trabajador ha firmado el <strong>Consentimiento Informado</strong> físico.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2 font-medium">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        {error === "INSUFFICIENT_CREDITS" ? (
                                            <span>
                                                No tienes créditos suficientes.{" "}
                                                <a href="/dashboard/credits" className="underline font-bold hover:text-red-900">
                                                    Comprar créditos →
                                                </a>
                                            </span>
                                        ) : error}
                                    </div>
                                )}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || Object.keys(responses).length < totalItems || !consentGranted}
                                    className="w-full py-4 text-base shadow-md shadow-indigo-200"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    Finalizar y Guardar Evaluación
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-4 font-medium flex items-center justify-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px] text-muted-foreground">0</kbd> a <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px] text-muted-foreground">{qType === 'STRESS' ? '3' : '4'}</kbd> para ingreso rápido
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted">
                            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="font-medium">Comienza a ingresar puntajes para ver el análisis de riesgo automático.</p>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
