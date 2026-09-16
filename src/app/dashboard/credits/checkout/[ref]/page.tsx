import { CheckoutClient } from "./checkout-client";

interface Props {
    params: Promise<{ ref: string }>;
}

export default async function CheckoutPage({ params }: Props) {
    const { ref } = await params;
    return <CheckoutClient internalRef={ref} />;
}
