"use client";

import { useEffect, useState } from "react";
import InvitationFlow from "../../e/[token]/invitation-flow";

interface PublicCompanyLinkView {
    organizationName: string;
    psychologistFullName: string;
    isActive: boolean;
}

type Screen = "LOADING" | "ERROR" | "IDENTIFY" | "RESOLVED";

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
            setInvitationToken(data.invitationToken);
            setScreen("RESOLVED");
        } catch (err: any) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (screen === "LOADING") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-10 h-10 border-4 border-teal-light border-t-primary rounded-full animate-spin"></div>
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

    if (screen === "RESOLVED" && invitationToken) {
        return <InvitationFlow token={invitationToken} />;
    }

    if (screen === "IDENTIFY" && view) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
                <div className="max-w-sm w-full bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Evaluación de riesgo psicosocial</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {view.psychologistFullName} invita a los trabajadores de <strong>{view.organizationName}</strong> a
                            diligenciar su evaluación. Ingresa tu número de cédula para continuar.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Número de cédula
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={documentId}
                            onChange={(e) => setDocumentId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
                            placeholder="Ej: 1020304050"
                            className="w-full h-12 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errorMessage && <p className="text-xs text-danger mt-2">{errorMessage}</p>}
                    </div>
                    <button
                        onClick={handleIdentify}
                        disabled={isSubmitting || !documentId.trim()}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                    >
                        {isSubmitting ? "Validando..." : "Continuar"}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
