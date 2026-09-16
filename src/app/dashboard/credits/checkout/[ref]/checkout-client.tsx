"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    RotateCcw,
    XCircle,
} from "lucide-react";
import type { ProcessResult } from "@/components/payments/payment-brick";
import { formatCOP } from "@/config/credit-packages";

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
            <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Cargando medios de pago…
            </div>
        ),
    }
);

/** Cada cuánto se vuelve a consultar mientras el pago está en vuelo. */
const INTERVALO_CONSULTA_MS = 5_000;

const ESTADOS_CERRADOS_SIN_PAGO = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"];
const ESTADOS_REVERTIDOS = ["REFUNDED", "CHARGED_BACK"];

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
                <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Cargando tu orden…</span>
                </div>
            </Contenedor>
        );
    }

    if (errorFatal || !orden) {
        return (
            <Contenedor>
                <Aviso
                    tono="error"
                    icono={<XCircle className="h-5 w-5 text-red-500" />}
                    titulo="Orden no disponible"
                    texto={errorFatal ?? "No pudimos cargar esta orden."}
                    accion={<Volver texto="Volver a los paquetes" />}
                />
            </Contenedor>
        );
    }

    const pagosDeshabilitados = !orden.publicKey;
    const vencimiento = new Date(orden.expiresAt);

    return (
        <Contenedor>
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        {orden.package
                            ? `Paquete ${orden.package.name}`
                            : "Compra de créditos"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {orden.package && `${orden.package.credits} créditos · `}
                        {formatCOP(orden.amountCOP)}
                    </p>
                </div>
                <Link
                    href="/dashboard/credits"
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Link>
            </div>

            {orden.mode === "test" && (
                <Aviso
                    tono="aviso"
                    icono={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                    titulo="Modo de pruebas"
                    texto="No se cobra dinero real. Usa las tarjetas de prueba de Mercado Pago y, como correo del pagador, cualquier correo real distinto al de la cuenta que recibe los pagos (los correos @testuser.com no funcionan con estas credenciales)."
                />
            )}

            {/* Acreditado */}
            {orden.settled && orden.status === "APPROVED" && (
                <Aviso
                    tono="exito"
                    icono={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    titulo="¡Pago aprobado!"
                    texto={`Se acreditaron ${orden.package?.credits ?? ""} créditos a tu cuenta.`}
                    accion={
                        <Link
                            href="/dashboard/credits"
                            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Ver mis créditos
                        </Link>
                    }
                />
            )}

            {/* Revertido: se acreditó y luego hubo reembolso o contracargo */}
            {ESTADOS_REVERTIDOS.includes(orden.status) && (
                <Aviso
                    tono="error"
                    icono={<RotateCcw className="h-5 w-5 text-red-500" />}
                    titulo={
                        orden.status === "REFUNDED" ? "Pago reembolsado" : "Pago con contracargo"
                    }
                    texto={
                        orden.settled
                            ? `${orden.message} Los ${orden.package?.credits ?? ""} créditos de esta compra fueron retirados de tu saldo.`
                            : orden.message
                    }
                    accion={<Volver texto="Ver mis créditos" />}
                />
            )}

            {/* En vuelo */}
            {orden.pending && (
                <Aviso
                    tono="aviso"
                    icono={<Clock className="h-5 w-5 text-amber-500 animate-pulse" />}
                    titulo="Esperando confirmación"
                    texto={
                        orden.paymentTypeId === "ticket" && !Number.isNaN(vencimiento.getTime())
                            ? `${orden.message} El cupón vence el ${vencimiento.toLocaleDateString("es-CO", { day: "numeric", month: "long" })}.`
                            : orden.message
                    }
                    accion={
                        orden.externalResourceUrl ? (
                            <a
                                href={orden.externalResourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                {orden.paymentTypeId === "ticket"
                                    ? "Ver mi cupón de pago"
                                    : "Continuar en el banco"}
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        ) : undefined
                    }
                />
            )}

            {/* Cerrado sin pago */}
            {!orden.pending &&
                !orden.settled &&
                ESTADOS_CERRADOS_SIN_PAGO.includes(orden.status) && (
                    <Aviso
                        tono="error"
                        icono={<XCircle className="h-5 w-5 text-red-500" />}
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
                            icono={<AlertTriangle className="h-5 w-5 text-red-500" />}
                            titulo="No se pudo procesar el pago"
                            texto={errorPago}
                        />
                    )}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
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
            )}

            {orden.status === "CREATED" && pagosDeshabilitados && (
                <Aviso
                    tono="error"
                    icono={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    titulo="Pagos no disponibles"
                    texto="La pasarela aún no está configurada. Escríbenos y te ayudamos a completar la compra."
                />
            )}
        </Contenedor>
    );
}

function Contenedor({ children }: { children: React.ReactNode }) {
    return <div className="max-w-2xl mx-auto space-y-4">{children}</div>;
}

function Volver({ texto }: { texto: string }) {
    return (
        <Link
            href="/dashboard/credits"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
            {texto}
        </Link>
    );
}

function Aviso({
    tono,
    icono,
    titulo,
    texto,
    accion,
}: {
    tono: "exito" | "aviso" | "error";
    icono: React.ReactNode;
    titulo: string;
    texto: string;
    accion?: React.ReactNode;
}) {
    const estilos = {
        exito: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
        aviso: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
        error: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
    }[tono];

    return (
        <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${estilos}`} role={tono === "error" ? "alert" : undefined}>
            <div className="shrink-0 mt-0.5">{icono}</div>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">{titulo}</p>
                <p className="text-sm text-muted-foreground mt-1">{texto}</p>
                {accion && <div className="mt-3">{accion}</div>}
            </div>
        </div>
    );
}
