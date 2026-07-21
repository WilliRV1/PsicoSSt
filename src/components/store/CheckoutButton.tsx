"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/config/credit-packages";

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
            className={`w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
                popular 
                ? "bg-[#00B49F] hover:bg-[#009e8b] text-white disabled:opacity-70" 
                : "bg-transparent border-2 border-[#00B49F] hover:bg-[#00B49F]/5 text-[#00B49F] disabled:opacity-50"
            }`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Adquirir por {formatCOP(priceCOP)}</span>
                </>
            )}
        </button>
    );
}
