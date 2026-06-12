"use client";

import { useState, useRef, useEffect } from "react";
import SignaturePad from "signature_pad";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SignatureSectionProps {
    initialSignature?: string | null;
}

export default function SignatureSection({ initialSignature }: SignatureSectionProps) {
    const [signature, setSignature] = useState<string | null>(initialSignature || null);
    const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
    const [saving, setSaving] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === "draw" && canvasRef.current) {
            signaturePadRef.current = new SignaturePad(canvasRef.current, {
                backgroundColor: "rgb(255, 255, 255)",
                penColor: "rgb(0, 0, 0)"
            });
        }
    }, [activeTab]);

    const handleClear = () => {
        signaturePadRef.current?.clear();
    };

    const handleSaveDrawn = async () => {
        if (signaturePadRef.current?.isEmpty()) {
            alert("Por favor dibuja tu firma primero");
            return;
        }

        const dataUrl = signaturePadRef.current?.toDataURL("image/png");
        if (dataUrl) await saveSignature(dataUrl, "drawn");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            await saveSignature(dataUrl, "uploaded");
        };
        reader.readAsDataURL(file);
    };

    const saveSignature = async (dataUrl: string, type: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/profile/signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signatureData: dataUrl, type })
            });

            if (res.ok) {
                setSignature(dataUrl);
                alert("Firma guardada correctamente");
            } else {
                throw new Error("Error al guardar");
            }
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar la firma");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar tu firma?")) return;

        try {
            const res = await fetch("/api/profile/signature", { method: "DELETE" });
            if (res.ok) {
                setSignature(null);
                signaturePadRef.current?.clear();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Firma Digital del Profesional</h2>
                {signature && (
                    <button
                        onClick={handleDelete}
                        className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                        Eliminar Firma Existente
                    </button>
                )}
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visualización / Preview */}
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground font-medium">Vista previa de tu firma:</p>
                        <div className="border-2 border-dashed border-border rounded-xl p-4 h-48 flex items-center justify-center bg-muted overflow-hidden">
                            {signature ? (
                                <img src={signature} alt="Tu firma" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-center">
                                    <span className="text-4xl block mb-2">✍️</span>
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sin firma registrada</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Esta firma se aplicará automáticamente a todos tus informes PDF.</p>
                    </div>

                    {/* Editor */}
                    <div className="space-y-4">
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("draw")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "draw" ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Dibujar firma
                            </button>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "upload" ? "bg-card text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Subir imagen
                            </button>
                        </div>

                        {activeTab === "draw" ? (
                            <div className="space-y-3">
                                <div className="border border-input rounded-lg bg-card overflow-hidden shadow-inner">
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={150}
                                        className="w-full h-[150px] cursor-crosshair"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleClear} className="flex-1 text-xs py-2">Limpiar</Button>
                                    <Button
                                        onClick={handleSaveDrawn}
                                        disabled={saving}
                                        className="flex-1 text-xs py-2"
                                    >
                                        {saving ? "Guardando..." : "Guardar Dibujo"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer"
                                >
                                    <svg className="w-8 h-8 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    <p className="text-xs font-bold text-indigo-600">Haz clic para seleccionar archivo</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">PNG o JPG con fondo blanco/transparente</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
