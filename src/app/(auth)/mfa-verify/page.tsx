"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

export default function MfaVerifyPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
                            <LockKeyhole className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Verificación MFA</CardTitle>
                        <CardDescription>
                            Ingresa el código de 6 dígitos de tu aplicación de autenticación.
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
