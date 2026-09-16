"use client";

import { useState, useRef, useEffect } from "react";
import { FormType, QuestionnaireType, ItemResponses } from "@/types/battery";
import { getItemText } from "@/config/battery";
import { getInstrument } from "@/config/instruments";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

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
        const total = getInstrument(qType).config(formType).totalItems;

        let items = Array.from({ length: total }, (_, i) => i + 1);

        if (getInstrument(qType).hasControlQuestions) {
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
    const scale = getInstrument(qType).scale;
    const maxVal = scale.max - scale.min + 1;

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

    // En móvil una pregunta larga puede dejar la pantalla desplazada; la
    // siguiente debe empezar desde arriba y no a media altura. Sin
    // `behavior: smooth`: el salto instantáneo se lee como pantalla nueva.
    useEffect(() => {
        if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
    }, [currentIndex, mode]);

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
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
            setMode("QUESTIONNAIRE");
        }
    };

    if (mode === "CONTROL_CLIENTS" || mode === "CONTROL_BOSS") {
        const isClient = mode === "CONTROL_CLIENTS";
        const topCheckpoint = checkpointsRef.current[checkpointsRef.current.length - 1];
        const canGoBack = !!topCheckpoint && topCheckpoint.landingIndex === null;
        return (
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4 py-10 sm:py-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                <div className="w-full text-center space-y-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-[1.2] tracking-tight mb-2">
                        {isClient ? "¿Atiendes clientes o usuarios en tu trabajo?" : "¿Eres jefe de otras personas en tu trabajo?"}
                    </h2>
                    <div className="flex flex-col gap-3 mt-6 max-w-sm mx-auto">
                        <button
                            type="button"
                            onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", true)}
                            className="flex items-center justify-center min-h-[68px] px-5 rounded-2xl border-2 border-primary bg-teal-light hover:bg-teal-light/70 transition-all active:scale-[0.98] shadow-sm touch-manipulation select-none"
                        >
                            <span className="text-xl font-bold text-teal-dark">SÍ</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleControlAnswer(isClient ? "CLIENTS" : "BOSS", false)}
                            className="flex items-center justify-center min-h-[68px] px-5 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all active:scale-[0.98] touch-manipulation select-none"
                        >
                            <span className="text-xl font-bold text-foreground">NO</span>
                        </button>
                    </div>
                    {canGoBack && (
                        <button
                            type="button"
                            onClick={goBackFromControl}
                            className="inline-flex items-center justify-center min-h-[44px] px-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 touch-manipulation"
                        >
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
                <p className="text-muted-foreground text-[15px]">Guardando tus respuestas...</p>
            </div>
        );
    }

    const currentVal = responses[String(currentItem)];
    const currentText = getItemText(qType, formType, currentItem);

    // Además del índice > 0, se puede volver cuando la pregunta actual es
    // donde aterrizó una pregunta de control (aunque sea el índice 0).
    const topCheckpoint = checkpointsRef.current[checkpointsRef.current.length - 1];
    const canGoBack = currentIndex > 0 || (!!topCheckpoint && topCheckpoint.landingIndex === currentIndex);

    return (
        <div className="flex-1 flex flex-col min-h-[70vh] motion-safe:animate-in motion-safe:fade-in">
            {/* Progreso — pegado arriba: en un cuestionario de 100+ ítems el
                trabajador necesita ver cuánto falta sin volver a subir. */}
            <div className="sticky top-0 z-20 bg-background border-b border-border-muted px-4 pt-3 pb-2.5">
                <div className="flex justify-between items-baseline gap-3 mb-2 max-w-2xl mx-auto">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate min-w-0">
                        {sectionLabel}
                    </span>
                    <span className="text-sm font-bold text-foreground font-mono tabular-nums shrink-0">
                        {currentIndex + 1} / {items.length}
                    </span>
                </div>
                <div className="w-full max-w-2xl mx-auto h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(currentIndex / items.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center px-4 py-6 sm:py-10">
                {/* `key` por ítem: sin él la animación sólo corre al montar y
                    dos preguntas seguidas parecen la misma pantalla. */}
                <div
                    key={currentItem}
                    className="w-full max-w-2xl mx-auto motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
                >
                    <h2
                        className={`text-center font-black text-foreground leading-[1.25] tracking-tight ${
                            (currentText?.length ?? 0) > 95 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                        }`}
                    >
                        {currentText ?? `Pregunta ${currentItem}`}
                    </h2>

                    <p className="mt-3 text-center text-[15px] text-muted-foreground font-medium">
                        {isStress
                            ? "En los últimos tres meses, ¿con qué frecuencia?"
                            : getInstrument(qType).family === "CLIMA"
                              ? "Indica tu grado de acuerdo con la afirmación"
                              : "Señala la frecuencia con la que ocurre"}
                    </p>

                    {/* El valor guardado es min + índice (0-4 batería, 0-3 estrés, 1-5 clima).
                        En móvil cada opción es una fila completa — el objetivo táctil es
                        toda la fila, no un círculo de 20px — y en pantalla ancha vuelven a
                        ser tarjetas en línea. Sin anchos fijos: `flex-1` reparte por igual
                        sean 4 o 5 opciones. */}
                    <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                        {scale.labels.map((label, idx) => {
                            const val = scale.min + idx;
                            const isSelected = currentVal === val;
                            return (
                                <button
                                    key={val}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => handleAnswer(val)}
                                    className={`flex w-full items-center gap-3 min-h-[56px] px-4 py-3 rounded-2xl border-2 text-left transition-all duration-150 touch-manipulation select-none sm:flex-1 sm:flex-col sm:items-center sm:justify-center sm:text-center sm:min-h-[104px] sm:px-2.5 sm:gap-0 ${
                                        isSelected
                                            ? "border-primary bg-teal-light shadow-md"
                                            : "border-border bg-card active:bg-muted/60 active:scale-[0.98]"
                                    }`}
                                >
                                    <span
                                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center sm:hidden ${
                                            isSelected ? "border-primary" : "border-border"
                                        }`}
                                    >
                                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                                    </span>
                                    <span
                                        className={`text-base sm:text-sm font-black leading-tight ${
                                            isSelected ? "text-teal-dark" : "text-foreground"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Navegación pegada abajo: responder avanza solo, así que el único
                control es volver — y debe estar siempre al alcance del pulgar,
                no al final del scroll. */}
            <div
                className="sticky bottom-0 z-20 bg-background border-t border-border-muted px-4 pt-3"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
                <div className="max-w-2xl mx-auto">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={!canGoBack}
                        className="w-full min-h-[48px] rounded-xl border border-border bg-card text-[15px] font-bold text-text-secondary transition-all hover:bg-muted/50 hover:text-foreground active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 touch-manipulation select-none"
                    >
                        Volver a la pregunta anterior
                    </button>
                </div>
            </div>
        </div>
    );
}
