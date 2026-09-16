"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Loader2, AlertTriangle, PenSquare, Sparkles } from "lucide-react";
import Link from "next/link";

interface AnalysisSignPanelProps {
    assessmentId: string;
    isSigned: boolean;
    initialAnalysis: string | null;
    savedRecommendations: string | null;
    hasSignature?: boolean;
    /** Último borrador generado por la IA para este informe, si lo hubo. */
    aiDraft?: string | null;
    /** Cuándo el profesional asumió expresamente el texto vigente. */
    analysisReviewedAt?: string | null;
}

export default function AnalysisSignPanel({
    assessmentId,
    isSigned,
    initialAnalysis,
    savedRecommendations,
    hasSignature = false,
    aiDraft = null,
    analysisReviewedAt = null,
}: AnalysisSignPanelProps) {
    const router = useRouter();
    const [analysis, setAnalysis] = useState(initialAnalysis || "");
    const [signing, setSigning] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [error, setError] = useState("");
    const [aiError, setAiError] = useState("");
    const [draft, setDraft] = useState<string | null>(aiDraft);
    const [reviewedAt, setReviewedAt] = useState<string | null>(analysisReviewedAt);
    const [accepted, setAccepted] = useState(false);

    const isDirty = analysis.trim() !== (initialAnalysis || "").trim();
    const showSignButton = !isSigned || isDirty;

    // Mientras exista un borrador automático de por medio, firmar exige que el
    // psicólogo declare que revisó el texto y lo asume: la interpretación de la
    // batería es acto reservado suyo (Res. 2646/2008 art. 12, Ley 1090/2006) y
    // la responsabilidad disciplinaria recae sobre quien firma, no sobre la
    // herramienta que redactó el borrador. Editar el texto vuelve a exigirla.
    const needsAcceptance = draft !== null && (!reviewedAt || isDirty);
    const isVerbatimDraft = draft !== null && analysis.trim() === draft.trim();

    const handleGenerateAI = async () => {
        setGeneratingAI(true);
        setAiError("");
        try {
            const res = await fetch("/api/ai/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId }),
            });
            const data = await res.json();
            if (res.ok && data.analysis) {
                setAnalysis(data.analysis);
                setDraft(data.analysis);
                setReviewedAt(null);
                setAccepted(false);
            } else {
                setAiError(data.error || "No se pudo generar el análisis. Verifica OPENROUTER_API_KEY en .env.local");
            }
        } catch {
            setAiError("Error de conexión al generar el análisis.");
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSign = async () => {
        if (!analysis.trim()) {
            setError("Ingresa el análisis clínico antes de firmar.");
            return;
        }
        if (!savedRecommendations?.trim()) {
            setError("Debes guardar las recomendaciones antes de firmar.");
            return;
        }
        if (needsAcceptance && !accepted) {
            setError(
                "La interpretación proviene de un borrador generado automáticamente. " +
                "Debes revisarla y marcar la casilla para asumirla como tuya antes de firmar."
            );
            return;
        }
        if (!confirm("¿Confirmas que deseas firmar este reporte?")) {
            return;
        }

        setSigning(true);
        setError("");

        try {
            // La aceptación se registra antes de firmar para que quede en la
            // bitácora aunque la firma falle por cualquier motivo.
            if (draft !== null) {
                const ack = await fetch("/api/ai/analysis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ assessmentId, acceptDraft: true, overrideText: analysis }),
                });
                if (!ack.ok) {
                    const data = await ack.json();
                    setError(data.error || "No se pudo registrar la revisión del análisis.");
                    setSigning(false);
                    return;
                }
                setReviewedAt(new Date().toISOString());
            }

            const res = await fetch(`/api/reports/${assessmentId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analysis, recommendations: savedRecommendations }),
            });

            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "No se pudo firmar el reporte.");
            }
        } catch {
            setError("Error de conexión al firmar.");
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="analysis-editor-box">
            <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label className="analysis-editor-label" htmlFor="clinical-analysis" style={{ margin: 0 }}>
                    Interpretación Profesional
                    {!isSigned && <span className="analysis-editor-required">*</span>}
                </label>
                {!isSigned && (
                    <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: generatingAI ? "var(--color-text-muted)" : "linear-gradient(135deg, var(--color-primary), var(--color-teal-dark))",
                            color: "var(--color-primary-foreground)",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: generatingAI ? "not-allowed" : "pointer",
                            boxShadow: generatingAI ? "none" : "0 2px 8px rgba(0,154,128,0.35)",
                            transition: "all 0.2s",
                        }}
                        title="Generar interpretación profesional con Inteligencia Artificial"
                    >
                        {generatingAI
                            ? <><Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> Generando...</>
                            : <><Sparkles style={{ width: 13, height: 13 }} /> ✨ Generar con IA</>
                        }
                    </button>
                )}
            </div>

            {aiError && (
                <div className="no-print" style={{ marginBottom: "10px", padding: "8px 12px", background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)", borderRadius: "8px", fontSize: "0.75rem", border: "1px solid var(--color-risk-veryhigh-border)" }}>
                    ⚠️ {aiError}
                </div>
            )}

            {draft !== null && !isSigned && (
                <div
                    className="no-print"
                    style={{
                        marginBottom: "10px",
                        padding: "10px 12px",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderLeft: "3px solid #f59e0b",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        color: "#92400e",
                        lineHeight: 1.6,
                    }}
                >
                    <strong>Borrador generado automáticamente.</strong>{" "}
                    {isVerbatimDraft
                        ? "Este texto está tal como lo produjo la herramienta y no ha sido editado."
                        : "Este texto partió de un borrador automático y fue editado."}{" "}
                    La interpretación de la batería es un acto profesional reservado al psicólogo con licencia SST
                    (Res. 2646/2008 art. 12, Ley 1090/2006): revísalo, corrígelo y asúmelo antes de firmar.
                    {reviewedAt && !isDirty && (
                        <span style={{ display: "block", marginTop: "4px", color: "#3f6212" }}>
                            Revisión registrada el{" "}
                            {new Date(reviewedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}.
                        </span>
                    )}
                </div>
            )}

            <p className="analysis-editor-hint no-print">
                Escribe o genera con IA tu análisis clínico basado en los resultados. Este texto quedará registrado en el reporte firmado.
            </p>
            <textarea
                id="clinical-analysis"
                value={analysis}
                onChange={e => { setAnalysis(e.target.value); setError(""); }}
                placeholder="Haz clic en '✨ Generar con IA' para obtener un análisis automático basado en las puntuaciones, o escribe aquí manualmente..."
                rows={6}
                className="analysis-editor-textarea no-print"
            />
            <div className="analysis-editor-preview print-only">
                {analysis}
            </div>

            {error && (
                <div className="analysis-editor-error no-print">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {!isSigned && !hasSignature && (
                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "var(--color-risk-medium-bg)", border: "1px solid var(--color-risk-medium-border)", fontSize: "0.75rem", color: "var(--color-risk-medium-text)" }}>
                    <PenSquare style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} />
                    <span>Sin firma digital configurada — el PDF no incluirá imagen de firma. <Link href="/dashboard/profile" style={{ fontWeight: 600, textDecoration: "underline" }}>Configurar en perfil</Link>.</span>
                </div>
            )}

            {showSignButton && needsAcceptance && (
                <label
                    className="no-print"
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        marginTop: "0.65rem",
                        padding: "0.65rem 0.75rem",
                        borderRadius: "0.5rem",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.75rem",
                        color: "#334155",
                        lineHeight: 1.6,
                        cursor: "pointer",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
                        style={{ marginTop: "2px", flexShrink: 0 }}
                    />
                    <span>
                        He revisado esta interpretación, la corregí donde fue necesario y la asumo como mi
                        criterio profesional bajo mi firma y mi licencia.
                    </span>
                </label>
            )}

            {showSignButton && (
                <div className="analysis-editor-actions no-print">
                    <span className="analysis-editor-count">
                        {analysis.length} caracteres
                    </span>
                    <button
                        onClick={handleSign}
                        disabled={signing || !analysis.trim() || (needsAcceptance && !accepted)}
                        className="analysis-sign-btn"
                    >
                        {signing ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Firmando...</>
                        ) : isSigned && isDirty ? (
                            <><PenLine className="w-4 h-4" /> Actualizar firma</>
                        ) : (
                            <><PenLine className="w-4 h-4" /> Firmar Reporte</>
                        )}
                    </button>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
