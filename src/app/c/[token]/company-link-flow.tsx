"use client";

import { useEffect, useState } from "react";
import InvitationFlow from "../../e/[token]/invitation-flow";
import { getErrorMessage } from "@/lib/utils";

interface PublicCompanyLinkView {
    organizationName: string;
    psychologistFullName: string;
    isActive: boolean;
}

type Screen = "LOADING" | "ERROR" | "IDENTIFY" | "RESOLVED" | "RESENT";

/**
 * Pantalla completa centrada, medida en `svh` en vez de `vh`: en móvil la
 * barra de direcciones hace que 100vh sea más alto que lo visible y la
 * tarjeta queda descentrada o exige un scroll que no debería existir.
 */
const SCREEN_CLASS = "min-h-svh flex items-center justify-center px-4 py-8";

/** La etiqueta ES la pregunta para quien llena el formulario desde el móvil:
 *  caja alta a 12px con tracking ancho es justo lo que no se lee de lejos. */
const LABEL_CLASS = "block text-[15px] font-semibold text-foreground mb-2";

/**
 * Enlace único por empresa: el trabajador se identifica con su cédula y,
 * si existe en la organización, se resuelve a un token de invitación
 * individual — desde ahí se reutiliza tal cual InvitationFlow (consentimiento,
 * sociodemográficos y cuestionarios), sin duplicar esa lógica.
 */
export default function CompanyLinkFlow({ token }: { token: string }) {
    const [screen, setScreen] = useState<Screen>("LOADING");
    const [view, setView] = useState<PublicCompanyLinkView | null>(null);
    const [documentId, setDocumentId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitationToken, setInvitationToken] = useState<string | null>(null);
    const [resentMessage, setResentMessage] = useState("");

    useEffect(() => {
        fetch(`/api/public/company-invitations/${token}`)
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Este enlace no es válido.");
                }
                return res.json();
            })
            .then((data: PublicCompanyLinkView) => {
                if (!data.isActive) {
                    setErrorMessage("Este enlace ya no está activo. Pide a tu psicólogo(a) el enlace vigente.");
                    setScreen("ERROR");
                    return;
                }
                setView(data);
                setScreen("IDENTIFY");
            })
            .catch((err) => {
                setErrorMessage(err.message || "No pudimos cargar este enlace.");
                setScreen("ERROR");
            });
    }, [token]);

    const handleIdentify = async () => {
        if (!documentId.trim()) return;
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            const res = await fetch(`/api/public/company-invitations/${token}/identify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: documentId.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al validar tu documento.");
            // Cuando ya hay una evaluación en curso, el servidor NO devuelve
            // token: reenvía el enlace al correo registrado para que solo el
            // trabajador dueño de ese buzón pueda continuar.
            if (data.outcome === "RESENT_TO_CONTACT") {
                setResentMessage(data.message);
                setScreen("RESENT");
                return;
            }
            setInvitationToken(data.invitationToken);
            setScreen("RESOLVED");
        } catch (err: unknown) {
            setErrorMessage(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (screen === "LOADING") {
        return (
            <div className={SCREEN_CLASS}>
                <div className="w-10 h-10 border-4 border-teal-light border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (screen === "ERROR") {
        return (
            <div className={SCREEN_CLASS}>
                <div className="max-w-sm w-full text-center space-y-4">
                    <h1 className="text-xl font-bold text-foreground">Enlace no disponible</h1>
                    <p className="text-muted-foreground text-[15px] leading-relaxed">{errorMessage}</p>
                </div>
            </div>
        );
    }

    if (screen === "RESENT") {
        return (
            <div className={SCREEN_CLASS}>
                <div className="max-w-sm w-full bg-card border border-border rounded-2xl shadow-sm p-5 sm:p-6 text-center space-y-3">
                    <div
                        className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: "color-mix(in srgb, var(--color-info) 14%, transparent)" }}
                    >
                        ✉️
                    </div>
                    <h1 className="text-lg font-bold text-foreground">Revisa tu correo</h1>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{resentMessage}</p>
                </div>
            </div>
        );
    }

    if (screen === "RESOLVED" && invitationToken) {
        return <InvitationFlow token={invitationToken} />;
    }

    if (screen === "IDENTIFY" && view) {
        return (
            <div className={SCREEN_CLASS}>
                <div className="max-w-sm w-full bg-card border border-border rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
                    <div>
                        <h1 className="text-xl font-bold text-foreground leading-snug">Evaluación de riesgo psicosocial</h1>
                        <p className="text-[15px] leading-relaxed text-muted-foreground mt-1.5">
                            {view.psychologistFullName} invita a los trabajadores de <strong>{view.organizationName}</strong> a
                            diligenciar su evaluación. Ingresa tu número de cédula para continuar.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="company-link-document" className={LABEL_CLASS}>
                            Número de cédula
                        </label>
                        <input
                            id="company-link-document"
                            type="text"
                            inputMode="numeric"
                            enterKeyHint="go"
                            autoComplete="off"
                            autoFocus
                            value={documentId}
                            onChange={(e) => setDocumentId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
                            placeholder="Ej: 1020304050"
                            className="w-full h-13 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errorMessage && <p className="text-sm font-medium text-danger mt-2">{errorMessage}</p>}
                    </div>
                    <button
                        onClick={handleIdentify}
                        disabled={isSubmitting || !documentId.trim()}
                        className="w-full min-h-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
                    >
                        {isSubmitting ? "Validando..." : "Continuar"}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
