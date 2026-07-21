"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CheckoutButtonProps {
    packageId: string;
    priceCOP: number;
    popular?: boolean;
}

export function CheckoutButton({ packageId, priceCOP, popular }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ packageId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Error al inicializar el pago");
            }

            const data = await response.json();
            
            // Redirect to Mercado Pago checkout
            if (data.initPoint) {
                window.location.href = data.initPoint;
            } else {
                throw new Error("No se recibió el enlace de pago de Mercado Pago");
            }
        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error(error.message || "Ocurrió un error al procesar tu solicitud.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                popular 
                ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg disabled:bg-teal-500/50" 
                : "bg-surface-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground border border-border disabled:opacity-50"
            }`}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Adquirir por ${priceCOP.toLocaleString("es-CO")}</span>
                </>
            )}
        </button>
    );
}
