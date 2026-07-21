"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, CreditCard, X } from "lucide-react";

interface MercadoPagoCheckoutProps {
    packageId: string;
    packageName: string;
    priceCOP: number;
    credits: number;
    popular?: boolean;
    disabled?: boolean;
    onSuccess: () => void;
    onError: (message: string) => void;
}

declare global {
    interface Window {
        MercadoPago?: new (publicKey: string, opts?: Record<string, unknown>) => {
            bricks: () => {
                create: (brick: string, container: string, settings: Record<string, unknown>) => Promise<unknown>;
            };
        };
    }
}

function loadMPScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="sdk.mercadopago.com"]')) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("No se pudo cargar MercadoPago SDK"));
        document.head.appendChild(script);
    });
}

export function MercadoPagoCheckout({
    packageId,
    packageName,
    priceCOP,
    credits,
    popular,
    disabled,
    onSuccess,
    onError,
}: MercadoPagoCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [showBrick, setShowBrick] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const brickRef = useRef<unknown>(null);

    const handleClick = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Create preference on our server
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
            setOrderId(order.orderId);

            // 2. Load MercadoPago SDK
            await loadMPScript();

            if (!window.MercadoPago) {
                onError("No se pudo inicializar MercadoPago");
                return;
            }

            setShowBrick(true);

            // Small delay for DOM to render the container
            await new Promise((r) => setTimeout(r, 100));

            // 3. Initialize Payment Brick
            const mp = new window.MercadoPago(order.publicKey, {
                locale: "es-CO",
            });

            const bricks = mp.bricks();
            brickRef.current = await bricks.create("wallet", "mp-brick-container", {
                initialization: {
                    preferenceId: order.preferenceId,
                    redirectMode: "self",
                },
                customization: {
                    texts: {
                        action: "pay",
                        valueProp: "security_details",
                    },
                    visual: {
                        buttonBackground: "default",
                        borderRadius: "12px",
                    },
                },
                callbacks: {
                    onReady: () => {
                        console.log("[MP] Brick ready");
                    },
                    onError: (error: unknown) => {
                        console.error("[MP] Brick error:", error);
                    },
                },
            });
        } catch (err) {
            onError(err instanceof Error ? err.message : "Error inesperado");
            setShowBrick(false);
        } finally {
            setLoading(false);
        }
    }, [packageId, onSuccess, onError]);

    // Poll for payment status after brick is shown
    useEffect(() => {
        if (!showBrick || !orderId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/payments/status/${orderId}`);
                const data = await res.json();

                if (data.status === "APPROVED") {
                    clearInterval(interval);
                    setShowBrick(false);
                    onSuccess();
                } else if (data.status === "DECLINED" || data.status === "ERROR") {
                    clearInterval(interval);
                    setShowBrick(false);
                    onError("El pago fue rechazado. Intenta con otro medio de pago.");
                }
            } catch {
                // Silent retry
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [showBrick, orderId, onSuccess, onError]);

    const handleClose = () => {
        setShowBrick(false);
        setOrderId(null);
    };

    if (showBrick) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                        Completando pago de {packageName}...
                    </p>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
                <div
                    id="mp-brick-container"
                    className="min-h-[120px] rounded-xl overflow-hidden"
                />
                <p className="text-xs text-center text-slate-400">
                    Serás redirigido a MercadoPago para completar el pago de forma segura.
                </p>
            </div>
        );
    }

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
                <CreditCard className="h-4 w-4" />
            )}
            {loading ? "Procesando..." : "Comprar"}
        </Button>
    );
}
