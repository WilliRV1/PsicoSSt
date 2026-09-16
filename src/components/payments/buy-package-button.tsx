"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botón de compra de un SKU (plan o complemento).
 *
 * Sólo envía el identificador del paquete: el precio lo fija el servidor desde
 * `src/config/plans.ts`. Aunque alguien manipulara esta petición, no
 * podría alterar cuánto se le cobra.
 *
 * Presentación: usa el `Button` del sistema en vez de un `<button>` con clases
 * sueltas, para que herede la variante teal, el anillo de foco y la escala al
 * pulsar del resto de la aplicación. Antes, la única forma de mostrarlo
 * inactivo era pasarle un `className` completo que imitaba un botón
 * deshabilitado —pero el botón seguía siendo pulsable—; ahora hay un `disabled`
 * de verdad, con su explicación debajo.
 */

interface Props {
    packageId: string;
    label?: string;
    /** Clases para el contenedor (ancho, márgenes). */
    className?: string;
    variant?: "default" | "outline" | "secondary";
    size?: "default" | "sm" | "lg";
    /** Inactiva la compra sin fingirlo con clases. */
    disabled?: boolean;
    /** Por qué está inactiva: se muestra bajo el botón. */
    disabledHint?: string;
    /**
     * Ancho completo siempre (móvil y escritorio). Por defecto el botón ocupa
     * todo el ancho en móvil y se ajusta al contenido desde `sm`.
     */
    fullWidth?: boolean;
}

export function BuyPackageButton({
    packageId,
    label = "Comprar",
    className,
    variant = "default",
    size = "default",
    disabled = false,
    disabledHint,
    fullWidth = false,
}: Props) {
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
        <div className={cn("w-full", className)}>
            <Button
                type="button"
                onClick={comprar}
                disabled={disabled || cargando}
                variant={variant}
                size={size}
                className={cn("press-feedback", fullWidth ? "w-full" : "w-full sm:w-auto")}
            >
                {cargando ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparando…</span>
                    </>
                ) : (
                    <>
                        <CreditCard className="h-4 w-4" />
                        <span>{label}</span>
                    </>
                )}
            </Button>

            {error && (
                <p
                    role="alert"
                    className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium"
                    style={{
                        background: "var(--color-risk-veryhigh-bg)",
                        color: "var(--color-risk-veryhigh-text)",
                    }}
                >
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">{error}</span>
                </p>
            )}

            {disabled && disabledHint && !error && (
                <p className="mt-2 text-[11px] leading-snug text-text-muted">{disabledHint}</p>
            )}
        </div>
    );
}
