"use client";

import { signOut } from "next-auth/react";
import { Logo } from "@/components/psicosst/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, CheckCircle } from "lucide-react";

export default function PendingApprovalPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center"><Logo /></div>
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto mb-2">
                            <Clock className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Cuenta en Revisión</CardTitle>
                        <CardDescription className="leading-relaxed">
                            Tu solicitud de registro ha sido recibida y está siendo revisada por un administrador.
                            Recibirás acceso una vez que se verifiquen tus credenciales profesionales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/50 p-4 text-left">
                            <p className="text-sm font-semibold text-foreground mb-2">¿Qué se verifica?</p>
                            <ul className="space-y-1.5">
                                {[
                                    "Licencia SST vigente",
                                    "Tarjeta profesional de psicólogo",
                                    "Posgrado en Seguridad y Salud en el Trabajo",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            Cerrar Sesión
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
