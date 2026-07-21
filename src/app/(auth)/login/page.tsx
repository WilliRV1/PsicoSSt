"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Check } from "lucide-react";

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
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("ACCOUNT_LOCKED")) {
                    setError("Cuenta bloqueada por multiples intentos fallidos. Intenta en 15 minutos.");
                } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
                    setError("Tu cuenta ha sido suspendida. Contacta al administrador.");
                } else if (result.error.includes("ACCOUNT_INACTIVE")) {
                    setError("Tu cuenta esta inactiva.");
                } else {
                    setError("Credenciales invalidas. Verifica tu email y contrasena.");
                }
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Error de conexion. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left panel - branding (Clinical & Tech Trust) */}
            <div className="hidden w-[40%] flex-col justify-between bg-[#0F172A] p-12 lg:flex relative overflow-hidden">
                {/* Subtle abstract illustration (neural network / connections) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(20, 184, 166, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)`
                }}>
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                                <circle cx="40" cy="40" r="1.5" fill="currentColor" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <Logo light />
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Cumple Res. 2646 de 2008 & 2764 de 2022
                    </div>
                </div>

                <div className="space-y-6 relative z-10 font-heading">
                    <h2 className="text-3xl font-bold leading-tight text-white text-balance tracking-tight">
                        Plataforma clínica para la gestión del Riesgo Psicosocial
                    </h2>
                    <ul className="space-y-4 text-slate-300">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-400">
                                <Check className="w-3.5 h-3.5 font-bold" />
                            </div>
                            <span>Calificación automática precisa</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-400">
                                <Check className="w-3.5 h-3.5 font-bold" />
                            </div>
                            <span>Custodia legal y cifrado SHA-256</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-400">
                                <Check className="w-3.5 h-3.5 font-bold" />
                            </div>
                            <span>Analítica organizacional en tiempo real</span>
                        </li>
                    </ul>
                </div>
                
                <div className="relative z-10">
                    <p className="text-sm text-slate-500">PsicoSST © {new Date().getFullYear()}</p>
                </div>
            </div>

            {/* Right panel - form (60%) */}
            <div className="flex flex-1 items-center justify-center p-6 bg-background">
                <div className="w-full max-w-sm space-y-10">
                    <div className="lg:hidden flex justify-center mb-8">
                        <Logo />
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-[28px] font-bold text-foreground font-heading tracking-tight">Iniciar sesión</h1>
                        <p className="text-[15px] text-text-secondary">
                            Ingresa tus credenciales clínicas
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[13px] font-medium text-text">
                                Correo electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="psicologa@empresa.com"
                                className="h-11"
                                autoComplete="email"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-[13px] font-medium text-text">
                                    Contraseña
                                </Label>
                                <Link href="/forgot-password" className="text-[12px] font-medium text-text-secondary hover:text-primary transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 pr-10"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                            <label htmlFor="remember" className="text-[13px] text-text-secondary cursor-pointer">
                                Recordarme
                            </label>
                        </div>

                        <Button type="submit" className="w-full h-11 text-[15px] font-medium" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Autenticando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-text-muted font-medium">O</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-11 text-[15px] font-medium text-text-secondary hover:text-text bg-surface hover:bg-surface-muted" disabled>
                        Continuar con Microsoft (Próximamente)
                    </Button>
                </div>
            </div>
        </div>
    );
}
