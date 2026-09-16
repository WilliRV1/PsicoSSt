"use client";

/**
 * Interruptor de la renovación automática.
 *
 * No se dibuja solo: desaparece cuando no hay nada que renovar (plan gratuito)
 * o cuando los pagos no están configurados. Mostrar un botón que va a fallar es
 * peor que no mostrarlo.
 *
 * Activar no cambia nada por sí mismo — manda a Mercado Pago, que es donde el
 * psicólogo autoriza el cobro. Por eso el texto habla de «autorizar» y el
 * estado vuelve como PENDIENTE hasta que su webhook confirme: prometer aquí
 * que quedó activa dejaría a alguien creyendo que su plan se renueva solo.
 */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { formatCOP, getPackageById, type PlanId } from "@/config/plans";

type AutoRenewStatus = "PENDING" | "AUTHORIZED" | "PAUSED" | "CANCELLED";

interface AutoRenewalState {
    enabled: boolean;
    status: AutoRenewStatus | null;
    skuId: string | null;
    updatedAt: string | null;
    available: boolean;
}

interface Props {
    plan: PlanId;
    billingPeriod?: "ANNUAL" | "MONTHLY";
    /** Fecha de vencimiento del periodo vigente, para decir cuándo se cobraría. */
    periodEnd?: string;
    onChange?: () => void;
}

const fechaLarga = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

export function AutoRenewalCard({ plan, billingPeriod, periodEnd, onChange }: Props) {
    const [state, setState] = useState<AutoRenewalState | null>(null);
    const [trabajando, setTrabajando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(() => {
        fetch("/api/plan/auto-renewal")
            .then((r) => r.json())
            .then(setState)
            .catch(() => setState(null));
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // El SKU que se recobraría es el del plan y la cadencia vigentes.
    const skuId = billingPeriod ? `${plan}_${billingPeriod === "ANNUAL" ? "YEAR" : "MONTH"}` : null;
    const sku = skuId ? getPackageById(skuId) : null;

    // Plan gratuito, cadencia desconocida o pasarela sin configurar: nada que ofrecer.
    if (!state?.available || !sku || plan === "RESIDENTE") return null;

    const status = state.status;
    const activa = status === "AUTHORIZED";

    async function activar() {
        setTrabajando(true);
        setError(null);
        try {
            const r = await fetch("/api/plan/auto-renewal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skuId }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "No se pudo activar.");
            // Se autoriza en el dominio de Mercado Pago.
            window.location.href = data.initPoint;
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo activar.");
            setTrabajando(false);
        }
    }

    async function cancelar() {
        setTrabajando(true);
        setError(null);
        try {
            const r = await fetch("/api/plan/auto-renewal", { method: "DELETE" });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "No se pudo cancelar.");
            cargar();
            onChange?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo cancelar.");
        } finally {
            setTrabajando(false);
        }
    }

    const tono = activa
        ? { bg: "var(--color-teal-light)", text: "var(--color-teal-dark)", Icon: CheckCircle2 }
        : status === "PAUSED"
          ? {
                bg: "var(--color-risk-medium-bg)",
                text: "var(--color-risk-medium-text)",
                Icon: AlertTriangle,
            }
          : status === "PENDING"
            ? {
                  bg: "color-mix(in srgb, var(--color-info) 14%, transparent)",
                  text: "var(--color-info)",
                  Icon: Clock,
              }
            : null;

    const leyenda = activa
        ? periodEnd
            ? `Se cobrarán ${formatCOP(sku.priceCOP)} el ${fechaLarga(periodEnd)} y tu plan seguirá activo sin que hagas nada.`
            : `Se cobrarán ${formatCOP(sku.priceCOP)} al vencer cada periodo.`
        : status === "PENDING"
          ? "Falta aprobarla en Mercado Pago. Si no completaste el proceso, vuelve a intentarlo."
          : status === "PAUSED"
            ? "Mercado Pago la suspendió, normalmente por un cobro rechazado. Vuelve a autorizarla para reactivarla."
            : `Autoriza a Mercado Pago a cobrar ${formatCOP(sku.priceCOP)} al vencer cada periodo, para que tu plan no se interrumpa.`;

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                            Renovación automática
                        </h3>
                        {tono && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: tono.bg, color: tono.text }}
                            >
                                <tono.Icon className="h-3 w-3" />
                                {activa ? "Activa" : status === "PENDING" ? "Pendiente" : "Suspendida"}
                            </span>
                        )}
                    </div>
                    <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-text-secondary">{leyenda}</p>
                    {error && (
                        <p
                            className="mt-2 text-[12px]"
                            style={{ color: "var(--color-risk-veryhigh-text)" }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={activa ? cancelar : activar}
                    disabled={trabajando}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60"
                    style={
                        activa
                            ? { borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }
                            : {
                                  borderColor: "transparent",
                                  background: "var(--color-primary)",
                                  color: "white",
                              }
                    }
                >
                    {trabajando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        !activa && <RefreshCw className="h-4 w-4" />
                    )}
                    {activa ? "Cancelar renovación" : status === "PENDING" ? "Reintentar" : "Activar"}
                </button>
            </div>

            {activa && (
                <p className="mt-3 border-t border-border pt-3 text-[12px] text-text-muted">
                    Cancelarla no afecta el periodo que ya pagaste: sigue vigente hasta su vencimiento.
                </p>
            )}
        </div>
    );
}
