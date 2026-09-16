import type { PaymentStatus } from "@/generated/prisma/client";

/**
 * Traducción entre los estados de un pago en Mercado Pago y los de nuestra
 * `PaymentOrder`, en un único lugar.
 *
 * Tener la tabla centralizada evita el error clásico de repartir `if (status
 * === "approved")` por media docena de archivos y que uno de ellos se olvide
 * de `charged_back`.
 */

/** Estados que devuelve la API de pagos de Mercado Pago. */
export type MercadoPagoPaymentStatus =
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";

const STATUS_MAP: Record<MercadoPagoPaymentStatus, PaymentStatus> = {
    pending: "PENDING",
    // `authorized` es una retención sin captura. No usamos cobro en dos pasos,
    // pero si apareciera NO debe acreditar: la plata todavía no se movió.
    authorized: "IN_PROCESS",
    in_process: "IN_PROCESS",
    // Disputa abierta. Los créditos ya otorgados se mantienen hasta que la
    // disputa se resuelva como contracargo.
    in_mediation: "IN_PROCESS",
    approved: "APPROVED",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
    charged_back: "CHARGED_BACK",
};

/**
 * Un estado desconocido se trata como ERROR, nunca como aprobado. Si Mercado
 * Pago añade un estado nuevo, el peor resultado posible es una orden que exige
 * revisión manual — jamás créditos regalados.
 */
export function mapPaymentStatus(mpStatus: string): PaymentStatus {
    return STATUS_MAP[mpStatus as MercadoPagoPaymentStatus] ?? "ERROR";
}

/** Estados de los que una orden ya no sale por sí sola. */
const TERMINAL: ReadonlySet<PaymentStatus> = new Set<PaymentStatus>([
    "APPROVED", "REJECTED", "CANCELLED", "REFUNDED", "CHARGED_BACK", "EXPIRED", "ERROR",
]);

export function isTerminal(status: PaymentStatus): boolean {
    return TERMINAL.has(status);
}

/** El único estado que entrega créditos. */
export function shouldCredit(status: PaymentStatus): boolean {
    return status === "APPROVED";
}

/** Estados que obligan a retirar créditos ya entregados. */
export function shouldReverse(status: PaymentStatus): boolean {
    return status === "REFUNDED" || status === "CHARGED_BACK";
}

/** El usuario sigue esperando: hay que consultar de nuevo más adelante. */
export function isPending(status: PaymentStatus): boolean {
    return status === "PENDING" || status === "IN_PROCESS" || status === "PROCESSING";
}

/**
 * Mensajes para el usuario a partir del `status_detail`.
 *
 * Mercado Pago devuelve códigos como `cc_rejected_insufficient_amount`, que no
 * se le pueden mostrar a un psicólogo. Se traducen a algo accionable y en
 * español de Colombia. Nunca se expone el código crudo en la interfaz: va sólo
 * al registro de la orden, para soporte.
 */
const DETAIL_MESSAGES: Record<string, string> = {
    // Rechazos de tarjeta
    cc_rejected_bad_filled_card_number: "Revisa el número de la tarjeta.",
    cc_rejected_bad_filled_date: "Revisa la fecha de vencimiento de la tarjeta.",
    cc_rejected_bad_filled_security_code: "Revisa el código de seguridad (CVV).",
    cc_rejected_bad_filled_other: "Revisa los datos de la tarjeta.",
    cc_rejected_insufficient_amount: "La tarjeta no tiene fondos suficientes.",
    cc_rejected_card_disabled:
        "La tarjeta está inactiva. Llama a tu banco para activarla.",
    cc_rejected_call_for_authorize:
        "Tu banco debe autorizar este pago. Llámalos y vuelve a intentar.",
    cc_rejected_high_risk:
        "El pago fue rechazado por seguridad. Intenta con otro medio de pago.",
    cc_rejected_blacklist:
        "El pago fue rechazado. Intenta con otro medio de pago.",
    cc_rejected_duplicated_payment:
        "Ya hiciste un pago por ese valor. Si necesitas repetirlo, usa otra tarjeta.",
    cc_rejected_invalid_installments:
        "La tarjeta no admite ese número de cuotas.",
    cc_rejected_max_attempts:
        "Superaste el número de intentos. Prueba con otra tarjeta.",
    cc_rejected_card_type_not_allowed:
        "Ese tipo de tarjeta no está habilitado. Intenta con otra.",
    cc_rejected_other_reason:
        "Tu banco rechazó el pago. Intenta con otro medio de pago.",
    // En espera
    pending_contingency:
        "Estamos procesando tu pago. Te avisamos apenas se acredite.",
    pending_review_manual:
        "Mercado Pago está revisando el pago. Puede tardar unos minutos.",
    pending_waiting_transfer:
        "Completa la transferencia en el portal de tu banco para acreditar los créditos.",
    pending_waiting_payment:
        "Paga el cupón en un punto autorizado. Los créditos se acreditan al confirmarse el pago.",
};

export function describeStatusDetail(
    status: PaymentStatus,
    detail: string | null | undefined
): string {
    if (detail && DETAIL_MESSAGES[detail]) return DETAIL_MESSAGES[detail];

    switch (status) {
        case "APPROVED":
            return "Pago aprobado. Tus créditos ya están disponibles.";
        case "REJECTED":
            return "El pago fue rechazado. Intenta con otro medio de pago.";
        case "CANCELLED":
            return "El pago fue cancelado.";
        case "EXPIRED":
            return "La orden venció. Crea una nueva para volver a intentar.";
        case "REFUNDED":
            return "El pago fue reembolsado.";
        case "CHARGED_BACK":
            return "El pago tuvo un contracargo.";
        case "ERROR":
            return "No pudimos confirmar el pago. Escríbenos y lo revisamos.";
        default:
            return "Estamos procesando tu pago. Te avisamos apenas se acredite.";
    }
}

/**
 * Texto para el usuario cuando Mercado Pago rechaza la PETICIÓN (4xx) antes de
 * registrar un pago. Distinto de `describeStatusDetail`, que traduce el estado
 * de un pago que sí existe.
 *
 * Los mensajes de la API vienen en inglés y a veces son crípticos; los casos
 * conocidos se traducen a algo accionable y el resto se muestra tal cual —
 * es preferible a una caja negra, y nunca contienen secretos.
 */
export function describeGatewayRejection(message: string, causes: string[] = []): string {
    const texto = [message, ...causes].join(" | ").toLowerCase();

    if (texto.includes("payer email forbidden") || texto.includes("4390")) {
        return "Mercado Pago no acepta ese correo para el pago. Usa un correo distinto al de la cuenta que recibe los pagos.";
    }
    if (texto.includes("ip_address")) {
        return "No pudimos determinar tu dirección IP, necesaria para pagar con PSE. Intenta desde otra red o con otro medio de pago.";
    }
    if (texto.includes("card_token") || texto.includes("token")) {
        return "Los datos de la tarjeta vencieron. Vuelve a ingresarlos e intenta de nuevo.";
    }
    if (texto.includes("not_result_by_params") || texto.includes("10102")) {
        return "Ese medio de pago no está disponible en este momento. Intenta con otro.";
    }
    if (texto.includes("invalid") && texto.includes("identification")) {
        return "Revisa el tipo y número de documento.";
    }
    return `Mercado Pago rechazó la solicitud: ${message}`;
}
