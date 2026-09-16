"use client";

import { useEffect, useState } from "react";
import PublicQuestionnaireForm from "./public-questionnaire-form";
import SignaturePad from "./signature-pad";
import SociodemographicForm from "./sociodemographic-form";
import { QuestionnaireType } from "@/types/battery";
import { INSTRUMENTS, INSTRUMENT_IDS, sortByOrder } from "@/config/instruments";

const QUESTIONNAIRE_ORDER: QuestionnaireType[] = sortByOrder(INSTRUMENT_IDS);

const SECTION_LABEL = Object.fromEntries(
    INSTRUMENT_IDS.map((id) => [id, INSTRUMENTS[id].label])
) as Record<QuestionnaireType, string>;

interface PublicInvitationView {
    workerFullName: string;
    organizationName: string;
    psychologistFullName: string;
    formType: "A" | "B";
    plannedTypes: QuestionnaireType[];
    doneTypes: QuestionnaireType[];
    effectiveStatus: "PENDING" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NOT_FOUND";
    sociodemographicsCompleted: boolean;
}

type Screen = "LOADING" | "ERROR" | "CONSENT" | "SOCIODEMOGRAPHICS" | "QUESTIONNAIRE" | "DONE";

function nextPendingType(view: PublicInvitationView): QuestionnaireType | null {
    return QUESTIONNAIRE_ORDER.find((t) => view.plannedTypes.includes(t) && !view.doneTypes.includes(t)) ?? null;
}

export default function InvitationFlow({ token }: { token: string }) {
    const [screen, setScreen] = useState<Screen>("LOADING");
    const [view, setView] = useState<PublicInvitationView | null>(null);
    const [currentType, setCurrentType] = useState<QuestionnaireType | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [signature, setSignature] = useState<string | null>(null);

    // Separada de `load` para que el efecto de montaje no dispare un
    // `setState` síncrono en su propio cuerpo (el estado inicial ya es
    // "LOADING"); `load` sigue poniéndolo cuando se llama a mano, por
    // ejemplo al recargar tras completar una sección.
    const fetchAndApply = () => {
        fetch(`/api/public/invitations/${token}`)
            .then((res) => res.json())
            .then((data: PublicInvitationView) => {
                setView(data);
                switch (data.effectiveStatus) {
                    case "NOT_FOUND":
                        setErrorMessage("Este enlace no es válido.");
                        setScreen("ERROR");
                        break;
                    case "CANCELLED":
                        setErrorMessage("Este enlace fue cancelado por tu psicólogo(a).");
                        setScreen("ERROR");
                        break;
                    case "EXPIRED":
                        setErrorMessage("Este enlace venció. Pide a tu psicólogo(a) que te envíe uno nuevo.");
                        setScreen("ERROR");
                        break;
                    case "COMPLETED":
                        setScreen("DONE");
                        break;
                    case "PENDING": {
                        const next = nextPendingType(data);
                        if (!next) {
                            setScreen("DONE");
                            break;
                        }
                        setCurrentType(next);
                        // Si ya completó al menos una sección, el consentimiento
                        // ya se aceptó en esa sesión anterior — no se repite.
                        setScreen(data.doneTypes.length > 0 ? "QUESTIONNAIRE" : "CONSENT");
                        break;
                    }
                }
            })
            .catch(() => {
                setErrorMessage("No pudimos cargar tu evaluación. Verifica tu conexión e intenta de nuevo.");
                setScreen("ERROR");
            });
    };

    const load = () => {
        setScreen("LOADING");
        fetchAndApply();
    };

    useEffect(fetchAndApply, [token]);

    const handleSectionComplete = (allDone: boolean) => {
        if (allDone) {
            setScreen("DONE");
            return;
        }
        // Recarga la vista pública para obtener el doneTypes actualizado y
        // avanzar a la siguiente sección pendiente.
        load();
    };

    if (screen === "LOADING") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (screen === "ERROR") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-sm w-full text-center space-y-4">
                    <h1 className="text-xl font-bold text-foreground">Enlace no disponible</h1>
                    <p className="text-muted-foreground text-sm">{errorMessage}</p>
                </div>
            </div>
        );
    }

    if (screen === "DONE") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-foreground">¡Gracias por diligenciar tu evaluación!</h1>
                    <p className="text-muted-foreground text-sm">
                        Tus respuestas fueron enviadas de forma confidencial a tu psicólogo(a). Ya puedes cerrar esta página.
                    </p>
                </div>
            </div>
        );
    }

    if (screen === "CONSENT" && view) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
                <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Hola, {view.workerFullName.split(" ")[0]}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {view.psychologistFullName} te invita a diligenciar tu evaluación de riesgo psicosocial
                            en {view.organizationName}.
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                        <p>
                            Esta evaluación hace parte del Sistema de Gestión de Seguridad y Salud en el Trabajo,
                            conforme a la Resolución 2764 de 2022 del Ministerio del Trabajo.
                        </p>
                        <p>
                            Tus respuestas son <strong>confidenciales</strong>: solo tu psicólogo(a) especialista
                            en SST tiene acceso a tu resultado individual. Tu empleador solo recibe reportes
                            agregados, sin datos que te identifiquen.
                        </p>
                        <p>
                            Tu participación es voluntaria. Responde con sinceridad, según tu experiencia real en
                            el trabajo durante los últimos meses. No hay respuestas correctas o incorrectas.
                        </p>
                        <p>
                            Al continuar, aceptas que tus respuestas sean recolectadas y custodiadas por tu
                            psicólogo(a) responsable para este fin.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Firma de aceptación
                        </label>
                        <SignaturePad onChange={setSignature} />
                    </div>
                    <button
                        disabled={!signature}
                        onClick={() => setScreen(view.sociodemographicsCompleted ? "QUESTIONNAIRE" : "SOCIODEMOGRAPHICS")}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        Acepto y firmo
                    </button>
                </div>
            </div>
        );
    }

    if (screen === "SOCIODEMOGRAPHICS") {
        return <SociodemographicForm token={token} onDone={() => setScreen("QUESTIONNAIRE")} />;
    }

    if (screen === "QUESTIONNAIRE" && view && currentType) {
        return (
            <div className="min-h-screen flex flex-col overflow-x-hidden">
                <PublicQuestionnaireForm
                    token={token}
                    questionnaireType={currentType}
                    formType={view.formType}
                    sectionLabel={SECTION_LABEL[currentType]}
                    consentSignature={signature ?? undefined}
                    onSectionComplete={handleSectionComplete}
                />
            </div>
        );
    }

    return null;
}
