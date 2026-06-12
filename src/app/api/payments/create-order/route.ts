import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackageById } from "@/config/credit-packages";
import { generateIntegritySignature } from "@/lib/wompi";
import crypto from "crypto";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { packageId } = body;

        if (!packageId) {
            return NextResponse.json({ error: "Se requiere el paquete" }, { status: 400 });
        }

        const pkg = getPackageById(packageId);
        if (!pkg) {
            return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
        }

        const amountCents = pkg.priceCOP * 100;
        const internalRef = `psicosst-${crypto.randomUUID()}`;

        // Create payment order
        const order = await prisma.paymentOrder.create({
            data: {
                psychologistId: session.user.id,
                packageId: pkg.id,
                amountCents,
                internalRef,
            },
        });

        // Generate integrity signature for Wompi widget
        const signature = generateIntegritySignature(internalRef, amountCents);

        return NextResponse.json({
            orderId: order.id,
            reference: internalRef,
            amountCents,
            currency: "COP",
            publicKey: process.env.WOMPI_PUBLIC_KEY,
            signature,
            packageName: pkg.name,
            credits: pkg.credits,
        });
    } catch (error) {
        console.error("[PAYMENTS] Create order error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
