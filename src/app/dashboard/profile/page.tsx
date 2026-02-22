"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [profile, setProfile] = useState({
        fullName: "",
        licenseNumber: "",
        professionalCard: "",
        sstCredential: "",
        signature: ""
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                // If signature exists, we could draw it, but for simplicity we'll just show it below or allow clearing
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Canvas Logic
    useEffect(() => {
        if (!canvasRef.current || loading) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
        }
    }, [loading]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ("touches" in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        setMessage({ text: "", type: "" });

        let signatureBase64 = profile.signature;
        const canvas = canvasRef.current;

        // Only update signature if canvas is not blank (simplified check)
        // In a real app we'd check if drawing happened
        if (canvas) {
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            if (canvas.toDataURL() !== blank.toDataURL()) {
                signatureBase64 = canvas.toDataURL("image/png");
            }
        }

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...profile, signature: signatureBase64 })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "Perfil actualizado correctamente.", type: "success" });
                setProfile(prev => ({ ...prev, signature: signatureBase64 }));
            } else {
                setMessage({ text: data.error || "Error al actualizar.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Error de conexión.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "white", fontSize: "1.2rem" }}>Cargando perfil...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", padding: "40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/dashboard" style={{ color: "#6366f1", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontWeight: 600 }}>
                    ← Volver al Dashboard
                </Link>

                <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "24px", padding: "40px" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>Mi Perfil Profesional</h1>
                    <p style={{ color: "#94a3b8", marginBottom: "32px" }}>Gestiona tus credenciales y firma digital para los informes legales.</p>

                    {message.text && (
                        <div style={{ padding: "16px", borderRadius: "12px", marginBottom: "24px", background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: message.type === "success" ? "#4ade80" : "#f87171", border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>Nombre Completo</label>
                            <input
                                type="text"
                                value={profile.fullName}
                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                style={{ width: "100%", padding: "12px 16px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", color: "white", outline: "none" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>Número de Licencia</label>
                            <input
                                type="text"
                                value={profile.licenseNumber}
                                onChange={e => setProfile({ ...profile, licenseNumber: e.target.value })}
                                style={{ width: "100%", padding: "12px 16px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", color: "white", outline: "none" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>Tarjeta Profesional</label>
                            <input
                                type="text"
                                value={profile.professionalCard}
                                onChange={e => setProfile({ ...profile, professionalCard: e.target.value })}
                                style={{ width: "100%", padding: "12px 16px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", color: "white", outline: "none" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>Credencial SST</label>
                            <input
                                type="text"
                                value={profile.sstCredential}
                                onChange={e => setProfile({ ...profile, sstCredential: e.target.value })}
                                style={{ width: "100%", padding: "12px 16px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", color: "white", outline: "none" }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "32px" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>Firma Digital (Trazar abajo)</label>
                        <div style={{ background: "rgba(15,23,42,0.8)", border: "2px dashed rgba(99,102,241,0.3)", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
                            <canvas
                                ref={canvasRef}
                                width={720}
                                height={200}
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseMove={draw}
                                onMouseOut={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchEnd={stopDrawing}
                                onTouchMove={draw}
                                style={{ width: "100%", height: "200px", cursor: "crosshair", display: "block" }}
                            />
                            <button
                                onClick={clearCanvas}
                                style={{ position: "absolute", bottom: "12px", right: "12px", padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                                Limpiar Firma
                            </button>
                        </div>
                    </div>

                    {profile.signature && (
                        <div style={{ marginBottom: "32px" }}>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "12px" }}>Firma Actual en Sistema:</label>
                            <div style={{ background: "white", padding: "10px", borderRadius: "12px", display: "inline-block" }}>
                                <img src={profile.signature} alt="Firma" style={{ maxHeight: "80px", display: "block" }} />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={saveProfile}
                        disabled={saving}
                        style={{ width: "100%", padding: "16px", background: "#6366f1", border: "none", borderRadius: "16px", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer", transition: "all 0.2s" }}
                    >
                        {saving ? "Guardando..." : "Guardar Perfil y Firma"}
                    </button>
                </div>
            </div>
        </div>
    );
}
