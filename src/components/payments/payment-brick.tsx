"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

/**
 * Payment Brick de Mercado Pago.
 *
 * Los campos de tarjeta los renderiza Mercado Pago dentro de un iframe suyo: el
 * número y el CVV nunca tocan nuestro código ni nuestro servidor, que es lo que
 * mantiene a PsicoSST en el nivel de cumplimiento PCI más liviano (SAQ A) pese
 * a que el formulario se vea dentro de la aplicación.
 *
 * Lo que sale de aquí hacia nuestro backend es un TOKEN, no una tarjeta.
 */

export interface ProcessResult {
    status: string;
    outcome: string;
    message?: string;
    externalResourceUrl: string | null;
}

interface Props {
    publicKey: string;
    internalRef: string;
    amountCOP: number;
    payerEmail?: string | null;
    onResult: (result: ProcessResult) => void;
    onFailure: (message: string) => void;
}

/**
 * `initMercadoPago` se llama una sola vez por carga de página: repetirlo con el
 * Brick ya montado deja el formulario en blanco sin dar ningún error.
 *
 * El indicador vive a nivel de módulo, no en un estado de React, para que la
 * inicialización sea idempotente aunque el componente se vuelva a montar.
 */
let sdkInicializado: string | null = null;

function asegurarSdk(publicKey: string) {
    if (sdkInicializado !== publicKey) {
        initMercadoPago(publicKey, { locale: "es-CO" });
        sdkInicializado = publicKey;
    }
}

export function PaymentBrick({
    publicKey,
    internalRef,
    amountCOP,
    payerEmail,
    onResult,
    onFailure,
}: Props) {
    // Este componente sólo se carga en el navegador (ver el `dynamic` con
    // `ssr: false` en checkout-client), así que inicializar aquí es seguro: el
    // SDK necesita `window` y no existiría durante el render en el servidor.
    asegurarSdk(publicKey);

    // El Brick no debe re-montarse cuando cambia el callback del padre; se
    // guardan en refs para que las dependencias del efecto no cambien. La
    // asignación va en un efecto (no en el render) porque escribir un ref
    // durante el render rompe las garantías del modo concurrente de React.
    const onResultRef = useRef(onResult);
    const onFailureRef = useRef(onFailure);
    useEffect(() => {
        onResultRef.current = onResult;
        onFailureRef.current = onFailure;
    });

    // El Brick tarda unos segundos en montar su propio iframe (SDK de
    // Mercado Pago, no nuestro código): sin esto, entre que termina de
    // cargar el chunk de la página y que aparece el formulario real no hay
    // ninguna señal en pantalla, y se ve como si se hubiera colgado.
    const [listo, setListo] = useState(false);

    return (
        <div className="relative min-h-[300px]">
            {!listo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Conectando con Mercado Pago…</span>
                </div>
            )}
            <div className={listo ? undefined : "invisible"}>
        <Payment
            initialization={{
                amount: amountCOP,
                payer: payerEmail ? { email: payerEmail } : undefined,
            }}
            customization={{
                paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                    // PSE y Nequi en Colombia.
                    bankTransfer: "all",
                    // Efecty y demás pagos en efectivo.
                    ticket: "all",
                },
                visual: { style: { theme: "default" } },
            }}
            onReady={() => setListo(true)}
            onSubmit={async ({ formData }) => {
                // El Brick espera una promesa: si se rechaza, muestra el error
                // y deja el formulario utilizable para reintentar.
                const respuesta = await fetch("/api/payments/process", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ internalRef, formData }),
                });

                const datos = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok) {
                    const mensaje =
                        datos?.error ?? "No pudimos procesar el pago. Intenta de nuevo.";
                    onFailureRef.current(mensaje);
                    throw new Error(mensaje);
                }

                onResultRef.current(datos as ProcessResult);
            }}
            onError={(error) => {
                // Errores del propio Brick (validación, red). No son nuestros,
                // pero el usuario necesita enterarse.
                console.error("[PAGOS][brick]", error);
                onFailureRef.current(
                    "Revisa los datos del formulario e intenta de nuevo."
                );
            }}
        />
            </div>
        </div>
    );
}
