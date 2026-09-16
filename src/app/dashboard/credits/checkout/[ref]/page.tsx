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
    return (
        <>
            {/* Adelanta la conexión al SDK y los assets de Mercado Pago:
                el Brick tarda varios segundos en aparecer si esas conexiones
                arrancan recién cuando el componente se monta. */}
            <link rel="preconnect" href="https://sdk.mercadopago.com" />
            <link rel="preconnect" href="https://http2.mlstatic.com" crossOrigin="" />
            <link rel="dns-prefetch" href="https://sdk.mercadopago.com" />
            <CheckoutClient internalRef={ref} />
        </>
    );
}
