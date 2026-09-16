import { getMercadoPagoConfig } from "./config";

/**
 * Cliente HTTP de la API de Mercado Pago.
 *
 * Se usa `fetch` directo en vez del paquete `mercadopago` a propósito. Sólo
 * consumimos dos endpoints y a cambio ganamos las tres cosas que importan en
 * un plan gratuito de Vercel:
 *
 *   1. Control explícito del timeout. Una lambda del plan Hobby se corta a los
 *      10 s; sin timeout propio, una llamada lenta se lleva por delante toda la
 *      petición y el usuario no recibe ni un error decente.
 *   2. Arranque en frío más liviano — no se carga un SDK entero para dos rutas.
 *   3. Control total de `X-Idempotency-Key`, que es la pieza que impide cobrar
 *      dos veces si el navegador reintenta.
 */

const API_BASE = "https://api.mercadopago.com";

/**
 * 7 segundos deja ~3 s de margen bajo el límite de 10 s del plan Hobby para
 * abrir la conexión a Neon, escribir la orden y responder. Preferimos fallar
 * nosotros con un mensaje claro a que Vercel corte la lambda en seco.
 */
const REQUEST_TIMEOUT_MS = 7_000;

export class MercadoPagoApiError extends Error {
    constructor(
        message: string,
        readonly httpStatus: number,
        /** Descripciones del arreglo `cause` de Mercado Pago, si vino. */
        readonly causes: string[] = [],
        readonly cause_?: unknown
    ) {
        super(message);
        this.name = "MercadoPagoApiError";
    }

    /**
     * ¿Mercado Pago rechazó la petición sin registrar nada?
     *
     * Un 4xx (datos inválidos, correo prohibido, token vencido) significa que
     * NO existe ningún pago del otro lado: la orden puede volver a CREATED y
     * el usuario reintentar. Un 5xx o un timeout es ambiguo — el pago pudo
     * crearse y perderse sólo la respuesta — y exige reconciliar, no reintentar.
     * 408 y 429 se tratan como ambiguos por prudencia.
     */
    get isDefinitiveRejection(): boolean {
        return (
            this.httpStatus >= 400 &&
            this.httpStatus < 500 &&
            this.httpStatus !== 408 &&
            this.httpStatus !== 429
        );
    }
}

/** El pago tal como lo devuelve `GET /v1/payments/{id}`, en lo que usamos. */
export interface MercadoPagoPayment {
    id: number;
    status: string;
    status_detail: string | null;
    external_reference: string | null;
    transaction_amount: number;
    currency_id: string;
    payment_method_id: string | null;
    payment_type_id: string | null;
    /** `false` con credenciales de prueba. Sirve para detectar mezclas. */
    live_mode: boolean;
    date_of_expiration: string | null;
    transaction_details?: { external_resource_url?: string | null } | null;
    point_of_interaction?: {
        transaction_data?: { ticket_url?: string | null } | null;
    } | null;
}

async function request<T>(
    path: string,
    init: RequestInit & { idempotencyKey?: string } = {}
): Promise<{ status: number; body: T }> {
    const { accessToken } = getMercadoPagoConfig();
    const { idempotencyKey, ...rest } = init;

    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(rest.headers as Record<string, string> | undefined),
    };
    if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...rest,
            headers,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            cache: "no-store",
        });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        throw new MercadoPagoApiError(
            timedOut
                ? `Mercado Pago no respondió en ${REQUEST_TIMEOUT_MS / 1000} s`
                : "No se pudo contactar a Mercado Pago",
            503,
            [],
            error
        );
    }

    const raw = await response.text();
    let body: unknown = null;
    if (raw) {
        try {
            body = JSON.parse(raw);
        } catch {
            throw new MercadoPagoApiError(
                `Mercado Pago devolvió una respuesta ilegible (HTTP ${response.status})`,
                response.status
            );
        }
    }

    return { status: response.status, body: body as T };
}

/** Mensaje de error de Mercado Pago, sin volcar el cuerpo entero al registro. */
function describeApiError(body: unknown, fallback: string): string {
    if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        if (typeof record.message === "string" && record.message) return record.message;
        if (typeof record.error === "string" && record.error) return record.error;
    }
    return fallback;
}

/** Arreglo `cause` de Mercado Pago reducido a texto: código y descripción. */
function extractCauses(body: unknown): string[] {
    if (!body || typeof body !== "object") return [];
    const cause = (body as Record<string, unknown>).cause;
    if (!Array.isArray(cause)) return [];
    return cause
        .map((c) => {
            if (!c || typeof c !== "object") return "";
            const r = c as Record<string, unknown>;
            const code = r.code !== undefined && r.code !== null ? String(r.code) : "";
            const desc = typeof r.description === "string" ? r.description : "";
            return [code, desc].filter(Boolean).join(" - ");
        })
        .filter(Boolean)
        .slice(0, 5);
}

/**
 * Consulta un pago. Devuelve `null` si no existe.
 *
 * El `null` no es defensivo de más: el botón «simular notificación» del panel
 * de Mercado Pago envía identificadores que no corresponden a ningún pago, y
 * eso NO es un error nuestro — hay que responderle 200 igual.
 */
export async function fetchPayment(
    paymentId: string | number
): Promise<MercadoPagoPayment | null> {
    const { status, body } = await request<MercadoPagoPayment>(
        `/v1/payments/${encodeURIComponent(String(paymentId))}`,
        { method: "GET" }
    );

    if (status === 404) return null;
    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo consultar el pago en Mercado Pago"),
            status,
            extractCauses(body)
        );
    }

    return body;
}

/**
 * Crea un pago a partir de los datos que entrega el Payment Brick.
 *
 * `idempotencyKey` es el `internalRef` de la orden: como cada orden admite un
 * único intento, dos envíos del mismo formulario devuelven el MISMO pago en
 * vez de cobrar dos veces.
 */
export async function createPayment(
    payload: Record<string, unknown>,
    idempotencyKey: string
): Promise<MercadoPagoPayment> {
    const { status, body } = await request<MercadoPagoPayment>("/v1/payments", {
        method: "POST",
        body: JSON.stringify(payload),
        idempotencyKey,
    });

    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "Mercado Pago rechazó la creación del pago"),
            status,
            extractCauses(body)
        );
    }

    return body;
}

/**
 * URL a la que hay que mandar al usuario para terminar de pagar.
 *
 * PSE la entrega en `transaction_details.external_resource_url` (el portal del
 * banco) y Efecty en `point_of_interaction.transaction_data.ticket_url` (el
 * cupón imprimible). Las tarjetas no traen ninguna: se resuelven en línea.
 */
export function resolveExternalResourceUrl(
    payment: MercadoPagoPayment
): string | null {
    return (
        payment.transaction_details?.external_resource_url ??
        payment.point_of_interaction?.transaction_data?.ticket_url ??
        null
    );
}

/**
 * Busca pagos por `external_reference`.
 *
 * Es la red de seguridad del peor escenario: `/api/payments/process` llamó a
 * Mercado Pago, el cobro se creó, y la respuesta se perdió antes de que
 * pudiéramos guardar el identificador del pago. La orden queda en PROCESSING
 * sin `mercadoPagoPaymentId` y sin esto sería irrecuperable de forma
 * automática — el psicólogo habría pagado y nadie sabría con qué pago
 * emparejarlo. Buscando por nuestra propia referencia, lo encontramos igual.
 */
export async function searchPaymentsByExternalReference(
    externalReference: string
): Promise<MercadoPagoPayment[]> {
    const { status, body } = await request<{ results?: MercadoPagoPayment[] }>(
        `/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}&sort=date_created&criteria=desc`,
        { method: "GET" }
    );

    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo buscar el pago en Mercado Pago"),
            status,
            extractCauses(body)
        );
    }

    return body?.results ?? [];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Preapproval: la autorización de cobro recurrente.
 *
 * Es un recurso DISTINTO del pago único de arriba. Aquí no se cobra nada: se
 * crea una autorización que el psicólogo aprueba en Mercado Pago (por eso se
 * devuelve `init_point` y no se piden datos de tarjeta), y a partir de ahí es
 * Mercado Pago quien genera un pago por periodo y nos avisa por webhook.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Estados que devuelve Mercado Pago para una autorización. */
export type PreapprovalStatus = "pending" | "authorized" | "paused" | "cancelled";

export interface MercadoPagoPreapproval {
    id: string;
    status: PreapprovalStatus;
    /** URL a la que se envía al psicólogo para aprobar la autorización. */
    init_point?: string;
    external_reference?: string;
    payer_email?: string;
    auto_recurring?: {
        frequency: number;
        frequency_type: "days" | "months";
        transaction_amount: number;
        currency_id: string;
    };
}

/** Pago recurrente generado por una autorización. */
export interface MercadoPagoAuthorizedPayment {
    id: string;
    preapproval_id: string;
    /** Identificador del pago real; es el que se concilia contra /v1/payments. */
    payment?: { id: number | string; status?: string };
}

/**
 * Crea la autorización en estado `pending`.
 *
 * Se crea SIN tarjeta a propósito: el psicólogo aprueba en el dominio de
 * Mercado Pago (`init_point`) y así la aplicación nunca toca datos de tarjeta
 * para el cobro recurrente. El estado real llega después por webhook; lo que
 * devuelve esta llamada es sólo el punto de partida.
 */
export async function createPreapproval(
    payload: Record<string, unknown>
): Promise<MercadoPagoPreapproval> {
    const { status, body } = await request<MercadoPagoPreapproval>("/preapproval", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo crear la autorización de cobro recurrente"),
            status,
            extractCauses(body)
        );
    }

    return body;
}

/** Consulta una autorización. `null` si Mercado Pago no la reconoce. */
export async function fetchPreapproval(
    preapprovalId: string
): Promise<MercadoPagoPreapproval | null> {
    const { status, body } = await request<MercadoPagoPreapproval>(
        `/preapproval/${encodeURIComponent(preapprovalId)}`,
        { method: "GET" }
    );

    if (status === 404) return null;
    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo consultar la autorización"),
            status,
            extractCauses(body)
        );
    }

    return body;
}

/**
 * Cancela la autorización. Estado terminal en Mercado Pago: no se reactiva,
 * hay que crear una nueva.
 */
export async function cancelPreapproval(
    preapprovalId: string
): Promise<MercadoPagoPreapproval> {
    const { status, body } = await request<MercadoPagoPreapproval>(
        `/preapproval/${encodeURIComponent(preapprovalId)}`,
        { method: "PUT", body: JSON.stringify({ status: "cancelled" }) }
    );

    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo cancelar la autorización"),
            status,
            extractCauses(body)
        );
    }

    return body;
}

/** Consulta un pago recurrente. `null` si no existe. */
export async function fetchAuthorizedPayment(
    authorizedPaymentId: string | number
): Promise<MercadoPagoAuthorizedPayment | null> {
    const { status, body } = await request<MercadoPagoAuthorizedPayment>(
        `/authorized_payments/${encodeURIComponent(String(authorizedPaymentId))}`,
        { method: "GET" }
    );

    if (status === 404) return null;
    if (status >= 400) {
        throw new MercadoPagoApiError(
            describeApiError(body, "No se pudo consultar el cobro recurrente"),
            status,
            extractCauses(body)
        );
    }

    return body;
}
