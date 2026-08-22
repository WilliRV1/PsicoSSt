"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/psicosst/logo";

/**
 * Solicitud de acceso.
 *
 * Comparte el registro visual del inicio de sesión: fondo cálido de la
 * aplicación, acento teal plano y la serif de los informes en los titulares.
 */

type Campo =
    | "fullName"
    | "email"
    | "password"
    | "confirmPassword"
    | "licenseNumber"
    | "professionalCard"
    | "sstCredential";

const INICIAL: Record<Campo, string> = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    professionalCard: "",
    sstCredential: "",
};


/**
 * Campo del formulario.
 *
 * Vive a nivel de módulo, no dentro del componente: declarado dentro, React lo
 * trata como un tipo distinto en cada render, desmonta el input y lo vuelve a
 * montar, y el foco se pierde a cada tecla que se escribe.
 */
function Field({
    id,
    label,
    value,
    onChange,
    disabled,
    type = "text",
    placeholder,
}: {
    id: Campo;
    label: string;
    value: string;
    onChange: (field: Campo, value: string) => void;
    disabled: boolean;
    type?: string;
    placeholder: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-[11.5px] font-semibold uppercase tracking-[0.11em] text-text-muted"
                style={{ fontFamily: "var(--font-barlow)" }}
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(id, e.target.value)}
                placeholder={placeholder}
                required
                disabled={disabled}
                autoComplete={type === "password" ? "new-password" : "on"}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-[14px] text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-primary/12 disabled:opacity-50"
            />
        </div>
    );
}

function Seccion({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-secondary"
            style={{ fontFamily: "var(--font-barlow)" }}
        >
            {children}
        </p>
    );
}

export default function RegisterPage() {
    const [form, setForm] = useState(INICIAL);
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(field: Campo, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors([]);

        if (form.password !== form.confirmPassword) {
            setErrors(["Las contraseñas no coinciden."]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    fullName: form.fullName,
                    licenseNumber: form.licenseNumber,
                    professionalCard: form.professionalCard,
                    sstCredential: form.sstCredential,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErrors(data.details ?? [data.message]);
            } else {
                setSuccess(true);
                setSuccessMessage(data.message);
            }
        } catch {
            setErrors(["Error de conexión. Intenta de nuevo."]);
        } finally {
            setLoading(false);
        }
    }

    // ── Solicitud enviada ─────────────────────────────────────
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
                    <Logo size={34} />
                    <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light">
                            <CheckCircle2 className="h-7 w-7 text-primary" />
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <h1
                                className="text-[22px] font-semibold tracking-[-0.01em] text-foreground"
                                style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                            >
                                Solicitud enviada
                            </h1>
                            <p className="text-[13.5px] leading-relaxed text-text-secondary">
                                {successMessage ||
                                    "Tu solicitud está en revisión. Recibirás el acceso una vez verificadas tus credenciales profesionales."}
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                            style={{ fontFamily: "var(--font-barlow)" }}
                        >
                            Ir a iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Formulario ────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            {/* ── Formulario ─────────────────────────────────── */}
            <div className="flex w-full justify-center border-r border-border bg-surface p-8 lg:w-[560px] lg:shrink-0">
                <div className="flex w-full max-w-[372px] flex-col gap-7 py-8">
                    <Logo size={34} />

                    <div className="flex flex-col gap-1.5">
                        <h1
                            className="text-[32px] font-semibold leading-[1.12] tracking-[-0.01em] text-foreground"
                            style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                        >
                            Solicitar acceso
                        </h1>
                        <p className="text-[13.5px] leading-relaxed text-text-secondary">
                            Verificamos las credenciales de cada solicitante antes de conceder el
                            acceso. Suele tomar menos de 24 horas.
                        </p>
                    </div>

                    {errors.length > 0 && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-lg border border-danger/25 bg-danger/8 px-4 py-3 text-[13px] text-danger"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="flex flex-col gap-1">
                                {errors.map((err, i) => (
                                    <div key={i}>{err}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Seccion>Datos personales</Seccion>

                        <Field id="fullName" label="Nombre completo" placeholder="María Torres Gómez" value={form.fullName} onChange={updateField} disabled={loading} />
                        <Field
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            placeholder="psicologa@consultorio.co" value={form.email} onChange={updateField} disabled={loading} />

                        <div className="grid grid-cols-2 gap-3">
                            <Field
                                id="password"
                                label="Contraseña"
                                type="password"
                                placeholder="Mínimo 12 caracteres" value={form.password} onChange={updateField} disabled={loading} />
                            <Field
                                id="confirmPassword"
                                label="Confirmar"
                                type="password"
                                placeholder="Repítela" value={form.confirmPassword} onChange={updateField} disabled={loading} />
                        </div>

                        <Seccion>Credenciales profesionales</Seccion>

                        <Field
                            id="licenseNumber"
                            label="Licencia en SST"
                            placeholder="12345 de 2019" value={form.licenseNumber} onChange={updateField} disabled={loading} />
                        <Field id="professionalCard" label="Tarjeta profesional" placeholder="PS-98765" value={form.professionalCard} onChange={updateField} disabled={loading} />
                        <Field
                            id="sstCredential"
                            label="Posgrado en SST"
                            placeholder="Especialista en SST — Universidad, año" value={form.sstCredential} onChange={updateField} disabled={loading} />

                        <p className="pt-1 text-[11.5px] leading-relaxed text-text-muted">
                            Al solicitar acceso aceptas los{" "}
                            <Link
                                href="/terms"
                                target="_blank"
                                className="font-medium text-teal-dark hover:underline"
                            >
                                términos y condiciones
                            </Link>{" "}
                            y la{" "}
                            <Link
                                href="/privacy"
                                target="_blank"
                                className="font-medium text-teal-dark hover:underline"
                            >
                                política de privacidad
                            </Link>
                            .
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 flex h-11.5 items-center justify-center gap-2 rounded-lg bg-primary text-[15.5px] font-semibold tracking-[0.03em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={{ fontFamily: "var(--font-barlow)" }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando…
                                </>
                            ) : (
                                "Enviar solicitud"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[13px] text-text-secondary">
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/login" className="font-medium text-teal-dark hover:underline">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>

            {/* ── Panel editorial ────────────────────────────── */}
            <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-14 lg:flex">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-28 -top-24 h-[380px] w-[380px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 7%, transparent) 0%, transparent 68%)",
                    }}
                />

                <div className="relative flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span
                        className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-secondary"
                        style={{ fontFamily: "var(--font-barlow)" }}
                    >
                        Acceso verificado
                    </span>
                </div>

                <div className="relative flex flex-col gap-7">
                    <div className="flex flex-col gap-4">
                        <h2
                            className="max-w-[470px] text-[42px] font-semibold leading-[1.1] tracking-[-0.015em] text-balance text-foreground"
                            style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                        >
                            Sólo un profesional con licencia puede firmar estos informes
                        </h2>
                        <p className="max-w-[430px] text-[15px] leading-relaxed text-text-secondary">
                            La Resolución 2764 de 2022 reserva la aplicación e interpretación de la
                            Batería a psicólogos con licencia vigente en Seguridad y Salud en el
                            Trabajo. Por eso verificamos antes de dar acceso.
                        </p>
                    </div>

                    <ul className="flex max-w-[440px] flex-col gap-3">
                        {[
                            "Licencia en SST vigente y su fecha de expedición",
                            "Tarjeta profesional de psicólogo",
                            "Posgrado en Seguridad y Salud en el Trabajo",
                        ].map(item => (
                            <li key={item} className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-[17px] w-[17px] shrink-0 text-primary" />
                                <span className="text-[13.5px] leading-snug text-text-secondary">
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-[11.5px] text-text-muted">
                    PsicoSST © {new Date().getFullYear()} · Información sujeta a reserva profesional,
                    Ley 1090 de 2006
                </p>
            </div>
        </div>
    );
}
