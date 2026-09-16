import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
    title: "Pago | PsicoSST",
    description: "Completa el pago de tu orden de forma segura con Mercado Pago.",
};

interface Props {
    params: Promise<{ ref: string }>;
}

/**
 * Envoltorio de servidor: sólo resuelve el parámetro de ruta. Todo el estado
 * de la orden (consulta, sondeo, formulario de pago) vive en el cliente,
 * porque el Brick de Mercado Pago necesita `window`.
 */
export default async function CheckoutPage({ params }: Props) {
    const { ref } = await params;
    return <CheckoutClient internalRef={ref} />;
}
