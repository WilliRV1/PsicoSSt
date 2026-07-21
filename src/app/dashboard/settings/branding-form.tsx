"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SettingsData {
    logoUrl?: string | null;
    consultingRoomName?: string | null;
    primaryColor?: string | null;
}

export default function BrandingForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState<SettingsData>({
        logoUrl: "",
        consultingRoomName: "",
        primaryColor: "#0F172A",
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/profile/settings");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        logoUrl: data.logoUrl || "",
                        consultingRoomName: data.consultingRoomName || "",
                        primaryColor: data.primaryColor || "#0F172A",
                    });
                }
            } catch (error) {
                console.error("Error al cargar configuración", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/profile/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Error al guardar");

            toast.success("Configuración de marca guardada con éxito");
        } catch (error) {
            toast.error("Hubo un problema al guardar los cambios");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="text-sm text-muted-foreground animate-pulse">Cargando configuración...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="consultingRoomName" className="block text-sm font-medium text-foreground mb-1">
                        Nombre del Consultorio / Empresa
                    </label>
                    <input
                        type="text"
                        id="consultingRoomName"
                        name="consultingRoomName"
                        value={formData.consultingRoomName || ""}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        placeholder="Ej. Psicología Integral"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Aparecerá en la portada de los informes PDF.</p>
                </div>

                <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-foreground mb-1">
                        URL del Logotipo
                    </label>
                    <input
                        type="url"
                        id="logoUrl"
                        name="logoUrl"
                        value={formData.logoUrl || ""}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        placeholder="https://ejemplo.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Debe ser un enlace directo a una imagen (PNG o JPG).</p>
                </div>
            </div>

            <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-foreground mb-1">
                    Color Principal (Branding)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        id="primaryColor"
                        name="primaryColor"
                        value={formData.primaryColor || "#0F172A"}
                        onChange={handleChange}
                        className="h-10 w-20 rounded-md border border-border bg-background cursor-pointer"
                    />
                    <input
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor || "#0F172A"}
                        onChange={handleChange}
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                        placeholder="#0F172A"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Define el color de los títulos y barras en los informes PDF.</p>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? "Guardando..." : "Guardar Branding"}
                </button>
            </div>
        </form>
    );
}
