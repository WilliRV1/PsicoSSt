"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/psicosst/logo";

/**
 * Pantalla de acceso.
 *
 * Toma el color de los tokens de `globals.css` en lugar de llevarlo escrito,
 * como estaba antes: así un cambio de marca alcanza también al acceso. La
 * serif de los titulares es la misma de los informes, para que entrar a la
 * plataforma y abrir un documento se lean como el mismo producto.
 */

const ARGUMENTOS = [
    {
        titulo: "Calificación conforme a los manuales",
        nota: "Baremos, factores de transformación e ítems inversos verificados contra las tablas oficiales.",
    },
    {
        titulo: "Informes listos para entregar",
        nota: "Individual, diagnóstico, SVE, colectivo y plan de intervención, compuestos y firmados.",
    },
    {
        titulo: "Trazabilidad hasta la respuesta",
        nota: "Cada puntaje se puede reconstruir desde los ítems que lo originaron.",
    },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", { email, password, redirect: false });

            if (result?.error) {
                if (result.error.includes("ACCOUNT_LOCKED")) {
                    setError("Cuenta bloqueada por múltiples intentos fallidos. Intenta en 15 minutos.");
                } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
                    setError("Tu cuenta ha sido suspendida. Contacta al administrador.");
                } else if (result.error.includes("ACCOUNT_INACTIVE")) {
                    setError("Tu cuenta está inactiva.");
                } else {
                    setError("Credenciales inválidas. Verifica tu correo y contraseña.");
                }
                setLoading(false);
            } else {
                // El indicador de carga sigue hasta que la navegación termina.
                router.push("/dashboard");
            }
        } catch {
            setError("Error de conexión. Intenta de nuevo.");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* ── Acceso ─────────────────────────────────────── */}
            <div className="flex w-full items-center justify-center border-r border-border bg-surface p-8 lg:w-[560px] lg:shrink-0">
                <div className="flex w-full max-w-[372px] flex-col gap-8">
                    <Logo size={34} />

                    <div className="flex flex-col gap-1.5">
                        <h1
                            className="text-[32px] font-semibold leading-[1.12] tracking-[-0.01em] text-foreground"
                            style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                        >
                            Iniciar sesión
                        </h1>
                        <p className="text-[13.5px] leading-relaxed text-text-secondary">
                            Acceso restringido a profesionales con licencia vigente en Seguridad y
                            Salud en el Trabajo.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-lg border border-danger/25 bg-danger/8 px-4 py-3 text-[13px] text-danger"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="email"
                                className="text-[11.5px] font-semibold uppercase tracking-[0.11em] text-text-muted"
                                style={{ fontFamily: "var(--font-barlow)" }}
                            >
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="psicologa@consultorio.co"
                                autoComplete="email"
                                autoFocus
                                required
                                disabled={loading}
                                className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-[14px] text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-primary/12 disabled:opacity-50"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-[11.5px] font-semibold uppercase tracking-[0.11em] text-text-muted"
                                    style={{ fontFamily: "var(--font-barlow)" }}
                                >
                                    Contraseña
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[12px] text-teal-dark hover:underline"
                                >
                                    ¿La olvidaste?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 pr-11 text-[14px] text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-primary/12 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                                >
                                    {showPass ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 flex h-11.5 items-center justify-center gap-2 rounded-lg bg-primary text-[15.5px] font-semibold tracking-[0.03em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={{ fontFamily: "var(--font-barlow)" }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verificando…
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>

                    <div className="flex flex-col gap-4.5">
                        <p className="text-center text-[13px] text-text-secondary">
                            ¿Aún no tienes cuenta?{" "}
                            <Link href="/register" className="font-medium text-teal-dark hover:underline">
                                Solicitar acceso
                            </Link>
                        </p>
                        <div className="h-px bg-border-muted" />
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="mt-0.5 h-[15px] w-[15px] shrink-0 text-text-muted" />
                            <p className="text-[12px] leading-relaxed text-text-muted">
                                Cada acceso queda registrado. Los datos de los trabajadores están
                                sujetos a reserva profesional y custodia por veinte años.
                            </p>
                        </div>
                    </div>
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
                        Resolución 2764 de 2022
                    </span>
                </div>

                <div className="relative flex flex-col gap-7">
                    <div className="flex flex-col gap-4">
                        <h2
                            className="max-w-[480px] text-[44px] font-semibold leading-[1.1] tracking-[-0.015em] text-balance text-foreground"
                            style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                        >
                            La Batería, calificada como manda el manual
                        </h2>
                        <p className="max-w-[430px] text-[15px] leading-relaxed text-text-secondary">
                            Baremos oficiales, informes que resisten una inspección y trazabilidad de
                            cada puntaje hasta la respuesta que lo originó.
                        </p>
                    </div>

                    <ul className="flex max-w-[460px] flex-col gap-3.5">
                        {ARGUMENTOS.map(({ titulo, nota }) => (
                            <li
                                key={titulo}
                                className="flex items-start gap-3.5 rounded-xl border border-border-muted bg-surface px-4.5 py-4"
                            >
                                <span className="mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-teal-light">
                                    <ShieldCheck className="h-[15px] w-[15px] text-primary" />
                                </span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-[13.5px] font-medium leading-snug text-foreground">
                                        {titulo}
                                    </span>
                                    <span className="text-[12.5px] leading-relaxed text-text-secondary">
                                        {nota}
                                    </span>
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
