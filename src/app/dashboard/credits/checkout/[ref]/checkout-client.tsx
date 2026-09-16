"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    FlaskConical,
    Loader2,
    Lock,
    RotateCcw,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProcessResult } from "@/components/payments/payment-brick";
import { formatCOP } from "@/config/plans";

/**
 * Pantalla de pago de una orden.
 *
 * Es también la TERCERA red de seguridad de la acreditación: cada vez que se
 * abre, el servidor reconcilia la orden contra Mercado Pago. Si el webhook se
 * perdió, basta con que el usuario vuelva aquí para que sus créditos entren.
 *
 * Dos clases de error, y no se mezclan: la orden no existe (fatal: se
 * sustituye la pantalla) y el intento de pago falló (no fatal: se muestra
 * encima del formulario, que sigue montado para reintentar).
 *
 * Presentación: un aviso es una ficha del sistema (tokens `--color-risk-*` /
 * `--color-info`), no verdes y rojos sueltos de la paleta por defecto de
 * Tailwind, y la columna mantiene un solo bloque por ancho de pantalla en
 * móvil.
 */

interface EstadoOrden {
    internalRef: string;
    status: string;
    message: string;
    amountCOP: number;
    paymentTypeId: string | null;
    externalResourceUrl: string | null;
    settled: boolean;
    pending: boolean;
    expiresAt: string;
    publicKey: string | null;
    mode: "test" | "production" | null;
    payerEmail: string | null;
    package: { id: string; name: string; credits: number } | null;
}

/**
 * El SDK de Mercado Pago accede a `window` al inicializarse, así que el Brick
 * no puede renderizarse en el servidor. Con `ssr: false` se carga sólo en el
 * navegador y además no engorda el paquete de quienes nunca abren el checkout.
 */
const PaymentBrick = dynamic(
    () => import("@/components/payments/payment-brick").then((m) => m.PaymentBrick),
    {
        ssr: false,
        loading: () => (
            <div
                className="flex items-center justify-center gap-2.5 rounded-xl border border-dashed px-6 py-12 text-[13px] text-text-secondary"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-muted)" }}
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando medios de pago…
            </div>
        ),
    }
);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Cada cuánto se vuelve a consultar mientras el pago está en vuelo. */
const INTERVALO_CONSULTA_MS = 5_000;

const ESTADOS_CERRADOS_SIN_PAGO = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"];
const ESTADOS_REVERTIDOS = ["REFUNDED", "CHARGED_BACK"];

/** Volver siempre lleva al plan: /dashboard/credits sólo redirige allí. */
const RUTA_PLAN = "/dashboard/plan";

export function CheckoutClient({ internalRef }: { internalRef: string }) {
    const router = useRouter();
    const [orden, setOrden] = useState<EstadoOrden | null>(null);
    const [cargando, setCargando] = useState(true);
    /** La orden no existe o no se pudo cargar: sustituye la pantalla. */
    const [errorFatal, setErrorFatal] = useState<string | null>(null);
    /** El intento de pago falló: se muestra encima del formulario. */
    const [errorPago, setErrorPago] = useState<string | null>(null);

    const consultar = useCallback(async () => {
        try {
            const respuesta = await fetch(`/api/payments/orders/${internalRef}`, {
                cache: "no-store",
            });
            if (respuesta.status === 404) {
                setErrorFatal("No encontramos esta orden.");
                return null;
            }
            if (!respuesta.ok) return null;

            const datos = (await respuesta.json()) as EstadoOrden;
            setOrden(datos);
            return datos;
        } catch {
            // Un fallo de red puntual no debe vaciar la pantalla: se conserva
            // el último estado conocido y se reintenta en el siguiente ciclo.
            return null;
        } finally {
            setCargando(false);
        }
    }, [internalRef]);

    useEffect(() => {
        void consultar();
    }, [consultar]);

    // Sondeo mientras el pago sigue en vuelo (PSE y Efecty tardan).
    useEffect(() => {
        if (!orden?.pending) return;
        const id = setInterval(() => void consultar(), INTERVALO_CONSULTA_MS);
        return () => clearInterval(id);
    }, [orden?.pending, consultar]);

    // Al acreditarse, el saldo del encabezado queda viejo: se refresca.
    useEffect(() => {
        if (orden?.settled) router.refresh();
    }, [orden?.settled, router]);

    const manejarResultado = useCallback(
        (resultado: ProcessResult) => {
            setErrorPago(null);
            // PSE manda al portal del banco y Efecty entrega un cupón.
            if (resultado.externalResourceUrl) {
                window.location.href = resultado.externalResourceUrl;
                return;
            }
            void consultar();
        },
        [consultar]
    );

    const manejarFallo = useCallback(
        (mensaje: string) => {
            setErrorPago(mensaje);
            // El servidor pudo haber devuelto la orden a CREATED (rechazo
            // definitivo) o dejarla en PROCESSING (fallo ambiguo): se relee
            // para que la pantalla refleje lo que de verdad pasó.
            void consultar();
        },
        [consultar]
    );

    if (cargando) {
        return (
            <Contenedor>
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-[14px] text-text-secondary">Cargando tu orden…</p>
                </div>
            </Contenedor>
        );
    }

    if (errorFatal || !orden) {
        return (
            <Contenedor>
                <Aviso
                    tono="error"
                    icono={XCircle}
                    titulo="Orden no disponible"
                    texto={errorFatal ?? "No pudimos cargar esta orden."}
                    accion={<Volver texto="Volver a mi plan" />}
                />
            </Contenedor>
        );
    }

    const pagosDeshabilitados = !orden.publicKey;
    const vencimiento = new Date(orden.expiresAt);
    const cerradoSinPago =
        !orden.pending && !orden.settled && ESTADOS_CERRADOS_SIN_PAGO.includes(orden.status);

    return (
        <Contenedor>
            {/* Encabezado + resumen de la orden */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                            Orden de compra
                        </p>
                        <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-foreground sm:text-[22px]">
                            {orden.package ? orden.package.name : "Compra de unidades"}
                        </h1>
                        <p className="mt-1 font-mono text-[12px] tabular-nums text-text-muted">
                            Ref. {orden.internalRef}
                        </p>
                    </div>
                    <Link
                        href={RUTA_PLAN}
                        className="inline-flex shrink-0 items-center gap-1.5 self-start text-[13px] font-medium text-text-secondary transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Link>
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-border-muted pt-5 sm:grid-cols-2">
                    {orden.package && orden.package.credits > 0 && (
                        <div className="flex items-baseline justify-between gap-3 sm:block">
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                                Incluye
                            </dt>
                            <dd className="font-mono text-[15px] font-semibold tabular-nums text-foreground sm:mt-1.5">
                                {orden.package.credits} trabajadores
                            </dd>
                        </div>
                    )}
                    <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                            Total a pagar
                        </dt>
                        <dd className="font-mono text-[22px] font-semibold leading-none tabular-nums text-foreground sm:mt-1.5">
                            {formatCOP(orden.amountCOP)}
                        </dd>
                    </div>
                </dl>
            </div>

            {orden.mode === "test" && (
                <Aviso
                    tono="info"
                    icono={FlaskConical}
                    titulo="Modo de pruebas"
                    texto="No se cobra dinero real. Usa las tarjetas de prueba de Mercado Pago y, como correo del pagador, cualquier correo real distinto al de la cuenta que recibe los pagos (los correos @testuser.com no funcionan con estas credenciales)."
                />
            )}

            {/* Acreditado */}
            {orden.settled && orden.status === "APPROVED" && (
                <Aviso
                    tono="exito"
                    icono={CheckCircle2}
                    titulo="¡Pago aprobado!"
                    texto={
                        orden.package?.credits
                            ? `Se acreditaron ${orden.package.credits} trabajadores a tu cuenta.`
                            : "Tu compra quedó acreditada en la cuenta."
                    }
                    accion={
                        <Button asChild className="press-feedback w-full sm:w-auto">
                            <Link href={RUTA_PLAN}>Ver mi plan</Link>
                        </Button>
                    }
                />
            )}

            {/* Revertido: se acreditó y luego hubo reembolso o contracargo */}
            {ESTADOS_REVERTIDOS.includes(orden.status) && (
                <Aviso
                    tono="error"
                    icono={RotateCcw}
                    titulo={orden.status === "REFUNDED" ? "Pago reembolsado" : "Pago con contracargo"}
                    texto={
                        orden.settled
                            ? `${orden.message} Los ${orden.package?.credits ?? ""} créditos de esta compra fueron retirados de tu saldo.`
                            : orden.message
                    }
                    accion={<Volver texto="Ver mi plan" />}
                />
            )}

            {/* En vuelo */}
            {orden.pending && (
                <Aviso
                    tono="aviso"
                    icono={Clock}
                    iconoAnimado
                    titulo="Esperando confirmación"
                    texto={
                        orden.paymentTypeId === "ticket" && !Number.isNaN(vencimiento.getTime())
                            ? `${orden.message} El cupón vence el ${vencimiento.toLocaleDateString("es-CO", { day: "numeric", month: "long" })}.`
                            : orden.message
                    }
                    accion={
                        orden.externalResourceUrl ? (
                            <Button asChild className="press-feedback w-full sm:w-auto">
                                <a
                                    href={orden.externalResourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {orden.paymentTypeId === "ticket"
                                        ? "Ver mi cupón de pago"
                                        : "Continuar en el banco"}
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        ) : undefined
                    }
                />
            )}

            {/* Cerrado sin pago */}
            {cerradoSinPago && (
                <Aviso
                    tono="error"
                    icono={XCircle}
                    titulo="El pago no se completó"
                    texto={orden.message}
                    accion={<Volver texto="Intentar de nuevo" />}
                />
            )}

            {/* Formulario de pago */}
            {orden.status === "CREATED" && !pagosDeshabilitados && (
                <div className="space-y-4">
                    {errorPago && (
                        <Aviso
                            tono="error"
                            icono={AlertTriangle}
                            titulo="No se pudo procesar el pago"
                            texto={errorPago}
                        />
                    )}
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border-muted px-4 py-3 sm:px-6">
                            <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <p className="text-[12px] font-medium text-text-secondary">
                                Pago seguro procesado por Mercado Pago
                            </p>
                        </div>
                        <div className="p-4 sm:p-6">
                            <PaymentBrick
                                publicKey={orden.publicKey!}
                                internalRef={orden.internalRef}
                                amountCOP={orden.amountCOP}
                                payerEmail={orden.mode === "production" ? orden.payerEmail : null}
                                onResult={manejarResultado}
                                onFailure={manejarFallo}
                            />
                        </div>
                    </div>
                </div>
            )}

            {orden.status === "CREATED" && pagosDeshabilitados && (
                <Aviso
                    tono="error"
                    icono={AlertTriangle}
                    titulo="Pagos no disponibles"
                    texto="La pasarela aún no está configurada. Escríbenos y te ayudamos a completar la compra."
                />
            )}
        </Contenedor>
    );
}

function Contenedor({ children }: { children: React.ReactNode }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
            className="mx-auto w-full max-w-2xl space-y-4"
        >
            {children}
        </motion.div>
    );
}

function Volver({ texto }: { texto: string }) {
    return (
        <Button asChild className="press-feedback w-full sm:w-auto">
            <Link href={RUTA_PLAN}>{texto}</Link>
        </Button>
    );
}

type Tono = "exito" | "aviso" | "error" | "info";

/**
 * Los cuatro tonos salen de los tokens del sistema: éxito de la escala de
 * riesgo bajo, advertencia de la media, error de la muy alta, e información
 * del azul informativo. Así el modo oscuro llega gratis.
 */
const TONOS: Record<Tono, { bg: string; border: string; text: string; icono: string }> = {
    exito: {
        bg: "var(--color-risk-low-bg)",
        border: "var(--color-risk-low-border)",
        text: "var(--color-risk-low-text)",
        icono: "var(--color-risk-low-solid)",
    },
    aviso: {
        bg: "var(--color-risk-medium-bg)",
        border: "var(--color-risk-medium-border)",
        text: "var(--color-risk-medium-text)",
        icono: "var(--color-risk-medium-solid)",
    },
    error: {
        bg: "var(--color-risk-veryhigh-bg)",
        border: "var(--color-risk-veryhigh-border)",
        text: "var(--color-risk-veryhigh-text)",
        icono: "var(--color-risk-veryhigh-solid)",
    },
    info: {
        bg: "color-mix(in srgb, var(--color-info) 10%, transparent)",
        border: "color-mix(in srgb, var(--color-info) 28%, transparent)",
        text: "var(--color-info)",
        icono: "var(--color-info)",
    },
};

function Aviso({
    tono,
    icono: Icono,
    iconoAnimado = false,
    titulo,
    texto,
    accion,
}: {
    tono: Tono;
    icono: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    iconoAnimado?: boolean;
    titulo: string;
    texto: string;
    accion?: React.ReactNode;
}) {
    const estilo = TONOS[tono];

    return (
        <div
            className="flex items-start gap-3 rounded-xl border px-4 py-4 sm:px-5"
            style={{ background: estilo.bg, borderColor: estilo.border }}
            role={tono === "error" ? "alert" : undefined}
        >
            <Icono
                className={`mt-0.5 h-5 w-5 shrink-0 ${iconoAnimado ? "animate-pulse" : ""}`}
                style={{ color: estilo.icono }}
            />
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: estilo.text }}>
                    {titulo}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{texto}</p>
                {accion && <div className="mt-4">{accion}</div>}
            </div>
        </div>
    );
}
