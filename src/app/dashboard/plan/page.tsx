"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Gift,
    Loader2,
    Receipt,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";
import { PURCHASABLE_SKUS, formatCOP, type PlanId } from "@/config/plans";
import { BuyPackageButton } from "@/components/payments/buy-package-button";
import { PricingTable } from "@/components/payments/pricing-table";

/**
 * «Mi plan»: suscripción, cupo de unidades y movimientos del saldo.
 *
 * La pantalla se construye sobre los tokens del sistema (`--color-risk-*`,
 * `--color-teal-*`, `--color-info`) en vez de clases sueltas de la paleta por
 * defecto de Tailwind: antes el aviso de vencimiento y los tonos de cada
 * movimiento usaban rojos, verdes e índigos de esa paleta, que este tema no
 * define y que no se adaptan al modo oscuro.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface PlanState {
    plan: PlanId | null;
    planName?: string;
    status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "EXPIRED";
    periodEnd?: string;
    daysLeft?: number;
    writable?: boolean;
    unitsAvailable?: number;
    quotaGranted?: number;
    orgLimit?: number | null;
    orgCount?: number;
    draftReports?: boolean;
    canImport?: boolean;
    canUseClima?: boolean;
    features?: Record<string, string>;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    priceCOP?: number;
    description?: string;
    expiresAt?: string | null;
    createdAt: string;
}

/** Tonos semánticos del sistema, resueltos a variables CSS. */
const TONE: Record<"brand" | "positive" | "warning" | "negative" | "info" | "neutral", string> = {
    brand: "var(--color-primary)",
    positive: "var(--color-risk-low-text)",
    warning: "var(--color-risk-medium-text)",
    negative: "var(--color-risk-veryhigh-text)",
    info: "var(--color-info)",
    neutral: "var(--color-text-secondary)",
};

type TxTone = keyof typeof TONE;

const txTypeConfig: Record<string, { label: string; icon: "up" | "down" | "gift"; tone: TxTone }> = {
    PLAN_QUOTA: { label: "Cupo del plan", icon: "gift", tone: "brand" },
    PURCHASE: { label: "Compra", icon: "up", tone: "positive" },
    TRIAL_GRANT: { label: "Prueba", icon: "gift", tone: "info" },
    ADMIN_GRANT: { label: "Asignación", icon: "gift", tone: "info" },
    CONSUMPTION: { label: "Trabajador gestionado", icon: "down", tone: "neutral" },
    REFUND: { label: "Anulación", icon: "up", tone: "positive" },
    REVERSAL: { label: "Reversión", icon: "down", tone: "negative" },
    QUOTA_EXPIRY: { label: "Vencimiento", icon: "down", tone: "warning" },
};

const statusConfig: Record<
    NonNullable<PlanState["status"]>,
    { label: string; bg: string; text: string; icon: LucideIcon }
> = {
    TRIAL: {
        label: "Periodo de prueba",
        bg: "color-mix(in srgb, var(--color-info) 14%, transparent)",
        text: "var(--color-info)",
        icon: Sparkles,
    },
    ACTIVE: {
        label: "Activo",
        bg: "var(--color-teal-light)",
        text: "var(--color-teal-dark)",
        icon: CheckCircle2,
    },
    PAST_DUE: {
        label: "Pago pendiente",
        bg: "var(--color-risk-medium-bg)",
        text: "var(--color-risk-medium-text)",
        icon: Clock,
    },
    EXPIRED: {
        label: "Vencido",
        bg: "var(--color-risk-veryhigh-bg)",
        text: "var(--color-risk-veryhigh-text)",
        icon: AlertTriangle,
    },
};

const fechaLarga = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

export default function PlanPage() {
    const [state, setState] = useState<PlanState | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cargando, setCargando] = useState(true);
    const reduceMotion = useReducedMotion();

    const refresh = useCallback(() => {
        const plan = fetch("/api/plan")
            .then((r) => r.json())
            .then(setState)
            .catch(() => {});
        const movimientos = fetch("/api/credits/transactions")
            .then((r) => r.json())
            .then((d) => setTransactions(d.data || []))
            .catch(() => {});
        void Promise.allSettled([plan, movimientos]).then(() => setCargando(false));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addons = PURCHASABLE_SKUS.filter((s) => s.kind !== "plan");

    const isPaidPlan = !!state?.plan && state.plan !== "RESIDENTE";
    const expired = state?.status === "EXPIRED" || state?.status === "PAST_DUE";
    const units = state?.unitsAvailable ?? null;
    const sinUnidades = units !== null && units <= 0;
    const lowUnits = units !== null && units > 0 && units <= 5;
    const estado = state?.status ? statusConfig[state.status] : null;

    // Marco de la ficha de unidades: el color es la primera señal de que hay
    // que recargar, así que sale de la escala de riesgo y no de un gris.
    const unidades = sinUnidades
        ? { bg: "var(--color-risk-veryhigh-bg)", border: "var(--color-risk-veryhigh-border)", text: "var(--color-risk-veryhigh-text)" }
        : lowUnits
          ? { bg: "var(--color-risk-medium-bg)", border: "var(--color-risk-medium-border)", text: "var(--color-risk-medium-text)" }
          : { bg: "var(--color-teal-light)", border: "color-mix(in srgb, var(--color-primary) 30%, transparent)", text: "var(--color-teal-dark)" };

    if (cargando) {
        return (
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-[14px] text-text-secondary">Cargando tu plan…</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
            className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8"
        >
            {/* Encabezado */}
            <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground sm:text-[24px]">Mi plan</h1>
                <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
                    Suscripción anual del profesional. La unidad de uso es el trabajador gestionado por instrumento y
                    periodo: los demás cuestionarios del mismo trabajador en el periodo no descuentan.
                </p>
            </div>

            {expired && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border px-4 py-3.5 sm:px-5"
                    style={{
                        background: "var(--color-risk-veryhigh-bg)",
                        borderColor: "var(--color-risk-veryhigh-border)",
                    }}
                >
                    <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0"
                        style={{ color: "var(--color-risk-veryhigh-solid)" }}
                    />
                    <div className="min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "var(--color-risk-veryhigh-text)" }}>
                            {state?.status === "PAST_DUE" ? "Tu plan tiene un pago pendiente" : "Tu plan venció"}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: "var(--color-risk-veryhigh-text)" }}>
                            Puedes seguir consultando y descargando tus informes. Para crear evaluaciones, invitar
                            trabajadores o firmar, renueva el plan.
                        </p>
                    </div>
                </div>
            )}

            {/* Estado actual */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">Plan actual</p>
                    <p className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.02em] text-foreground">
                        {state?.planName ?? "—"}
                    </p>
                    {estado && (
                        <span
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: estado.bg, color: estado.text }}
                        >
                            <estado.icon className="h-3 w-3" />
                            {estado.label}
                        </span>
                    )}
                    {state?.periodEnd && !expired && (
                        <p className="mt-2 text-[12px] text-text-secondary">Vence el {fechaLarga(state.periodEnd)}</p>
                    )}
                    {state?.draftReports && (
                        <p
                            className="mt-3 rounded-lg px-3 py-2 text-[11px] leading-snug"
                            style={{
                                background: "var(--color-risk-medium-bg)",
                                color: "var(--color-risk-medium-text)",
                            }}
                        >
                            Los informes de este plan son borradores con marca PsicoSST y no se firman.
                        </p>
                    )}
                </div>

                <div
                    className="flex flex-col items-center justify-center rounded-xl border p-5 text-center"
                    style={{ background: unidades.bg, borderColor: unidades.border }}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6 shrink-0" style={{ color: unidades.text }} />
                        <span
                            className="font-mono text-[32px] font-semibold leading-none tabular-nums"
                            style={{ color: unidades.text }}
                        >
                            {units ?? "—"}
                        </span>
                    </div>
                    <p className="mt-2 text-[12px] font-medium" style={{ color: unidades.text }}>
                        trabajadores disponibles
                    </p>
                    {typeof state?.quotaGranted === "number" && state.quotaGranted > 0 && (
                        <p className="mt-1 text-[11px] font-mono tabular-nums" style={{ color: unidades.text, opacity: 0.8 }}>
                            cupo del periodo: {state.quotaGranted}
                        </p>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">Empresas</p>
                    <p className="mt-2 font-mono text-[24px] font-semibold leading-none tabular-nums text-foreground">
                        {state?.orgCount ?? "—"}
                        <span className="ml-1 font-sans text-[14px] font-normal text-text-muted">
                            {state?.orgLimit === null ? "· sin límite" : state?.orgLimit ? `/ ${state.orgLimit}` : ""}
                        </span>
                    </p>
                    {typeof state?.daysLeft === "number" && !expired && (
                        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono tabular-nums">{state.daysLeft}</span> días restantes
                        </p>
                    )}
                </div>
            </div>

            {/* Planes pagados */}
            <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                    {isPaidPlan ? "Cambiar de plan" : "Pasar a un plan pagado"}
                </h2>
                <p className="mt-1 max-w-2xl text-[14px] text-text-secondary">
                    Anual o mensual. Renovar el mismo plan y la misma cadencia suma el cupo nuevo al periodo
                    vigente: no pierdes días.
                </p>
                <div className="mt-4">
                    <PricingTable mode="buy" currentPlan={state?.plan} />
                </div>
            </div>

            {/* Complementos */}
            <section>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">Complementos</h2>
                <p className="mt-1 max-w-2xl text-[14px] text-text-secondary">
                    Unidades adicionales y módulos. El clima organizacional no es un instrumento normativo y no tiene
                    restricción legal de aplicación.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {addons.map((sku) => {
                        const needsClima = sku.id.startsWith("CLIMA");
                        const available = needsClima ? !!state?.canUseClima : isPaidPlan;
                        const requirement = needsClima ? "Disponible en Profesional y Avanzado." : "Disponible en un plan pagado.";
                        return (
                            <div
                                key={sku.id}
                                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
                            >
                                <h3 className="text-[14px] font-semibold leading-snug text-foreground">{sku.name}</h3>
                                <p className="mt-2 font-mono text-[20px] font-semibold leading-none tabular-nums text-foreground">
                                    {formatCOP(sku.priceCOP)}
                                </p>
                                {sku.kind === "credits" && (
                                    <p className="mt-1 text-[12px] text-text-muted">
                                        {formatCOP(sku.pricePerCredit)} por trabajador
                                    </p>
                                )}
                                {sku.kind === "feature" && sku.featureDays && (
                                    <p className="mt-1 text-[12px] text-text-muted">vigencia {sku.featureDays} días</p>
                                )}
                                <div className="mt-4 flex grow items-end">
                                    <BuyPackageButton
                                        packageId={sku.id}
                                        label="Comprar"
                                        variant={available ? "default" : "outline"}
                                        disabled={!available}
                                        disabledHint={requirement}
                                        fullWidth
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Historial */}
            <section>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">Movimientos</h2>
                <p className="mt-1 text-[14px] text-text-secondary">
                    Cada entrada y salida de unidades de tu saldo.
                </p>

                {transactions.length === 0 ? (
                    <div
                        className="mt-4 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-muted)" }}
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-card">
                            <Receipt className="h-5 w-5 text-text-muted" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-foreground">Aún no hay movimientos</h3>
                        <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
                            Aquí aparecerán el cupo de tu plan, tus compras y cada trabajador que gestiones.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Móvil: una ficha por movimiento, sin desplazamiento lateral. */}
                        <ul className="mt-4 space-y-3 sm:hidden">
                            {transactions.map((tx) => {
                                const config = txTypeConfig[tx.type] ?? {
                                    label: tx.type,
                                    icon: "up" as const,
                                    tone: "neutral" as TxTone,
                                };
                                return (
                                    <li
                                        key={tx.id}
                                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <TxIcon type={tx.type} />
                                                <span
                                                    className="truncate text-[13px] font-semibold"
                                                    style={{ color: TONE[config.tone] }}
                                                >
                                                    {config.label}
                                                </span>
                                            </div>
                                            <span
                                                className="shrink-0 font-mono text-[15px] font-semibold tabular-nums"
                                                style={{ color: montoColor(tx.amount) }}
                                            >
                                                {tx.amount > 0 ? "+" : ""}
                                                {tx.amount}
                                            </span>
                                        </div>
                                        {tx.description && (
                                            <p className="mt-2 text-[13px] leading-snug text-text-secondary">
                                                {tx.description}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                                            <span className="font-mono tabular-nums">{fechaCorta(tx.createdAt)}</span>
                                            {tx.priceCOP ? (
                                                <span className="font-mono tabular-nums">{formatCOP(tx.priceCOP)}</span>
                                            ) : null}
                                            {tx.expiresAt ? (
                                                <span className="font-mono tabular-nums">
                                                    vence {fechaCorta(tx.expiresAt)}
                                                </span>
                                            ) : null}
                                            <span className="font-mono tabular-nums">saldo {tx.balanceAfter}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Escritorio: tabla. */}
                        <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:block">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead
                                        style={{
                                            background: "var(--color-surface-muted)",
                                            borderBottom: "1px solid var(--color-border)",
                                        }}
                                    >
                                        <tr>
                                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Fecha
                                            </th>
                                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Tipo
                                            </th>
                                            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Detalle
                                            </th>
                                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Unidades
                                            </th>
                                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Saldo
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx, i) => {
                                            const config = txTypeConfig[tx.type] ?? {
                                                label: tx.type,
                                                icon: "up" as const,
                                                tone: "neutral" as TxTone,
                                            };
                                            return (
                                                <tr
                                                    key={tx.id}
                                                    style={{
                                                        borderTop:
                                                            i > 0 ? "1px solid var(--color-border-muted)" : undefined,
                                                    }}
                                                >
                                                    <td className="whitespace-nowrap px-5 py-3.5 font-mono tabular-nums text-text-secondary">
                                                        {fechaCorta(tx.createdAt)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5">
                                                        <span className="flex items-center gap-2">
                                                            <TxIcon type={tx.type} />
                                                            <span
                                                                className="font-medium"
                                                                style={{ color: TONE[config.tone] }}
                                                            >
                                                                {config.label}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-text-secondary">
                                                        {tx.description || "—"}
                                                        {tx.priceCOP ? (
                                                            <span className="ml-2 font-mono text-[11px] tabular-nums text-text-muted">
                                                                ({formatCOP(tx.priceCOP)})
                                                            </span>
                                                        ) : null}
                                                        {tx.expiresAt ? (
                                                            <span className="ml-2 font-mono text-[11px] tabular-nums text-text-muted">
                                                                · vence {fechaCorta(tx.expiresAt)}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums"
                                                        style={{ color: montoColor(tx.amount) }}
                                                    >
                                                        {tx.amount > 0 ? "+" : ""}
                                                        {tx.amount}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono font-medium tabular-nums text-foreground">
                                                        {tx.balanceAfter}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </motion.div>
    );
}

function montoColor(amount: number) {
    if (amount > 0) return "var(--color-risk-low-text)";
    if (amount < 0) return "var(--color-text-secondary)";
    return "var(--color-text-muted)";
}

function TxIcon({ type }: { type: string }) {
    const config = txTypeConfig[type];
    if (!config) return null;
    const color = TONE[config.tone];
    if (config.icon === "up") return <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color }} />;
    if (config.icon === "down") return <ArrowDownRight className="h-4 w-4 shrink-0" style={{ color }} />;
    return <Gift className="h-4 w-4 shrink-0" style={{ color }} />;
}
