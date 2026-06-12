"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export default function MfaSetupPage() {
    const router = useRouter();
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"generate" | "verify">("generate");

    async function generateSecret() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                setQrCode(data.qrCode);
                setSecret(data.secret);
                setStep("verify");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    async function verifyCode(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

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
                router.push("/dashboard");
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
                <div className="mb-8 text-center"><Logo /></div>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto mb-2">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Configurar Autenticación en Dos Pasos</CardTitle>
                        <CardDescription>
                            La verificación en dos pasos es obligatoria para proteger la información de tus evaluaciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {step === "generate" && (
                            <Button onClick={generateSecret} className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    "Generar Código QR"
                                )}
                            </Button>
                        )}

                        {step === "verify" && (
                            <>
                                <div className="inline-block rounded-xl border bg-white p-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="Código QR para MFA" className="h-[200px] w-[200px] block" />
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Clave manual:</span>
                                    <code className="block text-xs text-primary bg-muted px-2 py-1 rounded break-all">
                                        {secret}
                                    </code>
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Escanea el código QR con Google Authenticator, Authy u otra aplicación de autenticación. Luego ingresa el código de 6 dígitos.
                                </p>

                                <form onSubmit={verifyCode} className="space-y-4">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000000"
                                        required
                                        autoFocus
                                        className="text-center text-2xl tracking-[0.5em] font-mono"
                                    />

                                    <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Verificando...
                                            </>
                                        ) : (
                                            "Activar MFA"
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
