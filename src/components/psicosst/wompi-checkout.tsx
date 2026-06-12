"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

interface WompiCheckoutProps {
    packageId: string;
    popular?: boolean;
    disabled?: boolean;
    onSuccess: () => void;
    onError: (message: string) => void;
}

declare global {
    interface Window {
        WidgetCheckout?: new (config: Record<string, unknown>) => {
            open: (callback: (result: { transaction?: { id: string; status: string } }) => void) => void;
        };
    }
}

function loadWompiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="checkout.wompi.co"]')) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.wompi.co/widget.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("No se pudo cargar Wompi"));
        document.head.appendChild(script);
    });
}

export function WompiCheckout({ packageId, popular, disabled, onSuccess, onError }: WompiCheckoutProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = useCallback(async () => {
        setLoading(true);

        try {
            // 1. Create order on our server
            const res = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId }),
            });

            if (!res.ok) {
                const data = await res.json();
                onError(data.error || "Error al crear la orden");
                return;
            }

            const order = await res.json();

            // 2. Load Wompi widget script
            await loadWompiScript();

            if (!window.WidgetCheckout) {
                onError("No se pudo inicializar el widget de pago");
                return;
            }

            // 3. Open Wompi widget
            const checkout = new window.WidgetCheckout({
                currency: "COP",
                amountInCents: order.amountCents,
                reference: order.reference,
                publicKey: order.publicKey,
                signature: { integrity: order.signature },
                redirectUrl: `${window.location.origin}/dashboard/credits`,
            });

            checkout.open(async (result) => {
                if (result.transaction) {
                    // Poll for status
                    const maxAttempts = 10;
                    for (let i = 0; i < maxAttempts; i++) {
                        await new Promise((r) => setTimeout(r, 2000));

                        const statusRes = await fetch(`/api/payments/status/${order.orderId}`);
                        const statusData = await statusRes.json();

                        if (statusData.status === "APPROVED") {
                            onSuccess();
                            return;
                        }
                        if (statusData.status === "DECLINED" || statusData.status === "ERROR") {
                            onError("El pago fue rechazado. Intenta con otro medio de pago.");
                            return;
                        }
                    }

                    // If we get here, payment is still pending (PSE can take time)
                    onError("El pago está siendo procesado. Los créditos se agregarán cuando se confirme.");
                }
            });
        } catch (err) {
            onError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setLoading(false);
        }
    }, [packageId, onSuccess, onError]);

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || loading}
            className="w-full gap-2"
            variant={popular ? "default" : "outline"}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <ShoppingCart className="h-4 w-4" />
            )}
            {loading ? "Procesando..." : "Comprar"}
        </Button>
    );
}
