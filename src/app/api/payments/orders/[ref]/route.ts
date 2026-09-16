import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PaymentService } from "@/lib/payments/payment-service";
import { describeStatusDetail, isPending } from "@/lib/payments/status-map";
import { getPackageById } from "@/config/plans";
import { getMercadoPagoConfig, MercadoPagoConfigError } from "@/lib/payments/config";

/**
 * Estado de una orden, para que el checkout consulte mientras espera.
 *
 * Es la tercera red de seguridad de la acreditación: si el webhook nunca llegó
 * (una caída de Vercel, una notificación perdida), basta con que el usuario
 * abra la pantalla de su orden para que el estado se reconcilie contra Mercado
 * Pago y los créditos entren.
 */

interface RouteContext {
    params: Promise<{ ref: string }>;
}

/**
 * Cuánto esperar antes de volver a preguntarle a Mercado Pago.
 *
 * Sin esta pausa, una pantalla que consulta cada 3 s dispararía una llamada a
 * la API externa por consulta: lento para el usuario y un desperdicio de la
 * cuota de la función en el plan gratuito.
 */
const RECONCILE_COOLDOWN_MS = 10_000;

export async function GET(request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ref } = await context.params;

    let order = await PaymentService.getOrder(session.user.id, ref);
    if (!order) {
        return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    // Reconciliación perezosa: sólo si sigue en vuelo y ya pasó el enfriamiento.
    // Se mide desde la última CONSULTA a Mercado Pago (`lastSyncedAt`), que
    // `syncOrder` registra aunque no cambie nada; `updatedAt` no sirve porque
    // una consulta sin novedades no lo mueve y el sondeo martillearía la API.
    const ultimaConsulta = order.lastSyncedAt ?? order.updatedAt;
    const antiguedad = Date.now() - ultimaConsulta.getTime();
    if (isPending(order.status) && antiguedad > RECONCILE_COOLDOWN_MS) {
        try {
            const result = await PaymentService.syncOrder(order);
            if (result.order) order = result.order;
        } catch (error) {
            // Que Mercado Pago no responda no debe romper la pantalla: se
            // devuelve el último estado conocido y se reintenta en la siguiente.
            console.error(`[PAGOS] No se pudo reconciliar ${ref}:`, error);
        }
    }

    const pkg = getPackageById(order.packageId);

    // La clave pública y el modo viajan con la orden para que el checkout sea
    // una sola petición en vez de dos.
    let publicKey: string | null = null;
    let mode: "test" | "production" | null = null;
    try {
        const config = getMercadoPagoConfig();
        publicKey = config.publicKey;
        mode = config.mode;
    } catch (error) {
        if (!(error instanceof MercadoPagoConfigError)) throw error;
    }

    return NextResponse.json({
        publicKey,
        mode,
        /// Correo del psicólogo, para prellenar el formulario de pago.
        payerEmail: session.user.email ?? null,
        internalRef: order.internalRef,
        status: order.status,
        message: describeStatusDetail(order.status, order.statusDetail),
        amountCOP: order.amountCOP,
        paymentMethodId: order.paymentMethodId,
        paymentTypeId: order.paymentTypeId,
        externalResourceUrl: order.externalResourceUrl,
        settled: order.creditTransactionId !== null,
        pending: isPending(order.status),
        expiresAt: order.expiresAt.toISOString(),
        package: pkg ? { id: pkg.id, name: pkg.name, credits: pkg.credits } : null,
    });
}
