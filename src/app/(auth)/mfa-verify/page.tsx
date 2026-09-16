"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

export default function MfaVerifyPage() {
    const router = useRouter();
    const [method, setMethod] = useState<"TOTP" | "EMAIL" | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        fetch("/api/auth/mfa/method")
            .then((res) => res.json())
            .then((data) => setMethod(data.mfaMethod ?? "TOTP"))
            .catch(() => setMethod("TOTP"));
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    async function handleResend() {
        setResending(true);
        setError("");
        try {
            const res = await fetch("/api/auth/mfa/send-email-code", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
            } else {
                setResendCooldown(30);
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setResending(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/mfa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                // El JWT de la sesión quedó con mfaVerified:false desde el
                // login — sin este POST, el layout del dashboard redirige
                // de vuelta aquí en bucle indefinido, aunque el código haya
                // sido correcto. NextAuth exige el csrfToken también en esta
                // ruta, igual que en el propio login.
                const { csrfToken } = await fetch("/api/auth/csrf").then((r) => r.json());
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ csrfToken, data: { mfaVerified: true } }),
                });
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex justify-center"><Logo size={34} /></div>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto mb-2">
                            <LockKeyhole className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-[-0.01em]" style={{ fontFamily: "var(--font-heading)" }}>Verificación MFA</CardTitle>
                        <CardDescription>
                            {method === "EMAIL"
                                ? "Ingresa el código de 6 dígitos que te enviamos por correo."
                                : "Ingresa el código de 6 dígitos de tu aplicación de autenticación."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                required
                                autoFocus
                                autoComplete="one-time-code"
                                className="text-center text-2xl tracking-[0.5em] font-mono"
                            />

                            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    "Verificar"
                                )}
                            </Button>
                        </form>

                        {method === "EMAIL" && (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || resendCooldown > 0}
                                className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
                            >
                                {resendCooldown > 0
                                    ? `Reenviar código (${resendCooldown}s)`
                                    : resending
                                    ? "Enviando..."
                                    : "¿No te llegó? Reenviar código"}
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
