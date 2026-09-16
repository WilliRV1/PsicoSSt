import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { PaymentService, PaymentOrderError } from "@/lib/payments/payment-service";
import { getMercadoPagoConfig, MercadoPagoConfigError } from "@/lib/payments/config";
import { getPackageById } from "@/config/credit-packages";

/**
 * Abre una orden de pago y devuelve lo que el Payment Brick necesita para
 * renderizarse.
 *
 * El cliente manda únicamente un `packageId`. El precio sale del catálogo del
 * servidor: si el navegador propusiera un monto, se ignoraría.
 */

const bodySchema = z.object({
    packageId: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let config;
    try {
        config = getMercadoPagoConfig();
    } catch (error) {
        if (error instanceof MercadoPagoConfigError) {
            console.error("[PAGOS] Configuración incompleta:", error.message);
            return NextResponse.json(
                {
                    error: "Los pagos en línea no están disponibles en este momento.",
                    code: "PAYMENTS_DISABLED",
                },
                { status: 503 }
            );
        }
        throw error;
    }

    let parsed;
    try {
        parsed = bodySchema.parse(await request.json());
    } catch {
        return NextResponse.json(
            { error: "Solicitud inválida.", code: "BAD_REQUEST" },
            { status: 400 }
        );
    }

    try {
        const order = await PaymentService.createOrder(session.user.id, parsed.packageId);
        const pkg = getPackageById(order.packageId)!;

        return NextResponse.json({
            internalRef: order.internalRef,
            amountCOP: order.amountCOP,
            expiresAt: order.expiresAt.toISOString(),
            publicKey: config.publicKey,
            mode: config.mode,
            package: { id: pkg.id, name: pkg.name, credits: pkg.credits },
        });
    } catch (error) {
        if (error instanceof PaymentOrderError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: 400 }
            );
        }
        console.error("[PAGOS] Error creando la orden:", error);
        return NextResponse.json(
            { error: "No pudimos iniciar el pago. Intenta de nuevo." },
            { status: 500 }
        );
    }
}
