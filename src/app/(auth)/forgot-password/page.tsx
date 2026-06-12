"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AlertCircle, CheckCircle, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRequestCode(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
            } else {
                setStep(2);
            }
        } catch {
            setError("Error de conexion. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Las contrasenas no coinciden");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.details ? data.details.join(". ") : data.error);
            } else {
                setStep(3);
            }
        } catch {
            setError("Error de conexion. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <Logo />
                </div>

                {/* Step 1: Enter email */}
                {step === 1 && (
                    <>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">Recuperar contrasena</h1>
                            <p className="text-sm text-muted-foreground">
                                Ingresa tu correo y te enviaremos un codigo de 6 digitos.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form className="space-y-5" onSubmit={handleRequestCode}>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Correo electronico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="psicologa@empresa.com"
                                        className="pl-9"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar codigo"
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            <Link href="/login" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                                <ArrowLeft className="h-3 w-3" />
                                Volver a iniciar sesion
                            </Link>
                        </p>
                    </>
                )}

                {/* Step 2: Enter code + new password */}
                {step === 2 && (
                    <>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">Ingresa el codigo</h1>
                            <p className="text-sm text-muted-foreground">
                                Enviamos un codigo de 6 digitos a <strong>{email}</strong>. Expira en 10 minutos.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            <div className="space-y-2">
                                <Label>Codigo de verificacion</Label>
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword">Nueva contrasena</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 12 caracteres"
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite la contrasena"
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    "Cambiar contrasena"
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep(1); setError(""); setCode(""); }}
                                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                            >
                                Reenviar codigo
                            </button>
                        </form>
                    </>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="text-center space-y-6">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <CheckCircle className="h-7 w-7" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">Contrasena actualizada</h1>
                            <p className="text-sm text-muted-foreground">
                                Tu contrasena ha sido cambiada exitosamente.
                            </p>
                        </div>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Iniciar sesion
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
