import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { extractRequestMeta } from "@/lib/auth/audit";
import {
    PaymentService,
    PaymentOrderError,
    type PayerContext,
} from "@/lib/payments/payment-service";
import { MercadoPagoApiError } from "@/lib/payments/mercadopago-client";
import { MercadoPagoConfigError } from "@/lib/payments/config";
import { resolveCallbackUrl, resolveNotificationUrl } from "@/lib/payments/urls";
import { describeGatewayRejection } from "@/lib/payments/status-map";

/**
 * Envía a Mercado Pago el formulario que produjo el Payment Brick.
 *
 * Nótese lo que NO se acepta del cliente: ni el monto, ni la referencia, ni el
 * paquete. Sólo el token de la tarjeta (que ya viene tokenizado por Mercado
 * Pago, sin datos sensibles) y la referencia de la orden, que se valida contra
 * el psicólogo de la sesión.
 *
 * Lo que el backend AÑADE porque la documentación de Mercado Pago lo exige y el
 * Brick no lo envía: la IP del comprador y la `callback_url` (ambas
 * obligatorias para PSE) y el nombre y correo del pagador desde la sesión.
 */

const bodySchema = z.object({
    internalRef: z.string().min(1).max(128),
    formData: z.object({
        token: z.string().max(256).optional(),
        issuer_id: z.union([z.string(), z.number()]).optional(),
        payment_method_id: z.string().max(64).optional(),
        installments: z.number().int().positive().max(48).optional(),
        payer: z
            .object({
                email: z.string().email().max(254).optional(),
                identification: z
                    .object({
                        type: z.string().max(16).optional(),
                        number: z.string().max(32).optional(),
                    })
                    .optional(),
                entity_type: z.string().max(32).optional(),
                first_name: z.string().max(64).optional(),
                last_name: z.string().max(64).optional(),
            })
            .optional(),
        transaction_details: z
            .object({ financial_institution: z.union([z.string(), z.number()]).optional() })
            .optional(),
    }),
});

/** «Ana María Pérez Gómez» → nombre «Ana María», apellido «Pérez Gómez». */
function splitFullName(fullName: string | null | undefined): {
    firstName: string | null;
    lastName: string | null;
} {
    const partes = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return { firstName: null, lastName: null };
    if (partes.length === 1) return { firstName: partes[0], lastName: null };
    // En Colombia lo habitual son dos nombres y dos apellidos; con 3 o 4
    // palabras la partición por la mitad acierta más que «primera palabra».
    const corte = Math.ceil(partes.length / 2);
    return {
        firstName: partes.slice(0, corte).join(" "),
        lastName: partes.slice(corte).join(" "),
    };
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let parsed;
    try {
        parsed = bodySchema.parse(await request.json());
    } catch {
        return NextResponse.json(
            { error: "Datos de pago inválidos.", code: "BAD_REQUEST" },
            { status: 400 }
        );
    }

    const { formData } = parsed;

    const { ipAddress } = extractRequestMeta(request);
    const usuario = session.user as { email?: string | null; fullName?: string | null; name?: string | null };
    const payer: PayerContext = {
        email: usuario.email ?? null,
        ...splitFullName(usuario.fullName ?? usuario.name),
    };

    try {
        const result = await PaymentService.processBrickPayment({
            psychologistId: session.user.id,
            internalRef: parsed.internalRef,
            form: {
                token: formData.token,
                issuer_id:
                    formData.issuer_id !== undefined ? String(formData.issuer_id) : undefined,
                payment_method_id: formData.payment_method_id,
                installments: formData.installments,
                payer: formData.payer,
                transaction_details: formData.transaction_details?.financial_institution
                    ? {
                          financial_institution: String(
                              formData.transaction_details.financial_institution
                          ),
                      }
                    : undefined,
            },
            payer,
            ipAddress: ipAddress === "unknown" ? null : ipAddress,
            callbackUrl: resolveCallbackUrl(request, parsed.internalRef),
            notificationUrl: resolveNotificationUrl(request),
        });

        return NextResponse.json({
            status: result.status ?? "PROCESSING",
            outcome: result.outcome,
            message: result.message,
            // PSE manda al portal del banco; Efecty entrega un cupón. El cliente
            // redirige si esto no es nulo.
            externalResourceUrl: result.order?.externalResourceUrl ?? null,
            internalRef: parsed.internalRef,
        });
    } catch (error) {
        if (error instanceof PaymentOrderError) {
            const status = error.code === "ORDER_NOT_FOUND" ? 404 : 409;
            return NextResponse.json({ error: error.message, code: error.code }, { status });
        }
        if (error instanceof MercadoPagoConfigError) {
            console.error("[PAGOS] Configuración incompleta:", error.message);
            return NextResponse.json(
                { error: "Los pagos no están disponibles.", code: "PAYMENTS_DISABLED" },
                { status: 503 }
            );
        }
        if (error instanceof MercadoPagoApiError) {
            console.error(
                `[PAGOS] API respondió ${error.httpStatus}: ${error.message}`,
                error.causes
            );
            if (error.isDefinitiveRejection) {
                // Nada se registró en Mercado Pago y la orden volvió a CREATED:
                // el usuario puede corregir y reintentar sobre la misma orden.
                return NextResponse.json(
                    {
                        error: describeGatewayRejection(error.message, error.causes),
                        code: "GATEWAY_REJECTED",
                        retryable: true,
                    },
                    { status: 422 }
                );
            }
            // Ambiguo (5xx, timeout): la orden sigue en PROCESSING y la
            // reconciliación decidirá. No se invita a reintentar a ciegas.
            return NextResponse.json(
                {
                    error: "Mercado Pago no respondió. Estamos verificando el estado de tu pago; no vuelvas a pagar.",
                    code: "GATEWAY_ERROR",
                    retryable: false,
                },
                { status: 502 }
            );
        }
        console.error("[PAGOS] Error procesando el pago:", error);
        return NextResponse.json(
            { error: "No pudimos procesar el pago. Intenta de nuevo." },
            { status: 500 }
        );
    }
}
