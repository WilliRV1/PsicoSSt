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
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

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
            {/* Left panel - branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 lg:flex">
                <Logo light />
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold leading-tight text-sidebar-foreground text-balance">
                        Gestiona la Bateria de Riesgo Psicosocial de forma profesional
                    </h2>
                    <p className="text-sidebar-foreground/60 leading-relaxed">
                        Plataforma disenada para psicologos de Seguridad y Salud en el Trabajo en Colombia, conforme a la
                        Resolucion 2764 de 2022.
                    </p>
                </div>
                <div className="space-y-3">
                    {[
                        { stat: "2.764", label: "Resolucion regulatoria" },
                        { stat: "5 niveles", label: "Clasificacion de riesgo" },
                        { stat: "100%", label: "Cumplimiento normativo" },
                    ].map(({ stat, label }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                            <span className="text-sm font-medium text-sidebar-foreground">{stat}</span>
                            <span className="text-sm text-sidebar-foreground/50">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden">
                        <Logo />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-foreground">Iniciar sesion</h1>
                        <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder a la plataforma</p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Correo electronico
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="psicologa@empresa.com"
                                    className="pl-9"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Contrasena
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9 pr-10"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                "Ingresar a PsicoSST"
                            )}
                        </Button>
                    </form>

                    <div className="flex items-center justify-between text-sm">
                        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
                            Olvidaste tu contrasena?
                        </Link>
                        <Link href="/register" className="font-medium text-primary hover:underline">
                            Registrate aqui
                        </Link>
                    </div>

                    <p className="text-center text-xs text-muted-foreground/60">
                        Uso exclusivo para Psicologos con Licencia en SST vigente.
                        <br />
                        Cumplimiento Ley 1090 de 2006 y Resolucion 2764 de 2022.
                    </p>

                    <div className="text-center text-xs text-muted-foreground/50 space-x-3">
                        <Link href="/terms" className="hover:text-muted-foreground" target="_blank">
                            Terminos y Condiciones
                        </Link>
                        <span>·</span>
                        <Link href="/privacy" className="hover:text-muted-foreground" target="_blank">
                            Politica de Privacidad
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
