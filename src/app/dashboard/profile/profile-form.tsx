"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
    initialData: {
        fullName: string;
        licenseNumber: string;
        professionalCard: string;
        sstCredential: string;
        email: string;
    };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState(initialData);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: "Información actualizada correctamente" });
                router.refresh(); // Actualiza los datos en el servidor (header, etc)
            } else {
                setMessage({ type: 'error', text: data.error || "Ocurrió un error" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Fallo de conexión con el servidor" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-bold text-foreground">Datos Profesionales</h2>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Asegúrate de que tus credenciales coincidan con tu licencia SST física.</p>
            </CardHeader>

            <CardContent>
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm font-bold animate-in flex items-center gap-2 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label className="mb-2">Nombre Completo</Label>
                            <Input
                                type="text"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label className="mb-2">Email (No editable)</Label>
                            <Input
                                type="email"
                                className="bg-muted text-muted-foreground cursor-not-allowed"
                                value={formData.email}
                                disabled
                            />
                        </div>

                        <div>
                            <Label className="mb-2">Licencia SST</Label>
                            <Input
                                type="text"
                                value={formData.licenseNumber}
                                onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label className="mb-2">Tarjeta Profesional</Label>
                            <Input
                                type="text"
                                value={formData.professionalCard}
                                onChange={e => setFormData({...formData, professionalCard: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label className="mb-2">Credencial Posgrado SST</Label>
                            <Input
                                type="text"
                                value={formData.sstCredential}
                                onChange={e => setFormData({...formData, sstCredential: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="px-10"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Guardando cambios...
                                </>
                            ) : "Actualizar Información"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
