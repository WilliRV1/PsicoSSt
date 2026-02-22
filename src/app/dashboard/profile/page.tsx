"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SignaturePad from "signature_pad";
import { Upload, Trash2, Save, Loader2, User, FileSignature } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sigSaving, setSigSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [signatureMessage, setSignatureMessage] = useState({ text: "", type: "" });
    const [activeSignatureTab, setActiveSignatureTab] = useState<"draw" | "upload">("draw");
    const [profile, setProfile] = useState({
        fullName: "",
        licenseNumber: "",
        professionalCard: "",
        sstCredential: "",
    });
    const [savedSignatures, setSavedSignatures] = useState<{
        drawn?: { dataUrl?: string | null; uploadedAt?: string } | null;
        uploaded?: { imageUrl?: string | null; fileName?: string | null; uploadedAt?: string } | null;
    }>({});

    // Draw
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);
    const canvasInitialized = useRef(false);

    // Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadPreview, setUploadPreview] = useState<string>("");

    // Load profile + signatures
    useEffect(() => {
        const load = async () => {
            try {
                const [profileRes, sigRes] = await Promise.all([
                    fetch("/api/profile"),
                    fetch("/api/profile/signature"),
                ]);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile({
                        fullName: data.fullName || "",
                        licenseNumber: data.licenseNumber || "",
                        professionalCard: data.professionalCard || "",
                        sstCredential: data.sstCredential || "",
                    });
                }
                if (sigRes.ok) {
                    const sigData = await sigRes.json();
                    setSavedSignatures(sigData);
                    if (sigData.uploaded?.imageUrl) {
                        setUploadPreview(sigData.uploaded.imageUrl);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Initialize signature pad when draw tab is active
    useEffect(() => {
        if (activeSignatureTab === "draw" && canvasRef.current && !canvasInitialized.current) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width || 680;
            canvas.height = 200;
            const pad = new SignaturePad(canvas, {
                backgroundColor: "rgb(255, 255, 255)",
                penColor: "rgb(0, 81, 186)",
            });
            signaturePadRef.current = pad;
            canvasInitialized.current = true;
            if (savedSignatures.drawn?.dataUrl) {
                pad.fromDataURL(savedSignatures.drawn.dataUrl);
            }
        }
    }, [activeSignatureTab, savedSignatures.drawn?.dataUrl]);

    const saveProfile = async () => {
        setSaving(true);
        setMessage({ text: "", type: "" });
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "✓ Perfil actualizado correctamente.", type: "success" });
            } else {
                setMessage({ text: data.error || "Error al actualizar.", type: "error" });
            }
        } catch {
            setMessage({ text: "Error de conexión.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const saveDrawnSignature = async () => {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
            setSignatureMessage({ text: "Dibuja tu firma antes de guardar.", type: "error" });
            return;
        }
        setSigSaving(true);
        setSignatureMessage({ text: "", type: "" });
        try {
            const dataUrl = signaturePadRef.current.toDataURL("image/png");
            const res = await fetch("/api/profile/signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signatureType: "drawn", dataUrl }),
            });
            if (res.ok) {
                setSavedSignatures(prev => ({ ...prev, drawn: { dataUrl, uploadedAt: new Date().toISOString() } }));
                setSignatureMessage({ text: "✓ Firma guardada correctamente.", type: "success" });
            } else {
                setSignatureMessage({ text: "Error al guardar la firma.", type: "error" });
            }
        } catch {
            setSignatureMessage({ text: "Error de conexión.", type: "error" });
        } finally {
            setSigSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setSignatureMessage({ text: "Solo se permiten archivos JPG o PNG.", type: "error" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSignatureMessage({ text: "El archivo no puede superar 5 MB.", type: "error" });
            return;
        }
        setSigSaving(true);
        setSignatureMessage({ text: "", type: "" });
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            setUploadPreview(base64);
            try {
                const res = await fetch("/api/profile/signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ signatureType: "uploaded", imageUrl: base64, fileName: file.name }),
                });
                if (res.ok) {
                    setSavedSignatures(prev => ({
                        ...prev,
                        uploaded: { imageUrl: base64, fileName: file.name, uploadedAt: new Date().toISOString() },
                    }));
                    setSignatureMessage({ text: "✓ Firma subida correctamente.", type: "success" });
                } else {
                    setSignatureMessage({ text: "Error al subir la firma.", type: "error" });
                }
            } catch {
                setSignatureMessage({ text: "Error de conexión.", type: "error" });
            } finally {
                setSigSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const deleteSignature = async (type: "drawn" | "uploaded") => {
        if (!confirm(`¿Eliminar la firma ${type === "drawn" ? "dibujada" : "subida"}?`)) return;
        try {
            const res = await fetch(`/api/profile/signature?signatureType=${type}`, { method: "DELETE" });
            if (res.ok) {
                setSavedSignatures(prev => ({ ...prev, [type]: null }));
                if (type === "drawn") {
                    signaturePadRef.current?.clear();
                } else {
                    setUploadPreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
                setSignatureMessage({ text: "Firma eliminada.", type: "success" });
            }
        } catch {
            setSignatureMessage({ text: "Error al eliminar la firma.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#666666]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0051BA]" />
                    <span>Cargando perfil...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0051BA] font-semibold mb-8 hover:underline text-sm">
                    ← Volver al Dashboard
                </Link>

                {/* ─── DATOS DEL PERFIL ─── */}
                <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm mb-8">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E8E8E8]">
                        <User className="w-5 h-5 text-[#0051BA]" />
                        <h2 className="text-lg font-semibold text-[#212121]">Datos Profesionales</h2>
                    </div>
                    <div className="px-6 py-6">
                        {message.text && (
                            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-[#C8E6C9] text-[#2E7D32]" : "bg-[#FFCDD2] text-[#B71C1C]"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            {[
                                { label: "Nombre Completo", key: "fullName" },
                                { label: "Número de Licencia", key: "licenseNumber" },
                                { label: "Tarjeta Profesional", key: "professionalCard" },
                                { label: "Credencial SST", key: "sstCredential" },
                            ].map(({ label, key }) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-[#0051BA] uppercase tracking-wide mb-1.5">{label}</label>
                                    <input
                                        type="text"
                                        value={profile[key as keyof typeof profile]}
                                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-[#E8E8E8] rounded-lg text-[#212121] text-sm focus:outline-none focus:border-[#0051BA] focus:ring-2 focus:ring-[#0051BA]/20 transition"
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={saveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0051BA] text-white rounded-lg text-sm font-semibold hover:bg-[#003D8A] disabled:opacity-60 transition"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Guardando..." : "Guardar Perfil"}
                        </button>
                    </div>
                </div>

                {/* ─── FIRMA DIGITAL ─── */}
                <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E8E8E8]">
                        <FileSignature className="w-5 h-5 text-[#0051BA]" />
                        <h2 className="text-lg font-semibold text-[#212121]">Firma Digital</h2>
                        <span className="ml-auto text-xs text-[#666666]">Se incluirá en todos tus informes</span>
                    </div>
                    <div className="px-6 py-6">
                        {signatureMessage.text && (
                            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${signatureMessage.type === "success" ? "bg-[#C8E6C9] text-[#2E7D32]" : "bg-[#FFCDD2] text-[#B71C1C]"}`}>
                                {signatureMessage.text}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-[#E8E8E8] mb-6">
                            {(["draw", "upload"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSignatureTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeSignatureTab === tab ? "border-[#0051BA] text-[#0051BA]" : "border-transparent text-[#666666] hover:text-[#212121]"}`}
                                >
                                    {tab === "draw" ? "✏️ Dibujar" : "📤 Subir imagen"}
                                </button>
                            ))}
                        </div>

                        {/* ─── DIBUJAR ─── */}
                        {activeSignatureTab === "draw" && (
                            <div className="space-y-4">
                                <p className="text-xs text-[#666666]">Dibuja tu firma con el cursor o dedo (dispositivo táctil)</p>
                                <div className="border-2 border-dashed border-[#0051BA]/40 rounded-lg overflow-hidden bg-white">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full cursor-crosshair block"
                                        style={{ height: "180px", touchAction: "none" }}
                                    />
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <button
                                        onClick={() => { signaturePadRef.current?.clear(); }}
                                        className="px-4 py-2 text-sm border border-[#E8E8E8] rounded-lg text-[#666666] hover:bg-[#F5F5F5] transition"
                                    >
                                        Borrar
                                    </button>
                                    <button
                                        onClick={saveDrawnSignature}
                                        disabled={sigSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0051BA] text-white text-sm rounded-lg font-medium hover:bg-[#003D8A] disabled:opacity-60 transition"
                                    >
                                        {sigSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {sigSaving ? "Guardando..." : "Guardar firma dibujada"}
                                    </button>
                                    {savedSignatures.drawn?.dataUrl && (
                                        <button
                                            onClick={() => deleteSignature("drawn")}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#FFCDD2] text-[#B71C1C] text-sm rounded-lg font-medium hover:bg-[#EF9A9A] transition"
                                        >
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    )}
                                </div>
                                {savedSignatures.drawn?.dataUrl && (
                                    <div className="p-3 bg-[#F5F5F5] rounded-lg">
                                        <p className="text-xs text-[#666666] mb-2 font-medium">Firma guardada actualmente:</p>
                                        <img src={savedSignatures.drawn.dataUrl} alt="Firma guardada" className="max-h-16 border border-[#E8E8E8] rounded bg-white p-1" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── SUBIR IMAGEN ─── */}
                        {activeSignatureTab === "upload" && (
                            <div className="space-y-4">
                                <p className="text-xs text-[#666666]">Sube una imagen de tu firma (JPG o PNG, máx. 5 MB)</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sigSaving}
                                    className="w-full py-10 border-2 border-dashed border-[#0051BA]/40 rounded-lg hover:bg-[#F5F5F5] transition flex flex-col items-center gap-2 disabled:opacity-60"
                                >
                                    <Upload className="w-6 h-6 text-[#0051BA]" />
                                    <span className="text-sm font-medium text-[#0051BA]">Haz clic para seleccionar archivo</span>
                                    <span className="text-xs text-[#999999]">JPG o PNG · máx. 5 MB</span>
                                </button>

                                {uploadPreview && (
                                    <div className="p-4 bg-[#F5F5F5] rounded-lg space-y-3">
                                        <p className="text-xs text-[#666666] font-medium">
                                            Vista previa{savedSignatures.uploaded?.fileName ? ` — ${savedSignatures.uploaded.fileName}` : ""}:
                                        </p>
                                        <img src={uploadPreview} alt="Vista previa firma" className="max-h-24 border border-[#E8E8E8] rounded bg-white p-1" />
                                        <button
                                            onClick={() => deleteSignature("uploaded")}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-[#FFCDD2] text-[#B71C1C] text-xs rounded-lg font-medium hover:bg-[#EF9A9A] transition"
                                        >
                                            <Trash2 className="w-3 h-3" /> Eliminar firma
                                        </button>
                                    </div>
                                )}

                                {!uploadPreview && (
                                    <div className="text-xs text-[#999999] bg-[#FFFDE7] border border-[#FFE082] rounded-lg p-3">
                                        💡 <strong>Consejo:</strong> Firma en papel blanco con tinta negra, toma una foto y recórtala antes de subir.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
