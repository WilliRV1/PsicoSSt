import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { PaymentService } from "@/lib/payments/payment-service";
import { isPaymentsEnabled } from "@/lib/payments/config";

/**
 * Barrido programado de órdenes a medias.
 *
 * Cierra el único hueco que las otras tres vías no cubren: un pago de PSE o
 * Efecty que se acredita horas después, cuyo webhook se perdió, y cuyo usuario
 * nunca vuelve a abrir la pantalla del checkout. Sin esto, ese psicólogo pagó
 * y se queda sin créditos hasta que escriba a soporte.
 *
 * Lo dispara Vercel Cron (ver `vercel.json`). El plan Hobby sólo permite
 * frecuencia diaria, que es suficiente: es una red de seguridad, no el camino
 * principal.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compara el Bearer en tiempo constante: un `!==` filtra el secreto byte a byte. */
function bearerMatches(header: string | null, secret: string): boolean {
    const esperado = Buffer.from(`Bearer ${secret}`);
    const recibido = Buffer.from(header ?? "");
    return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

export async function GET(request: NextRequest) {
    // Vercel Cron firma sus llamadas con `Authorization: Bearer $CRON_SECRET`.
    // Sin secreto configurado se rechaza todo: es preferible un cron que no
    // corre a un endpoint abierto que cualquiera puede martillear.
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
        console.error("[PAGOS][cron] CRON_SECRET no está configurado.");
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }
    if (!bearerMatches(request.headers.get("authorization"), secret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPaymentsEnabled()) {
        return NextResponse.json({ skipped: "payments_disabled" }, { status: 200 });
    }

    try {
        const resumen = await PaymentService.sweepStaleOrders();
        console.info(
            `[PAGOS][cron] vencidas=${resumen.expired} reconciliadas=${resumen.reconciled} fallidas=${resumen.failed}`
        );
        return NextResponse.json({ ok: true, ...resumen });
    } catch (error) {
        console.error("[PAGOS][cron] Barrido fallido:", error);
        return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
    }
}
