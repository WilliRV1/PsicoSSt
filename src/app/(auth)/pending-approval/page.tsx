"use client";

import { signOut } from "next-auth/react";
import { CheckCircle2, Clock } from "lucide-react";
import { Logo } from "@/components/psicosst/logo";

const REQUISITOS = [
    "Licencia vigente en Seguridad y Salud en el Trabajo",
    "Tarjeta profesional de psicólogo",
    "Posgrado en Seguridad y Salud en el Trabajo",
];

export default function PendingApprovalPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
                <Logo size={34} />

                <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-surface p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light">
                            <Clock className="h-7 w-7 text-primary" />
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <h1
                                className="text-[22px] font-semibold tracking-[-0.01em] text-foreground"
                                style={{ fontFamily: "var(--font-report-serif), Georgia, serif" }}
                            >
                                Tu cuenta está en revisión
                            </h1>
                            <p className="text-[13.5px] leading-relaxed text-text-secondary">
                                Un administrador verifica tus credenciales profesionales. Recibirás
                                el acceso por correo, normalmente en menos de 24 horas.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-border-muted bg-background p-4">
                        <p
                            className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-muted"
                            style={{ fontFamily: "var(--font-barlow)" }}
                        >
                            Qué se verifica
                        </p>
                        <ul className="flex flex-col gap-2.5">
                            {REQUISITOS.map(item => (
                                <li key={item} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-[13px] leading-snug text-text-secondary">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="h-11 w-full rounded-lg border border-border bg-surface text-[13.5px] font-semibold text-text-secondary transition-colors hover:border-border-focus hover:text-foreground"
                        style={{ fontFamily: "var(--font-barlow)" }}
                    >
                        Cerrar sesión
                    </button>
                </div>

                <p className="text-center text-[11.5px] leading-relaxed text-text-muted">
                    La verificación es un requisito de la Resolución 2764 de 2022: sólo un
                    profesional con licencia vigente puede aplicar e interpretar la Batería.
                </p>
            </div>
        </div>
    );
}
