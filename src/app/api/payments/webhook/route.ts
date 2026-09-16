import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments/payment-service";
import { AutoRenewalService } from "@/lib/payments/auto-renewal-service";
import { verifyWebhookSignature } from "@/lib/payments/webhook-signature";
import {
    getMercadoPagoConfig,
    MercadoPagoConfigError,
    WEBHOOK_TOLERANCE_SECONDS,
} from "@/lib/payments/config";

/**
 * Notificaciones de Mercado Pago. Ruta PÚBLICA: no hay sesión que valide nada,
 * sólo la firma criptográfica.
 *
 * Tres decisiones que conviene no revertir sin entender por qué:
 *
 *  1. El cuerpo de la notificación NO es fuente de verdad. Sólo dice QUÉ pago
 *     mirar; el estado se relee con `GET /v1/payments/{id}` usando nuestro
 *     token. Confiar en el cuerpo permitiría regalar créditos a cualquiera que
 *     conozca la URL.
 *
 *  2. Se responde 200 en casi todos los casos, incluidos los ignorados. Un
 *     código distinto hace que Mercado Pago reintente, y reintentar algo que ya
 *     resolvimos (o que nunca nos incumbió) sólo genera ruido. La excepción es
 *     la firma inválida: ahí un 401 es lo correcto y además destapa una
 *     configuración mal puesta en vez de esconderla.
 *
 *  3. Nada pesado aquí dentro. Ni PDFs ni correos: la lambda del plan gratuito
 *     se corta a los 10 s y Mercado Pago espera respuesta en 22 s.
 */

// `node:crypto` para verificar la firma: esta ruta no puede correr en Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Respuesta estándar. Mercado Pago sólo mira el código HTTP. */
function ack(outcome: string, extra?: Record<string, unknown>) {
    return NextResponse.json({ received: true, outcome, ...extra }, { status: 200 });
}

export async function POST(request: NextRequest) {
    let config;
    try {
        config = getMercadoPagoConfig();
    } catch (error) {
        if (error instanceof MercadoPagoConfigError) {
            console.error("[PAGOS][webhook] Configuración incompleta:", error.message);
            // 503 para que Mercado Pago reintente: el problema es nuestro y
            // puede resolverse poniendo las variables de entorno.
            return NextResponse.json(
                { received: false, outcome: "not_configured" },
                { status: 503 }
            );
        }
        throw error;
    }

    // El cuerpo puede venir vacío o no ser JSON (pruebas del panel, sondas).
    // Nunca debe tumbar la ruta.
    let body: Record<string, unknown> = {};
    try {
        const raw = await request.text();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        body = {};
    }

    const query = request.nextUrl.searchParams;

    // Mercado Pago firma con el `data.id` del QUERY STRING; si no viene, el
    // segmento `id:` se omite del manifest. El identificador del cuerpo sirve
    // para saber qué pago consultar, pero jamás entra en la firma: meterlo
    // produciría un manifest distinto al que Mercado Pago firmó.
    const signatureDataId = query.get("data.id") ?? query.get("id");
    const bodyData = body.data as { id?: unknown } | undefined;
    const dataId =
        signatureDataId ??
        (bodyData?.id !== undefined && bodyData.id !== null ? String(bodyData.id) : null);

    const verification = verifyWebhookSignature({
        signatureHeader: request.headers.get("x-signature"),
        requestId: request.headers.get("x-request-id"),
        dataId: signatureDataId,
        secret: config.webhookSecret,
        toleranceSeconds: WEBHOOK_TOLERANCE_SECONDS,
    });

    if (!verification.valid) {
        // Sin el identificador en el registro: si la firma no es válida, el
        // contenido tampoco es de fiar.
        console.warn(`[PAGOS][webhook] Firma rechazada (${verification.reason})`);
        return NextResponse.json(
            { received: false, outcome: "invalid_signature" },
            { status: 401 }
        );
    }

    const tipo = (query.get("type") ?? body.type ?? body.topic) as string | undefined;

    // Renovación automática: son temas DISTINTOS al pago único y llegan por
    // esta misma URL. `subscription_preapproval` avisa que la autorización
    // cambió de estado; `subscription_authorized_payment`, que Mercado Pago
    // cobró un periodo. Ninguno de los dos se acredita desde aquí: se delega,
    // igual que el pago único, en quien relee el estado real desde su API.
    if (tipo === "subscription_preapproval" || tipo === "subscription_authorized_payment") {
        if (!dataId) return ack("missing_data_id");
        try {
            const result =
                tipo === "subscription_preapproval"
                    ? await AutoRenewalService.syncFromPreapproval(dataId)
                    : await AutoRenewalService.applyRecurringPayment(dataId);
            return ack(result.outcome, { topic: tipo });
        } catch (error) {
            console.error(`[PAGOS][webhook] Error en ${tipo} ${dataId}:`, error);
            return NextResponse.json(
                { received: false, outcome: "auto_renewal_failed" },
                { status: 500 }
            );
        }
    }

    // Mercado Pago manda también `merchant_order`, `plan`, `subscription`…
    // Nada de eso nos incumbe, pero hay que acusar recibo igual.
    if (tipo && tipo !== "payment") {
        return ack("ignored_topic", { topic: tipo });
    }

    if (!dataId) return ack("missing_data_id");

    try {
        const result = await PaymentService.reconcileByPaymentId(dataId);

        // `payment_not_found` es el caso normal del botón «simular notificación»
        // del panel, que manda identificadores inventados. No es un fallo.
        if (result.outcome === "payment_not_found" || result.outcome === "order_not_found") {
            console.info(`[PAGOS][webhook] Pago ${dataId}: ${result.outcome}`);
        }

        return ack(result.outcome);
    } catch (error) {
        console.error(`[PAGOS][webhook] Error reconciliando el pago ${dataId}:`, error);
        // 500 para que Mercado Pago reintente: puede haber sido una caída
        // transitoria de Neon o un tiempo de espera agotado.
        return NextResponse.json(
            { received: false, outcome: "reconcile_failed" },
            { status: 500 }
        );
    }
}

/**
 * Mercado Pago comprueba la URL con un GET al configurar el webhook en el
 * panel. Sin esto, el guardado falla con un error poco descriptivo.
 */
export async function GET() {
    return NextResponse.json({ status: "ok", endpoint: "mercadopago-webhook" });
}
