import crypto from "crypto";

const WOMPI_API = process.env.WOMPI_SANDBOX === "true"
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";

/**
 * Generate integrity signature for Wompi checkout widget.
 * HMAC-SHA256(reference + amountCents + currency + integrityKey)
 */
export function generateIntegritySignature(
    reference: string,
    amountCents: number,
    currency: string = "COP"
): string {
    const integrityKey = process.env.WOMPI_PRIVATE_KEY || "";
    const data = `${reference}${amountCents}${currency}${integrityKey}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify Wompi webhook event signature.
 * Wompi sends: event.signature.checksum = SHA256(properties concatenated + events_secret)
 */
export function verifyWebhookChecksum(
    properties: Record<string, string | number>,
    receivedChecksum: string
): boolean {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET || "";
    // Wompi concatenates property values in the order they send them + the secret
    const values = Object.values(properties).join("");
    const computed = crypto
        .createHash("sha256")
        .update(values + eventsSecret)
        .digest("hex");
    return computed === receivedChecksum;
}

/**
 * Fetch a transaction from Wompi API to verify its status server-side.
 */
export async function getWompiTransaction(transactionId: string) {
    const res = await fetch(`${WOMPI_API}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
    });

    if (!res.ok) {
        throw new Error(`Wompi API error: ${res.status}`);
    }

    const data = await res.json();
    return data.data as WompiTransaction;
}

// Wompi types
export interface WompiTransaction {
    id: string;
    status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
    reference: string;
    amount_in_cents: number;
    currency: string;
    payment_method_type: string;
    created_at: string;
}

export interface WompiWebhookEvent {
    event: string;
    data: {
        transaction: WompiTransaction;
    };
    sent_at: string;
    timestamp: number;
    signature: {
        properties: string[];
        checksum: string;
    };
    environment: "test" | "prod";
}
