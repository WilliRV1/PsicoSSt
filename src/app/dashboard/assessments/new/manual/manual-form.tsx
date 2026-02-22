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

interface ManualFormProps {
    workerId: string;
    organizationId: string;
    onSuccess: (result: ScoredResultData) => void;
}

export default function ManualForm({ workerId, organizationId, onSuccess }: ManualFormProps) {
    const [formType, setFormType] = useState<FormType>("A");
    const [qType, setQType] = useState<QuestionnaireType>("INTRALABORAL");
    const [responses, setResponses] = useState<ItemResponses>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [realTimeScore, setRealTimeScore] = useState<ScoredResultData | null>(null);

    const config = getFormConfig(formType, qType);
    const totalItems = config?.totalItems || 0;
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Items list (1 to totalItems)
    const items = Array.from({ length: totalItems }, (_, i) => i + 1);

    // Calculate real-time score when responses change
    useEffect(() => {
        if (Object.keys(responses).length > 0) {
            try {
                const score = scoreQuestionnaire(responses, formType, qType);
                setRealTimeScore(score);
            } catch (e) {
                console.error(e);
            }
        }
    }, [responses, formType, qType]);

    const handleValueChange = (item: number, value: number) => {
        if (value < 0 || value > 4) return;

        setResponses(prev => ({
            ...prev,
            [String(item)]: value
        }));

        // Auto-tab to next item if it's a fast entry (keyboard)
        if (currentIndex < totalItems - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key >= "0" && e.key <= "4") {
            e.preventDefault();
            handleValueChange(items[index], parseInt(e.key));
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
                    assessmentDate: new Date().toISOString(),
                    informedConsent: {
                        consentGranted: true,
                        consentMethod: "WRITTEN",
                        consentText: "Confirmación de consentimiento físico firmado (capturado vía digitalización manual)."
                    }
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar la evaluación");
            }

            const result = await res.json();
            onSuccess(result.result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-xl shadow-lg border border-indigo-500/20 overflow-hidden" style={{ background: 'rgba(30,30,60,0.6)' }}>
            {/* ... (rest of the header/selector code remains unchanged) ... */}
            {/* Header / Selector */}
            <div className="p-6 border-b border-indigo-500/10" style={{ background: 'rgba(15,15,35,0.5)' }}>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Cuestionario</label>
                        <select
                            value={qType}
                            onChange={(e) => {
                                setQType(e.target.value as QuestionnaireType);
                                setResponses({});
                                setCurrentIndex(0);
                                setConsentGranted(false);
                            }}
                            className="border border-indigo-500/30 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5" style={{ background: 'rgba(15,15,35,0.8)' }}
                        >
                            <option value="INTRALABORAL">Intralaboral</option>
                            <option value="EXTRALABORAL">Extralaboral</option>
                            <option value="STRESS">Estrés</option>
                        </select>
                    </div>
                    {qType === "INTRALABORAL" && (
                        <div>
                            <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Forma</label>
                            <select
                                value={formType}
                                onChange={(e) => {
                                    setFormType(e.target.value as FormType);
                                    setResponses({});
                                    setCurrentIndex(0);
                                    setConsentGranted(false);
                                }}
                                className="border border-indigo-500/30 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5" style={{ background: 'rgba(15,15,35,0.8)' }}
                            >
                                <option value="A">Forma A (Jefes/Profs)</option>
                                <option value="B">Forma B (Aux/Operativos)</option>
                            </select>
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-400">Progreso:</span>
                        <div className="w-48 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,15,35,0.8)' }}>
                            <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${(Object.keys(responses).length / totalItems) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">{Object.keys(responses).length}/{totalItems}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Entry Area */}
                <div className="p-6 h-[600px] overflow-y-auto border-r border-indigo-500/10">
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center p-3 rounded-lg border transition-all ${currentIndex === idx
                                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                                    : "border-indigo-500/10 hover:border-indigo-500/30"
                                    }`}
                                style={{ background: currentIndex === idx ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    inputRefs.current[idx]?.focus();
                                }}
                            >
                                <span className="w-10 font-bold text-slate-400">#{item}</span>
                                <input
                                    ref={el => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    value={responses[String(item)] ?? ""}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    readOnly
                                    placeholder="?"
                                    className="w-12 h-10 text-center font-bold text-lg border border-indigo-500/30 rounded focus:outline-none text-slate-200" style={{ background: 'rgba(15,15,35,0.8)' }}
                                />
                                <div className="ml-4 flex gap-1">
                                    {[0, 1, 2, 3, 4].map(v => (
                                        <button
                                            key={v}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleValueChange(item, v);
                                            }}
                                            className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center transition-all ${responses[String(item)] === v
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-400 hover:text-slate-200"
                                                }`}
                                            style={responses[String(item)] === v ? {} : { background: 'rgba(15,15,35,0.6)' }}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                {responses[String(item)] !== undefined && (
                                    <span className="ml-auto text-xs font-medium text-slate-400 italic">
                                        {responses[String(item)] === 0 && "Siempre"}
                                        {responses[String(item)] === 1 && "Casi siempre"}
                                        {responses[String(item)] === 2 && "A veces"}
                                        {responses[String(item)] === 3 && "Casi nunca"}
                                        {responses[String(item)] === 4 && "Nunca"}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Result Area */}
                <div className="p-6 flex flex-col" style={{ background: 'rgba(15,15,35,0.4)' }}>
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Puntuación en Tiempo Real
                    </h3>

                    {realTimeScore ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            {/* Total Risk Card */}
                            <div className="p-5 rounded-xl border border-indigo-500/20 shadow-sm" style={{ background: 'rgba(30,30,60,0.6)' }}>
                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Riesgo Total</span>
                                <div className="flex items-end justify-between mt-1">
                                    <span className={`text-3xl font-black ${realTimeScore.total.riskCategory === "MUY_ALTO" ? "text-red-500" :
                                        realTimeScore.total.riskCategory === "ALTO" ? "text-orange-500" :
                                            realTimeScore.total.riskCategory === "MEDIO" ? "text-yellow-500" :
                                                "text-green-500"
                                        }`}>
                                        {realTimeScore.total.riskCategory.replace("_", " ")}
                                    </span>
                                    <span className="text-slate-400 text-sm font-medium">Puntaje: {realTimeScore.total.transformedScore.toFixed(1)}</span>
                                </div>
                            </div>

                            {/* Dimension Breakdown */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                                {Object.values(realTimeScore.dimensions)
                                    .filter(d => d.itemCount > 0)
                                    .map(dim => (
                                        <div key={dim.dimensionKey} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                                <span>{dim.dimensionName}</span>
                                                <span className={
                                                    dim.riskCategory === "MUY_ALTO" ? "text-red-500" :
                                                        dim.riskCategory === "ALTO" ? "text-orange-500" :
                                                            "text-slate-500"
                                                }>{dim.riskCategory.replace("_", " ")}</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,15,35,0.8)' }}>
                                                <div
                                                    className={`h-full transition-all ${dim.riskCategory === "MUY_ALTO" ? "bg-red-500" :
                                                        dim.riskCategory === "ALTO" ? "bg-orange-500" :
                                                            dim.riskCategory === "MEDIO" ? "bg-yellow-500" :
                                                                "bg-green-500"
                                                        }`}
                                                    style={{ width: `${dim.transformedScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-6 border-t border-indigo-500/10">
                                {/* Consent Checkbox */}
                                {Object.keys(responses).length >= totalItems && (
                                    <div className="mb-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 transition-all animate-in fade-in slide-in-from-bottom-2">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={consentGranted}
                                                onChange={(e) => setConsentGranted(e.target.checked)}
                                                className="mt-1 w-5 h-5 rounded border-indigo-500/50 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Consentimiento Informado</span>
                                                <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                                                    Confirmo que el trabajador ha firmado el **Consentimiento Informado** físico y que cuento con el documento original archivado.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-500/30 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        {error}
                                    </div>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || Object.keys(responses).length < totalItems || !consentGranted}
                                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    Finalizar y Guardar Evaluación
                                </button>
                                <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                                    Presiona los números (0-4) para capturar y avanzar automáticamente.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center p-8 border-2 border-dashed border-indigo-500/20 rounded-xl">
                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p>Comienza a ingresar puntajes para ver los resultados en tiempo real.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
