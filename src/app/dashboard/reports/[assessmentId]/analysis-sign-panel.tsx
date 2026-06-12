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
}

export default function AnalysisSignPanel({
    assessmentId,
    isSigned,
    initialAnalysis,
    savedRecommendations,
    hasSignature = false,
}: AnalysisSignPanelProps) {
    const router = useRouter();
    const [analysis, setAnalysis] = useState(initialAnalysis || "");
    const [signing, setSigning] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [error, setError] = useState("");
    const [aiError, setAiError] = useState("");

    const isDirty = analysis.trim() !== (initialAnalysis || "").trim();
    const showSignButton = !isSigned || isDirty;

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
        if (!confirm("¿Confirmas que deseas firmar este reporte?")) {
            return;
        }

        setSigning(true);
        setError("");

        try {
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
                            background: generatingAI ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: generatingAI ? "not-allowed" : "pointer",
                            boxShadow: generatingAI ? "none" : "0 2px 8px rgba(124,58,237,0.35)",
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
                <div className="no-print" style={{ marginBottom: "10px", padding: "8px 12px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "0.75rem", border: "1px solid #fecaca" }}>
                    ⚠️ {aiError}
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
                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "#fefce8", border: "1px solid #fde68a", fontSize: "0.75rem", color: "#92400e" }}>
                    <PenSquare style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} />
                    <span>Sin firma digital configurada — el PDF no incluirá imagen de firma. <Link href="/dashboard/profile" style={{ fontWeight: 600, textDecoration: "underline" }}>Configurar en perfil</Link>.</span>
                </div>
            )}

            {showSignButton && (
                <div className="analysis-editor-actions no-print">
                    <span className="analysis-editor-count">
                        {analysis.length} caracteres
                    </span>
                    <button
                        onClick={handleSign}
                        disabled={signing || !analysis.trim()}
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
