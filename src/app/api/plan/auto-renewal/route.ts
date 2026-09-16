import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPaymentsEnabled, MercadoPagoConfigError } from "@/lib/payments/config";
import { AutoRenewalError, AutoRenewalService } from "@/lib/payments/auto-renewal-service";
import { MercadoPagoApiError } from "@/lib/payments/mercadopago-client";

const ERROR_STATUS: Record<AutoRenewalError["code"], number> = {
    NO_SUBSCRIPTION: 409,
    SKU_NOT_RENEWABLE: 400,
    ALREADY_AUTHORIZED: 409,
    NOT_AUTHORIZED: 409,
    PSYCHOLOGIST_NOT_FOUND: 404,
};

/** Estado de la renovación automática de la cuenta. */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await AutoRenewalService.getState(session.user.id);
    // `available` distingue «no está activa» de «no se puede ofrecer»: sin
    // credenciales de Mercado Pago la interfaz debe ocultar la opción, no
    // mostrar un botón que va a fallar.
    return NextResponse.json({ ...state, available: isPaymentsEnabled() });
}

/** Crea la autorización y devuelve la URL de Mercado Pago donde se aprueba. */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json()) as { skuId?: unknown };
        const skuId = typeof body.skuId === "string" ? body.skuId.trim() : "";
        if (!skuId) {
            return NextResponse.json({ error: "Falta el plan a renovar." }, { status: 400 });
        }

        const { initPoint, preapprovalId } = await AutoRenewalService.authorize({
            psychologistId: session.user.id,
            skuId,
            origin: request.nextUrl.origin,
        });

        return NextResponse.json({ initPoint, preapprovalId });
    } catch (error) {
        return handleError(error, "No se pudo activar la renovación automática.");
    }
}

/** Cancela la autorización. El periodo ya pagado sigue vigente hasta vencer. */
export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await AutoRenewalService.cancel(session.user.id);
        return NextResponse.json({ cancelled: true });
    } catch (error) {
        return handleError(error, "No se pudo cancelar la renovación automática.");
    }
}

function handleError(error: unknown, fallback: string): NextResponse {
    if (error instanceof AutoRenewalError) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: ERROR_STATUS[error.code] }
        );
    }

    if (error instanceof MercadoPagoConfigError) {
        return NextResponse.json(
            { error: "Los pagos no están disponibles en este momento.", code: "PAYMENTS_DISABLED" },
            { status: 503 }
        );
    }

    if (error instanceof MercadoPagoApiError) {
        console.error("[PAGOS][auto] Mercado Pago rechazó la operación:", error.message);
        return NextResponse.json(
            { error: "Mercado Pago rechazó la operación. Intenta de nuevo.", code: "MP_ERROR" },
            { status: 502 }
        );
    }

    console.error("[PAGOS][auto] Error inesperado:", error);
    return NextResponse.json({ error: fallback }, { status: 500 });
}
