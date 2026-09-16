import { CheckoutClient } from "./checkout-client";

interface Props {
    params: Promise<{ ref: string }>;
}

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
