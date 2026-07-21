import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMPPayment, verifyMPWebhook } from "@/lib/mercadopago";
import { CreditService } from "@/lib/services/credit-service";
import { getPackageById } from "@/config/credit-packages";

/**
 * MercadoPago Webhook Handler
 * 
 * MercadoPago sends POST notifications when payment status changes.
 * We verify the payment server-side and grant credits if approved.
 * 
 * NOTE: This handler ONLY touches payment/credit logic.
 * The scoring engine is NOT involved here in any way.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // MercadoPago sends different notification types
        // We only care about "payment" notifications
        const topic = body.type || body.topic;
        const dataId = body.data?.id?.toString() || body.id?.toString();

        if (!dataId) {
            return NextResponse.json({ received: true });
        }

        // Only process payment notifications
        if (topic !== "payment" && topic !== "payment.created" && topic !== "payment.updated") {
            return NextResponse.json({ received: true });
        }

        // Optional: Verify webhook signature
        const xSignature = request.headers.get("x-signature");
        const xRequestId = request.headers.get("x-request-id");
        const isValid = verifyMPWebhook(xSignature, xRequestId, dataId);
        if (!isValid) {
            console.error("[MP-WEBHOOK] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // Fetch the full payment details from MercadoPago API
        let payment;
        try {
            payment = await getMPPayment(dataId);
        } catch (err) {
            console.error("[MP-WEBHOOK] Could not fetch payment:", err);
            return NextResponse.json({ received: true });
        }

        if (!payment.external_reference) {
            console.warn("[MP-WEBHOOK] Payment without external_reference:", dataId);
            return NextResponse.json({ received: true });
        }

        // Find our order by the internal reference
        const order = await prisma.paymentOrder.findUnique({
            where: { internalRef: payment.external_reference },
            include: { psychologist: { select: { email: true, fullName: true } } },
        });

        if (!order) {
            console.error("[MP-WEBHOOK] Order not found:", payment.external_reference);
            return NextResponse.json({ received: true });
        }

        // Idempotency: skip if already processed
        if (order.status === "APPROVED") {
            return NextResponse.json({ received: true });
        }

        // Map MercadoPago status to our status
        const statusMap: Record<string, "APPROVED" | "DECLINED" | "VOIDED" | "ERROR"> = {
            approved: "APPROVED",
            rejected: "DECLINED",
            cancelled: "VOIDED",
            charged_back: "VOIDED",
            in_process: "PENDING" as any, // still pending
            pending: "PENDING" as any,
        };

        const newStatus = statusMap[payment.status];
        if (!newStatus || newStatus === ("PENDING" as any)) {
            // Still pending, don't update yet
            return NextResponse.json({ received: true });
        }

        // Update order status
        await prisma.paymentOrder.update({
            where: { id: order.id },
            data: {
                status: newStatus,
                wompiRef: payment.id.toString(), // reusing existing DB column for MP payment ID
                paymentMethod: payment.payment_method_id || null,
                completedAt: new Date(),
            },
        });

        // If approved, grant credits
        if (newStatus === "APPROVED") {
            await CreditService.purchasePackage(
                order.psychologistId,
                order.packageId,
                payment.id.toString()
            );

            console.log(`[MP-WEBHOOK] Credits granted for order ${order.id}, payment ${payment.id}`);

            // Optional: Send receipt email (if email service is configured)
            try {
                const { sendEmail } = await import("@/lib/email/resend");
                const { paymentReceiptEmail } = await import("@/lib/email/templates");
                const pkg = getPackageById(order.packageId);
                if (pkg && order.psychologist) {
                    const template = paymentReceiptEmail(
                        order.psychologist.fullName,
                        pkg.name,
                        pkg.credits,
                        pkg.priceCOP,
                        payment.id.toString(),
                        new Date()
                    );
                    sendEmail({ to: order.psychologist.email, ...template }).catch(console.error);
                }
            } catch {
                // Email is optional, don't fail the webhook
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[MP-WEBHOOK] Error:", error);
        // Always return 200 to MercadoPago to prevent retries
        return NextResponse.json({ received: true });
    }
}
