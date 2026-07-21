"use client";

import { useState, useEffect, useRef } from "react";
import { FormType, QuestionnaireType, ItemResponses, ScoredResultData } from "@/types/battery";
import { scoreQuestionnaire } from "@/lib/scoring";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ManualFormProps {
    workerId: string;
    organizationId: string;
    workerName: string;
    organizationName: string;
    onReset: () => void;
}

type Mode = "SETUP" | "QUESTIONNAIRE" | "CONTROL_CLIENTS" | "CONTROL_BOSS" | "SUCCESS";

export default function ManualForm({ workerId, organizationId, workerName, organizationName, onReset }: ManualFormProps) {
    // 1. Setup State
    const [mode, setMode] = useState<Mode>("SETUP");
    const [qType, setQType] = useState<QuestionnaireType>("INTRALABORAL");
    const [formType, setFormType] = useState<FormType>("A");
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().substring(0, 10));
    
    // 2. Control Questions State
    const [hasCustomerInteraction, setHasCustomerInteraction] = useState<boolean | null>(null);
    const [isBoss, setIsBoss] = useState<boolean | null>(null);

    // 3. Responses State
    const [responses, setResponses] = useState<ItemResponses>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scoreResult, setScoreResult] = useState<ScoredResultData | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    const inputRef = useRef<HTMLDivElement>(null);

    // Generate Items list dynamically based on control answers
    const getItems = () => {
        let total = 0;
        if (qType === "STRESS" || qType === "EXTRALABORAL") total = 31;
        if (qType === "INTRALABORAL" && formType === "A") total = 123;
        if (qType === "INTRALABORAL" && formType === "B") total = 97;

        let items = Array.from({ length: total }, (_, i) => i + 1);

        if (qType === "INTRALABORAL") {
            // Remove client items if worker doesn't attend clients
            if (hasCustomerInteraction === false) {
                if (formType === "A") items = items.filter(i => i < 106 || i > 114);
                if (formType === "B") items = items.filter(i => i < 80 || i > 88);
            }
            // Remove boss items if worker is not boss (Form A only)
            if (formType === "A" && isBoss === false) {
                items = items.filter(i => i < 115 || i > 123);
            }
        }
        return items;
    };

    const items = getItems();
    const currentItem = items[currentIndex];
    const isStress = qType === "STRESS";
    const maxVal = isStress ? 4 : 5;

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (mode === "QUESTIONNAIRE") {
            if (startTime === 0) setStartTime(Date.now());
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [mode, startTime]);

    // Keyboard Navigation
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (mode !== "QUESTIONNAIRE" && mode !== "CONTROL_CLIENTS" && mode !== "CONTROL_BOSS") return;

            // Handle Control Questions via Keyboard
            if (mode === "CONTROL_CLIENTS") {
                if (e.key === "1") { handleControlAnswer("CLIENTS", true); }
                if (e.key === "2") { handleControlAnswer("CLIENTS", false); }
                return;
            }
            if (mode === "CONTROL_BOSS") {
                if (e.key === "1") { handleControlAnswer("BOSS", true); }
                if (e.key === "2") { handleControlAnswer("BOSS", false); }
                return;
            }

            // Handle Questionnaire
            const keyVal = parseInt(e.key);
            if (!isNaN(keyVal) && keyVal >= 1 && keyVal <= maxVal) {
                e.preventDefault();
                handleAnswer(keyVal - 1); // 0-indexed likert
            } else if (e.key === "Backspace" || e.key === "ArrowUp") {
                e.preventDefault();
                goBack();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (responses[String(currentItem)] !== undefined && currentIndex < items.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [mode, currentIndex, items, responses, maxVal]);

    const handleControlAnswer = (type: "CLIENTS" | "BOSS", value: boolean) => {
        if (type === "CLIENTS") {
            setHasCustomerInteraction(value);
            setMode("QUESTIONNAIRE");
        } else {
            setIsBoss(value);
            setMode("QUESTIONNAIRE");
        }
    };

    // Auto-save simulation & actual local state save
    const handleAnswer = (val: number) => {
        setResponses(prev => ({ ...prev, [String(currentItem)]: val }));
        
        // Let user see the answer for a tiny fraction of time, then advance
        setTimeout(() => {
            advanceNext();
        }, 150);
    };

    const advanceNext = () => {
        // Intercept for control questions
        if (qType === "INTRALABORAL") {
            // Form A: Clients starts at 106
            if (formType === "A" && currentItem === 105 && hasCustomerInteraction === null) {
                setMode("CONTROL_CLIENTS");
                return;
            }
            // Form A: Boss starts at 115
            if (formType === "A" && currentItem === (hasCustomerInteraction ? 114 : 105) && isBoss === null) {
                setMode("CONTROL_BOSS");
                return;
            }
            // Form B: Clients starts at 80
            if (formType === "B" && currentItem === 79 && hasCustomerInteraction === null) {
                setMode("CONTROL_CLIENTS");
                return;
            }
        }

        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (currentIndex === items.length - 1) {
            // Reached the end!
            submitAssessment();
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else if (currentIndex === 0) {
            // If we are at 0 and they want to go back, maybe let them re-do control questions?
            // For now, do nothing.
        }
    };

    const submitAssessment = async () => {
        setIsSubmitting(true);
        try {
            // 1. Calculate Score locally (optimistic)
            const score = scoreQuestionnaire(responses, formType, qType, {
                hasCustomerInteraction: hasCustomerInteraction ?? false,
                jobLevel: isBoss ? "JEFATURA" : "PROFESIONAL"
            } as any);

            // 2. Send to backend
            const payload = {
                workerId,
                organizationId,
                formType,
                questionnaireType: qType,
                assessmentDate,
                responses,
                hasCustomerInteraction: hasCustomerInteraction ?? false,
                occupationalGroup: formType === "A" ? "jefes_profesionales_tecnicos" : "auxiliares_operativos",
                inputMethod: "MANUAL",
                informedConsent: {
                    consentGranted: true,
                    consentMethod: "WRITTEN",
                    consentText: "Digitación manual confirma consentimiento físico."
                }
            };

            const res = await fetch("/api/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar");
            }

            setScoreResult(score);
            setMode("SUCCESS");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (mode === "SETUP") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-full bg-card border border-border shadow-xl rounded-3xl overflow-hidden p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-foreground">Configurar Evaluación</h2>
                        <p className="text-muted-foreground mt-1 text-sm">{workerName} • {organizationName}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cuestionario</label>
                            <select
                                value={qType}
                                onChange={(e) => setQType(e.target.value as QuestionnaireType)}
                                className="w-full h-12 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="INTRALABORAL">Intralaboral</option>
                                <option value="EXTRALABORAL">Extralaboral</option>
                                <option value="STRESS">Estrés</option>
                            </select>
                        </div>

                        {qType === "INTRALABORAL" && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forma</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as FormType)}
                                    className="w-full h-12 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="A">Forma A (Jefaturas / Profesionales / Técnicos)</option>
                                    <option value="B">Forma B (Auxiliares / Operativos)</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fecha de Aplicación</label>
                            <input
                                type="date"
                                value={assessmentDate}
                                onChange={(e) => setAssessmentDate(e.target.value)}
                                className="w-full h-12 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button variant="outline" onClick={onReset} className="h-12 flex-1 rounded-xl text-base">Cancelar</Button>
                            <Button 
                                onClick={() => {
                                    setStartTime(Date.now());
                                    setMode("QUESTIONNAIRE");
                                }} 
                                className="h-12 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md"
                            >
                                Iniciar Digitación
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "CONTROL_CLIENTS" || mode === "CONTROL_BOSS") {
        const isClient = mode === "CONTROL_CLIENTS";
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-full text-center space-y-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-4 shadow-sm border border-amber-200">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground mb-3">Pregunta de Control</h2>
                        <p className="text-xl text-muted-foreground font-medium">
                            {isClient ? "¿El trabajador atiende clientes o usuarios?" : "¿El trabajador es jefe de otras personas?"}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 mt-8 max-w-sm mx-auto">
                        <button onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", true)} className="flex items-center justify-between p-5 rounded-2xl border-2 border-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all hover:scale-[1.02] active:scale-95 shadow-sm group">
                            <span className="text-xl font-bold text-indigo-900">SÍ</span>
                            <kbd className="px-3 py-1 bg-white border border-indigo-200 rounded-lg shadow-sm font-mono font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">1</kbd>
                        </button>
                        <button onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", false)} className="flex items-center justify-between p-5 rounded-2xl border-2 border-border bg-card hover:border-indigo-300 hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-95 group">
                            <span className="text-xl font-bold text-foreground">NO</span>
                            <kbd className="px-3 py-1 bg-muted rounded-lg font-mono font-black text-muted-foreground border border-border group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">2</kbd>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "SUCCESS" && scoreResult) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-full bg-card border border-border shadow-xl rounded-3xl p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">¡Evaluación Registrada!</h2>
                    
                    <div className="flex items-center justify-center gap-8 mt-10 mb-12">
                        <div className="text-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Nivel</span>
                            <span className={`inline-block px-4 py-1.5 rounded-lg text-lg font-black ${
                                scoreResult.total.riskCategory === "MUY_ALTO" ? "bg-red-100 text-red-700" :
                                scoreResult.total.riskCategory === "ALTO" ? "bg-orange-100 text-orange-700" :
                                scoreResult.total.riskCategory === "MEDIO" ? "bg-yellow-100 text-yellow-700" :
                                scoreResult.total.riskCategory === "BAJO" ? "bg-emerald-100 text-emerald-700" :
                                "bg-teal-100 text-teal-700"
                            }`}>
                                {scoreResult.total.riskCategory.replace("_", " ")}
                            </span>
                        </div>
                        <div className="h-14 w-px bg-border"></div>
                        <div className="text-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Puntaje</span>
                            <span className="text-3xl font-black text-foreground">{scoreResult.total.transformedScore.toFixed(1)}</span>
                        </div>
                        <div className="h-14 w-px bg-border"></div>
                        <div className="text-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Tiempo</span>
                            <span className="text-2xl font-bold text-muted-foreground font-mono">{formatTime(elapsedSeconds)}</span>
                        </div>
                    </div>

                    <Button onClick={onReset} className="w-full h-14 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50">
                        Siguiente Trabajador
                    </Button>
                </div>
            </div>
        );
    }

    // mode === "QUESTIONNAIRE"
    const currentVal = responses[String(currentItem)];

    return (
        <div className="flex-1 flex flex-col h-full bg-background animate-in fade-in">
            {/* Top Navigation Bar */}
            <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-tight">{workerName}</span>
                        <span className="text-xs text-muted-foreground font-medium">{qType} {qType === "INTRALABORAL" && `· Forma ${formType}`}</span>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-8 hidden sm:block">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso</span>
                        <span className="text-[10px] font-bold text-muted-foreground font-mono">{currentIndex + 1} / {items.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-lg shadow-sm">
                        ⏱ {formatTime(elapsedSeconds)}
                    </span>
                </div>
            </div>

            {/* Main Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                {isSubmitting ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-lg"></div>
                        <h2 className="text-xl font-bold text-foreground">Procesando resultados...</h2>
                        <p className="text-muted-foreground mt-2 text-sm">Calculando niveles de riesgo y consumiendo crédito</p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl text-center space-y-12 relative animate-in slide-in-from-right-8 duration-300">
                        
                        {/* Question Number */}
                        <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-lg shadow-sm tracking-tight">
                            Pregunta {currentItem}
                        </div>

                        {/* Question Text */}
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight">
                            ¿Pregunta {currentItem}?
                        </h2>
                        
                        {/* Subtitle / Helper (optional) */}
                        <p className="text-lg text-muted-foreground font-medium">
                            En el último mes, ¿con qué frecuencia...
                        </p>

                        {/* Likert Buttons */}
                        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-3 md:gap-5 mt-12">
                            {[1, 2, 3, 4, ...(isStress ? [] : [5])].map((val) => {
                                const isSelected = currentVal === val - 1;
                                
                                let label = "";
                                if (isStress) {
                                    label = val === 1 ? "Siempre" : val === 2 ? "Casi siempre" : val === 3 ? "A veces" : "Nunca";
                                } else {
                                    label = val === 1 ? "Siempre" : val === 2 ? "Casi siempre" : val === 3 ? "A veces" : val === 4 ? "Casi nunca" : "Nunca";
                                }

                                return (
                                    <button
                                        key={val}
                                        onClick={() => handleAnswer(val - 1)}
                                        className={`flex flex-col items-center justify-center w-full sm:w-[130px] h-[130px] rounded-3xl border-2 transition-all duration-150 group relative ${
                                            isSelected 
                                            ? "border-indigo-600 bg-indigo-50 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.4)] scale-105 z-10" 
                                            : "border-border bg-card hover:border-indigo-300 hover:bg-muted/50 hover:-translate-y-1 hover:shadow-md"
                                        }`}
                                    >
                                        <kbd className={`absolute top-3 left-1/2 -translate-x-1/2 font-mono text-sm font-black px-2.5 py-0.5 rounded-lg border transition-colors ${
                                            isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-muted border-border text-muted-foreground group-hover:bg-indigo-100 group-hover:border-indigo-200 group-hover:text-indigo-600"
                                        }`}>
                                            {val}
                                        </kbd>
                                        <span className={`mt-7 text-sm font-black text-center leading-tight px-3 ${
                                            isSelected ? "text-indigo-900" : "text-muted-foreground group-hover:text-foreground"
                                        }`}>
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Keyboard Hints */}
            <div className="h-14 flex items-center justify-center gap-8 text-xs font-bold text-muted-foreground bg-card border-t border-border shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-muted border border-border rounded shadow-sm font-mono text-[11px] text-foreground">1</kbd> a <kbd className="px-2 py-1 bg-muted border border-border rounded shadow-sm font-mono text-[11px] text-foreground">{maxVal}</kbd> para Responder</span>
                <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-muted border border-border rounded shadow-sm font-mono text-[11px] text-foreground">⌫</kbd> Anterior</span>
                <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-muted border border-border rounded shadow-sm font-mono text-[11px] text-foreground">↓</kbd> Siguiente</span>
            </div>
        </div>
    );
}
