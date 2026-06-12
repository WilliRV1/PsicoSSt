"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        licenseNumber: "",
        professionalCard: "",
        sstCredential: "",
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        // Client-side validation
        const clientErrors: string[] = [];
        if (form.password !== form.confirmPassword) {
            clientErrors.push("Las contraseñas no coinciden");
        }
        if (clientErrors.length > 0) {
            setErrors(clientErrors);
            setLoading(false);
            return;
        }

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

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center"><Logo /></div>
                    <Card className="text-center">
                        <CardContent className="space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-xl">Registro Enviado</CardTitle>
                            <p className="text-sm text-muted-foreground leading-relaxed">{successMessage}</p>
                            <Button variant="outline" asChild>
                                <Link href="/login">Ir a Iniciar Sesión</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center"><Logo /></div>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Solicitar Registro</CardTitle>
                        <CardDescription>
                            Solo psicólogos con posgrado en SST y licencia vigente pueden registrarse.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {errors.map((err, i) => (
                                            <div key={i}>{err}</div>
                                        ))}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                Información Personal
                            </p>

                            <div className="space-y-1.5">
                                <Label htmlFor="fullName">Nombre completo</Label>
                                <Input id="fullName" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required placeholder="Mín. 12 caracteres" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword">Confirmar</Label>
                                    <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
                                    Credenciales Profesionales
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="licenseNumber">Número de licencia SST</Label>
                                <Input id="licenseNumber" value={form.licenseNumber} onChange={(e) => updateField("licenseNumber", e.target.value)} required placeholder="12345-SST" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="professionalCard">Tarjeta profesional</Label>
                                <Input id="professionalCard" value={form.professionalCard} onChange={(e) => updateField("professionalCard", e.target.value)} required placeholder="TP-98765" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="sstCredential">Credencial de posgrado en SST</Label>
                                <Input id="sstCredential" value={form.sstCredential} onChange={(e) => updateField("sstCredential", e.target.value)} required placeholder="Esp. SST — Universidad, Año" />
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Al registrarte, aceptas los{" "}
                                <Link href="/terms" target="_blank" className="text-primary hover:underline">
                                    Terminos y Condiciones
                                </Link>{" "}
                                y la{" "}
                                <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                                    Politica de Privacidad
                                </Link>.
                            </p>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Solicitud"
                                )}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                ¿Ya tienes cuenta?{" "}
                                <Link href="/login" className="font-medium text-primary hover:underline">Iniciar sesion</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
