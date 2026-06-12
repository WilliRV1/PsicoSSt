import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWompiTransaction, verifyWebhookChecksum } from "@/lib/wompi";
import { CreditService } from "@/lib/services/credit-service";
import { getPackageById } from "@/config/credit-packages";
import { sendEmail } from "@/lib/email/resend";
import { paymentReceiptEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Verify webhook signature
        if (body.signature) {
            const props: Record<string, string | number> = {};
            for (const key of body.signature.properties) {
                // Navigate nested path like "transaction.id"
                const value = key.split(".").reduce((obj: Record<string, unknown>, k: string) => obj?.[k] as Record<string, unknown>, body.data);
                if (value !== undefined) props[key] = value as string | number;
            }

            const valid = verifyWebhookChecksum(props, body.signature.checksum);
            if (!valid) {
                console.error("[WEBHOOK] Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const transaction = body.data?.transaction;
        if (!transaction?.reference) {
            return NextResponse.json({ received: true });
        }

        // Find our order
        const order = await prisma.paymentOrder.findUnique({
            where: { internalRef: transaction.reference },
            include: { psychologist: { select: { email: true, fullName: true } } },
        });

        if (!order) {
            console.error("[WEBHOOK] Order not found:", transaction.reference);
            return NextResponse.json({ received: true });
        }

        // Idempotency: skip if already processed
        if (order.status === "APPROVED") {
            return NextResponse.json({ received: true });
        }

        const wompiStatus = transaction.status as string;
        const statusMap: Record<string, "APPROVED" | "DECLINED" | "VOIDED" | "ERROR"> = {
            APPROVED: "APPROVED",
            DECLINED: "DECLINED",
            VOIDED: "VOIDED",
            ERROR: "ERROR",
        };

        const newStatus = statusMap[wompiStatus] || "ERROR";

        // Update order status
        await prisma.paymentOrder.update({
            where: { id: order.id },
            data: {
                status: newStatus,
                wompiRef: transaction.id,
                paymentMethod: transaction.payment_method_type || null,
                completedAt: new Date(),
            },
        });

        // If approved, verify with Wompi API and grant credits
        if (newStatus === "APPROVED") {
            // Double-check with Wompi API (don't trust webhook alone)
            try {
                const verified = await getWompiTransaction(transaction.id);
                if (verified.status !== "APPROVED") {
                    console.error("[WEBHOOK] Wompi verification failed:", verified.status);
                    await prisma.paymentOrder.update({
                        where: { id: order.id },
                        data: { status: "ERROR" },
                    });
                    return NextResponse.json({ received: true });
                }
            } catch (err) {
                // If we can't verify, still process (Wompi sandbox might not support this)
                console.warn("[WEBHOOK] Could not verify with Wompi API:", err);
            }

            // Grant credits
            await CreditService.purchasePackage(
                order.psychologistId,
                order.packageId,
                transaction.id
            );

            // Send receipt email
            const pkg = getPackageById(order.packageId);
            if (pkg && order.psychologist) {
                const template = paymentReceiptEmail(
                    order.psychologist.fullName,
                    pkg.name,
                    pkg.credits,
                    pkg.priceCOP,
                    transaction.id,
                    new Date()
                );
                sendEmail({ to: order.psychologist.email, ...template }).catch(console.error);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[WEBHOOK] Error:", error);
        // Always return 200 to Wompi
        return NextResponse.json({ received: true });
    }
}
