"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

/**
 * Botón de compra de un paquete de créditos.
 *
 * Sólo envía el identificador del paquete: el precio lo fija el servidor desde
 * `src/config/credit-packages.ts`. Aunque alguien manipulara esta petición, no
 * podría alterar cuánto se le cobra.
 */

interface Props {
    packageId: string;
    label?: string;
    className?: string;
}

export function BuyPackageButton({ packageId, label = "Comprar", className }: Props) {
    const router = useRouter();
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function comprar() {
        setCargando(true);
        setError(null);

        try {
            const respuesta = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId }),
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                setError(datos?.error ?? "No pudimos iniciar el pago.");
                setCargando(false);
                return;
            }

            router.push(`/dashboard/credits/checkout/${datos.internalRef}`);
        } catch {
            setError("No hay conexión. Verifica tu red e intenta de nuevo.");
            setCargando(false);
        }
    }

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={comprar}
                disabled={cargando}
                className={
                    className ??
                    "w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                }
            >
                {cargando ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Preparando…</span>
                    </>
                ) : (
                    <>
                        <CreditCard className="w-4 h-4" />
                        <span>{label}</span>
                    </>
                )}
            </button>
            {error && (
                <p className="mt-2 text-xs text-red-600 text-center" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
