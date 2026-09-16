"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { PAID_PLAN_IDS, PLANS, planSkuFor, formatCOP, type BillingPeriod } from "@/config/plans";
import { BuyPackageButton } from "@/components/payments/buy-package-button";

/**
 * Tabla de precios de los 3 tiers pagados, con selector anual/mensual.
 *
 * Reutilizable entre la landing y /pricing para que las dos nunca muestren
 * números distintos por haberse desincronizado a mano.
 */

interface Props {
    /** Con botón de compra real (dashboard) o de registro (público). */
    mode: "buy" | "register";
    /** Tier a resaltar como "vigente" cuando se usa dentro del panel. */
    currentPlan?: string | null;
}

export function PricingTable({ mode, currentPlan }: Props) {
    const [period, setPeriod] = useState<BillingPeriod>("ANNUAL");

    return (
        <div>
            <div className="mb-8 flex justify-center">
                <div className="inline-flex rounded-lg border border-border bg-card p-1">
                    {(["ANNUAL", "MONTHLY"] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {p === "ANNUAL" ? "Anual" : "Mensual"}
                        </button>
                    ))}
                </div>
            </div>
            {period === "MONTHLY" && (
                <p className="mb-8 text-center text-xs text-muted-foreground">
                    El mensual cuesta más en total que el anual: es la opción sin compromiso, no la más barata.
                </p>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {PAID_PLAN_IDS.map((id) => {
                    const plan = PLANS[id];
                    const sku = planSkuFor(id, period);
                    if (!sku) return null;
                    const isPopular = !!sku.popular;
                    const isCurrent = currentPlan === id;

                    return (
                        <div
                            key={id}
                            className={`relative rounded-2xl border p-7 ${
                                isPopular ? "border-primary ring-1 ring-primary bg-card" : "border-border bg-card"
                            }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                                    <Star className="h-3 w-3 fill-current" /> Recomendado
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                            <p className="mt-5 text-3xl font-bold text-foreground">
                                {formatCOP(sku.priceCOP)}
                                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                                    / {period === "ANNUAL" ? "año" : "mes"}
                                </span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {sku.credits} trabajadores {period === "ANNUAL" ? "al año" : "al mes"} · {formatCOP(sku.pricePerCredit)}/trabajador
                            </p>
                            <ul className="mt-6 space-y-2.5">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-7">
                                {mode === "register" ? (
                                    <a
                                        href="/register"
                                        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                            isPopular
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "border border-border text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        Empezar
                                    </a>
                                ) : isCurrent ? (
                                    <div className="w-full rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-center text-sm font-medium text-primary">
                                        Tu plan actual
                                    </div>
                                ) : (
                                    <BuyPackageButton packageId={sku.id} label={isCurrent ? "Renovar" : "Elegir este plan"} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
