import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackageById } from "@/config/credit-packages";
import { createMPPreference } from "@/lib/mercadopago";
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

        // Create payment order in our database
        const order = await prisma.paymentOrder.create({
            data: {
                psychologistId: session.user.id,
                packageId: pkg.id,
                amountCents,
                internalRef,
            },
        });

        // Create MercadoPago preference
        const preference = await createMPPreference({
            title: `PsicoSST - Paquete ${pkg.name}`,
            description: `${pkg.credits} créditos para evaluaciones de batería de riesgo psicosocial`,
            unitPrice: pkg.priceCOP,
            quantity: 1,
            externalReference: internalRef,
        });

        return NextResponse.json({
            orderId: order.id,
            reference: internalRef,
            amountCents,
            currency: "COP",
            publicKey: process.env.MP_PUBLIC_KEY,
            preferenceId: preference.id,
            initPoint: preference.sandbox_init_point || preference.init_point,
            packageName: pkg.name,
            credits: pkg.credits,
        });
    } catch (error) {
        console.error("[PAYMENTS] Create order error:", error);
        return NextResponse.json({ error: "Error interno al crear la orden de pago" }, { status: 500 });
    }
}
