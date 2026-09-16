"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, ShieldCheck, Smartphone, Mail } from "lucide-react";

type Method = "TOTP" | "EMAIL";

export default function MfaSetupPage() {
    const router = useRouter();
    const [method, setMethod] = useState<Method | null>(null);
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [emailSentMessage, setEmailSentMessage] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"choose" | "generate" | "verify">("choose");

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

    async function sendEmailCode() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/mfa/setup/email", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                setEmailSentMessage(data.message);
                setStep("verify");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    function chooseMethod(m: Method) {
        setMethod(m);
        setError("");
        if (m === "TOTP") {
            generateSecret();
        } else {
            sendEmailCode();
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
                // Sin esto, el JWT sigue creyendo que MFA no está activado
                // y el layout del dashboard reenvía aquí en bucle.
                const { csrfToken } = await fetch("/api/auth/csrf").then((r) => r.json());
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        csrfToken,
                        data: { mfaEnabled: true, mfaMethod: method, mfaVerified: true },
                    }),
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
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-[-0.01em]" style={{ fontFamily: "var(--font-heading)" }}>Configurar Autenticación en Dos Pasos</CardTitle>
                        <CardDescription>
                            Protege el acceso a la información de tus evaluaciones con un segundo paso de verificación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {step === "choose" && (
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => chooseMethod("TOTP")}
                                    disabled={loading}
                                    className="w-full flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-muted transition-colors disabled:opacity-60"
                                >
                                    <Smartphone className="h-6 w-6 text-primary shrink-0" />
                                    <div>
                                        <p className="font-medium text-sm">Aplicación autenticadora</p>
                                        <p className="text-xs text-muted-foreground">Google Authenticator, Authy u otra — código QR.</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => chooseMethod("EMAIL")}
                                    disabled={loading}
                                    className="w-full flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-muted transition-colors disabled:opacity-60"
                                >
                                    <Mail className="h-6 w-6 text-primary shrink-0" />
                                    <div>
                                        <p className="font-medium text-sm">Código por correo</p>
                                        <p className="text-xs text-muted-foreground">Te enviamos un código de 6 dígitos a tu correo en cada inicio de sesión.</p>
                                    </div>
                                </button>
                                {loading && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-1">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Preparando...
                                    </div>
                                )}
                            </div>
                        )}

                        {step === "verify" && method === "TOTP" && (
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
                            </>
                        )}

                        {step === "verify" && method === "EMAIL" && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {emailSentMessage || "Te enviamos un código de 6 dígitos por correo."} Ingrésalo abajo para activar la verificación en dos pasos.
                            </p>
                        )}

                        {step === "verify" && (
                            <>
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
