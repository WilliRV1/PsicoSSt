"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save, RotateCcw, CheckCircle } from "lucide-react";

interface Props {
    assessmentId: string;
    initialRecommendations?: string | null;
    isSigned: boolean;
}

export default function AIRecommendationsSection({ assessmentId, initialRecommendations, isSigned }: Props) {
    const [recommendations, setRecommendations] = useState(initialRecommendations || "");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(!!initialRecommendations);
    const [error, setError] = useState("");

    const generateWithAI = async () => {
        setGenerating(true);
        setError("");
        try {
            const res = await fetch("/api/ai/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId }),
            });
            const data = await res.json();
            if (res.ok && data.recommendations) {
                setRecommendations(data.recommendations);
                setSaved(true);
            } else {
                setError(data.error || "No se pudo generar. Verifica tu clave de OpenRouter en .env.local");
            }
        } catch {
            setError("Error de conexión al generar recomendaciones.");
        } finally {
            setGenerating(false);
        }
    };

    const saveRecommendations = async () => {
        if (!recommendations.trim()) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/ai/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId, overrideText: recommendations }),
            });
            if (res.ok) {
                setSaved(true);
            }
        } catch {
            setError("Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="analysis-box no-print" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <label style={{ margin: 0 }}>Recomendaciones y Próximos Pasos</label>
                <button
                    onClick={generateWithAI}
                    disabled={generating}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: generating ? "#94a3b8" : "linear-gradient(135deg, #0051BA, #1E88E5)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: generating ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: generating ? "none" : "0 2px 8px rgba(0,81,186,0.3)",
                    }}
                    title="Generar recomendaciones con Inteligencia Artificial"
                >
                    {generating
                        ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Generando...</>
                        : <><Sparkles style={{ width: 14, height: 14 }} /> ✨ Generar con IA</>
                    }
                </button>
            </div>

            {error && (
                <div style={{ marginBottom: "10px", padding: "10px 14px", background: "#FFCDD2", color: "#B71C1C", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid #EF9A9A" }}>
                    ⚠️ {error}
                </div>
            )}

            <textarea
                value={recommendations}
                onChange={e => { setRecommendations(e.target.value); setSaved(false); }}
                placeholder="Haz clic en '✨ Generar con IA' para obtener recomendaciones automáticas, o escribe aquí manualmente..."
                rows={8}
                style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E8E8E8",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    color: "#212121",
                }}
                onFocus={e => { e.target.style.borderColor = "#0051BA"; }}
                onBlur={e => { e.target.style.borderColor = "#E8E8E8"; }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                {recommendations && !saved && (
                    <button
                        onClick={saveRecommendations}
                        disabled={saving}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 14px",
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {saving ? <Loader2 style={{ width: 13, height: 13 }} /> : <Save style={{ width: 13, height: 13 }} />}
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                )}
                {saved && recommendations && (
                    <span style={{ fontSize: "0.75rem", color: "#4CAF50", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle style={{ width: 13, height: 13 }} /> Guardado
                    </span>
                )}
                {recommendations && (
                    <button
                        onClick={() => { setRecommendations(""); setSaved(false); }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "7px 12px",
                            background: "transparent",
                            color: "#999",
                            border: "1px solid #E8E8E8",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                        }}
                    >
                        <RotateCcw style={{ width: 12, height: 12 }} /> Limpiar
                    </button>
                )}
            </div>

            <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "8px" }}>
                💡 Puedes editar el texto generado antes de firmar. Se incluirá en el PDF del informe.
            </p>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
