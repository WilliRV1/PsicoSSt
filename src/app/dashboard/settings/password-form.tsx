"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function PasswordForm() {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/profile/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "Contraseña actualizada correctamente." });
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setMessage({ type: "error", text: data.error || "No se pudo cambiar la contraseña." });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión." });
        } finally {
            setSaving(false);
        }
    };

    const strength = form.newPassword.length === 0 ? 0
        : form.newPassword.length < 8 ? 1
        : form.newPassword.length < 12 ? 2
        : 3;

    const strengthLabel = ["", "Débil", "Aceptable", "Fuerte"];
    const strengthColor = ["", "bg-red-500", "bg-yellow-400", "bg-emerald-500"];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                    message.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                }`}>
                    {message.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Current password */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contraseña actual</label>
                <div className="relative">
                    <input
                        type={showCurrent ? "text" : "password"}
                        value={form.currentPassword}
                        onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
                <div className="relative">
                    <input
                        type={showNew ? "text" : "password"}
                        value={form.newPassword}
                        onChange={e => setForm({ ...form, newPassword: e.target.value })}
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {form.newPassword.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1 flex-1">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                        i <= strength ? strengthColor[strength] : "bg-muted"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{strengthLabel[strength]}</span>
                    </div>
                )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirmar nueva contraseña</label>
                <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        form.confirmPassword && form.newPassword !== form.confirmPassword
                            ? "border-red-400"
                            : "border-border focus:border-primary"
                    }`}
                    placeholder="••••••••"
                />
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                    <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
                )}
            </div>

            <div className="pt-2 flex justify-end">
                <button
                    type="submit"
                    disabled={saving || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Actualizando..." : "Cambiar contraseña"}
                </button>
            </div>
        </form>
    );
}
