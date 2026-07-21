/**
 * MercadoPago Server Utilities for PsicoSST
 * Handles preference creation, payment verification and webhook processing.
 * 
 * NOTE: This module ONLY handles payment logic. It does NOT touch
 * the scoring engine or any assessment-related code.
 */

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_BASE_URL = "https://api.mercadopago.com";

const getBaseUrl = () => {
    if (process.env.APP_URL) return process.env.APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

export interface MPPreference {
    id: string;
    init_point: string;
    sandbox_init_point: string;
}

export interface MPPayment {
    id: number;
    status: "approved" | "pending" | "rejected" | "cancelled" | "in_process" | "charged_back";
    status_detail: string;
    external_reference: string;
    transaction_amount: number;
    currency_id: string;
    payment_method_id: string;
    payment_type_id: string;
    date_approved: string | null;
    payer: {
        email: string;
    };
}

/**
 * Create a MercadoPago Preference (server-side).
 * This generates the preference_id needed by the Bricks SDK on the client.
 */
export async function createMPPreference(opts: {
    title: string;
    description: string;
    unitPrice: number; // in COP (whole pesos, NOT cents)
    quantity: number;
    externalReference: string;
    notificationUrl?: string;
    backUrls?: {
        success: string;
        failure: string;
        pending: string;
    };
}): Promise<MPPreference> {
    if (!MP_ACCESS_TOKEN) {
        throw new Error("MP_ACCESS_TOKEN not configured. Set it in .env");
    }

    const body = {
        items: [
            {
                title: opts.title,
                description: opts.description,
                unit_price: opts.unitPrice,
                quantity: opts.quantity,
                currency_id: "COP",
            },
        ],
        external_reference: opts.externalReference,
        back_urls: opts.backUrls || {
            success: `${getBaseUrl()}/dashboard/store?status=approved`,
            failure: `${getBaseUrl()}/dashboard/store?status=failure`,
            pending: `${getBaseUrl()}/dashboard/store?status=pending`,
        },
        auto_return: "approved",
        notification_url: opts.notificationUrl || `${getBaseUrl()}/api/payments/webhook`,
        statement_descriptor: "PsicoSST",
    };

    const res = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("[MP] Error creating preference:", error);
        throw new Error(`MercadoPago API error: ${res.status} - ${JSON.stringify(error)}`);
    }

    return (await res.json()) as MPPreference;
}

/**
 * Get a MercadoPago payment by ID to verify its status server-side.
 */
export async function getMPPayment(paymentId: string | number): Promise<MPPayment> {
    if (!MP_ACCESS_TOKEN) {
        throw new Error("MP_ACCESS_TOKEN not configured");
    }

    const res = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
        headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
    });

    if (!res.ok) {
        throw new Error(`MercadoPago payment fetch error: ${res.status}`);
    }

    return (await res.json()) as MPPayment;
}

/**
 * Verify a MercadoPago webhook notification.
 * MercadoPago sends: x-signature header with ts=...,v1=...
 * For sandbox/testing we may skip strict verification.
 */
export function verifyMPWebhook(
    xSignature: string | null,
    xRequestId: string | null,
    dataId: string,
): boolean {
    // In sandbox mode or if no secret configured, allow all
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn("[MP] No MP_WEBHOOK_SECRET configured, skipping signature verification");
        return true;
    }

    if (!xSignature || !xRequestId) return false;

    try {
        const crypto = require("crypto");
        // Parse ts and v1 from x-signature
        const parts: Record<string, string> = {};
        xSignature.split(",").forEach((part: string) => {
            const [key, val] = part.trim().split("=");
            parts[key] = val;
        });

        const ts = parts["ts"];
        const v1 = parts["v1"];
        if (!ts || !v1) return false;

        // Build the manifest
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const computed = crypto
            .createHmac("sha256", webhookSecret)
            .update(manifest)
            .digest("hex");

        return computed === v1;
    } catch (err) {
        console.error("[MP] Webhook verification error:", err);
        return false;
    }
}
