"use client";

import { useState, useRef, useEffect } from "react";
import { FormType, QuestionnaireType, ItemResponses } from "@/types/battery";
import { getItemText } from "@/config/battery";
import { toast } from "sonner";

interface PublicQuestionnaireFormProps {
    token: string;
    questionnaireType: QuestionnaireType;
    formType: FormType;
    sectionLabel: string;
    consentSignature?: string;
    onSectionComplete: (allDone: boolean) => void;
}

type Mode = "QUESTIONNAIRE" | "CONTROL_CLIENTS" | "CONTROL_BOSS" | "SAVING";

/**
 * Registro de una pregunta de control ya resuelta, para poder deshacerla.
 * `landingIndex` es la posición en QUESTIONNAIRE a la que se llegó tras
 * resolverla — `null` cuando la resolución encadenó directo a otra pregunta
 * de control sin pasar por QUESTIONNAIRE (Forma A, cliente=No → jefatura).
 */
interface ControlCheckpoint {
    control: "CLIENTS" | "BOSS";
    boundaryIndex: number;
    prevCustomer: boolean | null;
    prevBoss: boolean | null;
    landingIndex: number | null;
}

/**
 * Versión adaptada (copia deliberada, no refactor) de la lógica de
 * secuenciación de ítems de dashboard/assessments/new/manual/manual-form.tsx.
 * Se copia en vez de extraerse a un hook compartido para no arriesgar el
 * flujo manual del psicólogo, que ya funciona — queda como deuda técnica a
 * unificar después del piloto.
 *
 * A diferencia del original: no hay modo SETUP (formType/questionnaireType
 * vienen fijos de la invitación), y NUNCA se calcula ni se muestra el
 * puntaje — el trabajador no debe ver su propio resultado.
 */
export default function PublicQuestionnaireForm({
    token,
    questionnaireType: qType,
    formType,
    sectionLabel,
    consentSignature,
    onSectionComplete,
}: PublicQuestionnaireFormProps) {
    const [mode, setMode] = useState<Mode>("QUESTIONNAIRE");
    const [hasCustomerInteraction, setHasCustomerInteractionState] = useState<boolean | null>(null);
    const [isBoss, setIsBossState] = useState<boolean | null>(null);
    const [responses, setResponses] = useState<ItemResponses>({});
    const [currentIndex, setCurrentIndexState] = useState(0);

    const responsesRef = useRef<ItemResponses>({});
    const advancingRef = useRef(false);
    const currentIndexRef = useRef(0);
    const hasCustomerInteractionRef = useRef<boolean | null>(null);
    const isBossRef = useRef<boolean | null>(null);
    const checkpointsRef = useRef<ControlCheckpoint[]>([]);

    const setCurrentIndex = (updater: number | ((prev: number) => number)) => {
        const next = typeof updater === "function" ? (updater as (prev: number) => number)(currentIndexRef.current) : updater;
        currentIndexRef.current = next;
        setCurrentIndexState(next);
    };
    const setHasCustomerInteraction = (value: boolean | null) => {
        hasCustomerInteractionRef.current = value;
        setHasCustomerInteractionState(value);
    };
    const setIsBoss = (value: boolean | null) => {
        isBossRef.current = value;
        setIsBossState(value);
    };

    const computeItems = (customer: boolean | null, boss: boolean | null) => {
        let total = 0;
        if (qType === "STRESS" || qType === "EXTRALABORAL") total = 31;
        if (qType === "INTRALABORAL" && formType === "A") total = 123;
        if (qType === "INTRALABORAL" && formType === "B") total = 97;

        let items = Array.from({ length: total }, (_, i) => i + 1);

        if (qType === "INTRALABORAL") {
            if (customer === false) {
                if (formType === "A") items = items.filter((i) => i < 106 || i > 114);
                if (formType === "B") items = items.filter((i) => i < 89 || i > 97);
            }
            if (formType === "A" && boss === false) {
                items = items.filter((i) => i < 115 || i > 123);
            }
        }
        return items;
    };

    // Si el trabajador corrige una pregunta de control, los ítems que ya
    // había respondido bajo la rama anterior (ej. 106-114 con cliente=Sí)
    // pueden dejar de aplicar — se descartan para no guardar respuestas de
    // una rama que ya no es la vigente.
    const pruneResponses = (validItems: number[]) => {
        const validSet = new Set(validItems);
        const pruned: ItemResponses = {};
        for (const [key, value] of Object.entries(responsesRef.current)) {
            if (validSet.has(Number(key))) pruned[key] = value;
        }
        responsesRef.current = pruned;
        setResponses(pruned);
    };

    const items = computeItems(hasCustomerInteraction, isBoss);
    const currentItem = items[currentIndex];
    const isStress = qType === "STRESS";
    const maxVal = isStress ? 4 : 5;

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (mode === "CONTROL_CLIENTS" || mode === "CONTROL_BOSS") {
                const isClient = mode === "CONTROL_CLIENTS";
                if (e.key === "1") handleControlAnswer(isClient ? "CLIENTS" : "BOSS", true);
                if (e.key === "2") handleControlAnswer(isClient ? "CLIENTS" : "BOSS", false);
                if (e.key === "Backspace") {
                    e.preventDefault();
                    goBackFromControl();
                }
                return;
            }
            if (mode !== "QUESTIONNAIRE") return;
            const keyVal = parseInt(e.key);
            if (!isNaN(keyVal) && keyVal >= 1 && keyVal <= maxVal) {
                e.preventDefault();
                handleAnswer(keyVal - 1);
            } else if (e.key === "Backspace") {
                e.preventDefault();
                goBack();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, maxVal]);

    const handleControlAnswer = (type: "CLIENTS" | "BOSS", value: boolean) => {
        const oldCustomer = hasCustomerInteractionRef.current;
        const oldBoss = isBossRef.current;
        const boundaryIndex = currentIndexRef.current;
        const boundaryItem = computeItems(oldCustomer, oldBoss)[boundaryIndex];

        const newCustomer = type === "CLIENTS" ? value : oldCustomer;
        const newBoss = type === "BOSS" ? value : oldBoss;

        if (type === "CLIENTS") setHasCustomerInteraction(value);
        else setIsBoss(value);

        // Forma A sin atención a clientes: el ítem 105 es también el límite de
        // la pregunta de jefatura (115-123). Si no se formula aquí, advanceNext
        // ya pasó ese límite y nunca aparece.
        if (type === "CLIENTS" && formType === "A" && newCustomer === false && newBoss === null) {
            checkpointsRef.current.push({ control: "CLIENTS", boundaryIndex, prevCustomer: oldCustomer, prevBoss: oldBoss, landingIndex: null });
            setMode("CONTROL_BOSS");
            return;
        }

        setMode("QUESTIONNAIRE");

        const newItems = computeItems(newCustomer, newBoss);
        pruneResponses(newItems);
        const idx = newItems.indexOf(boundaryItem);

        if (idx === -1) {
            checkpointsRef.current.push({ control: type, boundaryIndex, prevCustomer: oldCustomer, prevBoss: oldBoss, landingIndex: 0 });
            setCurrentIndex(0);
            return;
        }
        if (idx < newItems.length - 1) {
            checkpointsRef.current.push({ control: type, boundaryIndex, prevCustomer: oldCustomer, prevBoss: oldBoss, landingIndex: idx + 1 });
            setCurrentIndex(idx + 1);
        } else {
            submitSection(newCustomer, newBoss);
        }
    };

    /** Reabre la pregunta de control que llevó al ítem actual, si el
     * trabajador no ha avanzado más allá de ella todavía. */
    const goBackToControlCheckpoint = (): boolean => {
        const last = checkpointsRef.current[checkpointsRef.current.length - 1];
        if (!last || last.landingIndex !== currentIndexRef.current) return false;
        checkpointsRef.current.pop();
        setHasCustomerInteraction(last.prevCustomer);
        setIsBoss(last.prevBoss);
        setCurrentIndex(last.boundaryIndex);
        setMode(last.control === "CLIENTS" ? "CONTROL_CLIENTS" : "CONTROL_BOSS");
        return true;
    };

    /** Deshace una pregunta de control encadenada (cliente=No → jefatura),
     * volviendo a la pregunta anterior en la cadena sin pasar por
     * QUESTIONNAIRE. Solo aplica si esta pantalla de control se abrió por
     * encadenamiento directo, no por avance normal del cuestionario. */
    const goBackFromControl = () => {
        const last = checkpointsRef.current[checkpointsRef.current.length - 1];
        if (!last || last.landingIndex !== null) return;
        checkpointsRef.current.pop();
        setHasCustomerInteraction(last.prevCustomer);
        setIsBoss(last.prevBoss);
        setCurrentIndex(last.boundaryIndex);
        setMode(last.control === "CLIENTS" ? "CONTROL_CLIENTS" : "CONTROL_BOSS");
    };

    const handleAnswer = (val: number) => {
        if (advancingRef.current) return;
        advancingRef.current = true;

        const curItems = computeItems(hasCustomerInteractionRef.current, isBossRef.current);
        const curItem = curItems[currentIndexRef.current];

        const updated = { ...responsesRef.current, [String(curItem)]: val };
        responsesRef.current = updated;
        setResponses(updated);

        setTimeout(() => {
            advancingRef.current = false;
            advanceNext();
        }, 150);
    };

    const advanceNext = () => {
        const curItems = computeItems(hasCustomerInteractionRef.current, isBossRef.current);
        const curIndex = currentIndexRef.current;
        const curItem = curItems[curIndex];

        if (qType === "INTRALABORAL") {
            if (formType === "A" && curItem === 105 && hasCustomerInteractionRef.current === null) {
                setMode("CONTROL_CLIENTS");
                return;
            }
            if (formType === "A" && curItem === (hasCustomerInteractionRef.current ? 114 : 105) && isBossRef.current === null) {
                setMode("CONTROL_BOSS");
                return;
            }
            if (formType === "B" && curItem === 88 && hasCustomerInteractionRef.current === null) {
                setMode("CONTROL_CLIENTS");
                return;
            }
        }

        if (curIndex < curItems.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else if (curIndex === curItems.length - 1) {
            submitSection(hasCustomerInteractionRef.current, isBossRef.current);
        }
    };

    const goBack = () => {
        if (goBackToControlCheckpoint()) return;
        if (currentIndexRef.current > 0) setCurrentIndex((prev) => prev - 1);
    };

    const submitSection = async (customerOverride?: boolean | null, bossOverride?: boolean | null) => {
        setMode("SAVING");
        try {
            const finalCustomer = customerOverride !== undefined ? customerOverride : hasCustomerInteraction;
            const finalBoss = bossOverride !== undefined ? bossOverride : isBoss;

            const res = await fetch(`/api/public/invitations/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionnaireType: qType,
                    responses: responsesRef.current,
                    hasCustomerInteraction: finalCustomer ?? undefined,
                    hasPeopleInCharge: finalBoss ?? undefined,
                    consentGranted: true,
                    consentSignature,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar tus respuestas");

            onSectionComplete(data.allDone);
        } catch (error: any) {
            toast.error(error.message);
            setMode("QUESTIONNAIRE");
        }
    };

    if (mode === "CONTROL_CLIENTS" || mode === "CONTROL_BOSS") {
        const isClient = mode === "CONTROL_CLIENTS";
        const topCheckpoint = checkpointsRef.current[checkpointsRef.current.length - 1];
        const canGoBack = !!topCheckpoint && topCheckpoint.landingIndex === null;
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4 py-12 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-full text-center space-y-8">
                    <h2 className="text-2xl font-black text-foreground mb-2">
                        {isClient ? "¿Atiendes clientes o usuarios en tu trabajo?" : "¿Eres jefe de otras personas en tu trabajo?"}
                    </h2>
                    <div className="flex flex-col gap-4 mt-6 max-w-sm mx-auto">
                        <button
                            onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", true)}
                            className="flex items-center justify-center p-5 rounded-2xl border-2 border-primary bg-teal-light hover:bg-teal-light/70 transition-all active:scale-95 shadow-sm"
                        >
                            <span className="text-xl font-bold text-teal-dark">SÍ</span>
                        </button>
                        <button
                            onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", false)}
                            className="flex items-center justify-center p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all active:scale-95"
                        >
                            <span className="text-xl font-bold text-foreground">NO</span>
                        </button>
                    </div>
                    {canGoBack && (
                        <button onClick={goBackFromControl} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2">
                            Volver a la pregunta anterior
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (mode === "SAVING") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-24">
                <div className="w-12 h-12 border-4 border-teal-light border-t-primary rounded-full animate-spin mb-6"></div>
                <p className="text-muted-foreground text-sm">Guardando tus respuestas...</p>
            </div>
        );
    }

    const currentVal = responses[String(currentItem)];
    const currentText = getItemText(qType, formType, currentItem);

    return (
        <div className="flex-1 flex flex-col min-h-[70vh] animate-in fade-in">
            <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between items-center mb-1.5 max-w-2xl mx-auto">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{sectionLabel}</span>
                    <span className="text-[11px] font-bold text-muted-foreground font-mono">
                        {currentIndex + 1} / {items.length}
                    </span>
                </div>
                <div className="w-full max-w-2xl mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${(currentIndex / items.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl text-center space-y-8 animate-in slide-in-from-right-8 duration-300">
                    <h2
                        className={`font-black text-foreground leading-[1.2] tracking-tight ${
                            (currentText?.length ?? 0) > 95 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                        }`}
                    >
                        {currentText ?? `Pregunta ${currentItem}`}
                    </h2>

                    <p className="text-sm text-muted-foreground font-medium">
                        {isStress ? "En los últimos tres meses, ¿con qué frecuencia?" : "Señala la frecuencia con la que ocurre"}
                    </p>

                    <div className="grid grid-cols-2 sm:flex sm:justify-center gap-3 mt-8">
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
                                    className={`flex flex-col items-center justify-center w-full sm:w-[110px] h-[100px] rounded-2xl border-2 transition-all duration-150 ${
                                        isSelected
                                            ? "border-primary bg-teal-light shadow-md scale-105"
                                            : "border-border bg-card active:scale-95"
                                    }`}
                                >
                                    <span className={`text-sm font-black text-center leading-tight px-2 ${isSelected ? "text-teal-dark" : "text-foreground"}`}>
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {currentIndex > 0 && (
                        <button onClick={goBack} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2">
                            Volver a la pregunta anterior
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
