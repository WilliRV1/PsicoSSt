"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/psicosst/logo";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <Logo className="mb-8" />
            <div className="text-center">
                <p className="text-8xl font-bold text-destructive">500</p>
                <h1 className="mt-4 text-2xl font-semibold text-foreground">
                    Algo salió mal
                </h1>
                <p className="mt-2 max-w-md text-muted-foreground">
                    Ocurrió un error inesperado. Si el problema persiste,
                    contacta a soporte.
                </p>
                {error.digest && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Código: {error.digest}
                    </p>
                )}
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={reset}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                        Ir al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
