import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { PaymentService, PaymentOrderError } from "@/lib/payments/payment-service";
import { MercadoPagoApiError } from "@/lib/payments/mercadopago-client";
import { MercadoPagoConfigError } from "@/lib/payments/config";
import { resolveNotificationUrl } from "@/lib/payments/urls";

/**
 * Envía a Mercado Pago el formulario que produjo el Payment Brick.
 *
 * Nótese lo que NO se acepta del cliente: ni el monto, ni la referencia, ni el
 * paquete. Sólo el token de la tarjeta (que ya viene tokenizado por Mercado
 * Pago, sin datos sensibles) y la referencia de la orden, que se valida contra
 * el psicólogo de la sesión.
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
            // El mensaje de Mercado Pago puede ser técnico; se registra completo
            // y al usuario se le da algo accionable.
            console.error(`[PAGOS] API respondió ${error.httpStatus}: ${error.message}`);
            return NextResponse.json(
                {
                    error: "Mercado Pago no pudo procesar el pago. Verifica los datos e intenta de nuevo.",
                    code: "GATEWAY_ERROR",
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
