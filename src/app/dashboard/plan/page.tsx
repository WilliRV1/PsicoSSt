"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Clock, Gift, ShieldCheck, Users } from "lucide-react";
import { PLANS, PURCHASABLE_SKUS, formatCOP, type PlanId } from "@/config/plans";
import { BuyPackageButton } from "@/components/payments/buy-package-button";

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

const txTypeConfig: Record<string, { label: string; icon: "up" | "down" | "gift"; color: string }> = {
    PLAN_QUOTA: { label: "Cupo del plan", icon: "gift", color: "text-primary" },
    PURCHASE: { label: "Compra", icon: "up", color: "text-green-600" },
    TRIAL_GRANT: { label: "Prueba", icon: "gift", color: "text-indigo-600" },
    ADMIN_GRANT: { label: "Asignación", icon: "gift", color: "text-blue-600" },
    CONSUMPTION: { label: "Trabajador gestionado", icon: "down", color: "text-red-600" },
    REFUND: { label: "Anulación", icon: "up", color: "text-emerald-600" },
    REVERSAL: { label: "Reversión", icon: "down", color: "text-red-700" },
    QUOTA_EXPIRY: { label: "Vencimiento", icon: "down", color: "text-slate-500" },
};

const statusLabel: Record<NonNullable<PlanState["status"]>, string> = {
    TRIAL: "Periodo de prueba",
    ACTIVE: "Activo",
    PAST_DUE: "Pago pendiente",
    EXPIRED: "Vencido",
};

export default function PlanPage() {
    const [state, setState] = useState<PlanState | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const refresh = useCallback(() => {
        fetch("/api/plan").then((r) => r.json()).then(setState).catch(() => {});
        fetch("/api/credits/transactions").then((r) => r.json()).then((d) => setTransactions(d.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const profesional = PLANS.PROFESIONAL;
    const planSku = PURCHASABLE_SKUS.find((s) => s.kind === "plan" && s.plan === "PROFESIONAL");
    const addons = PURCHASABLE_SKUS.filter((s) => s.kind !== "plan");

    const isProfesional = state?.plan === "PROFESIONAL";
    const expired = state?.status === "EXPIRED" || state?.status === "PAST_DUE";
    const units = state?.unitsAvailable ?? null;
    const lowUnits = units !== null && units <= 5;

    const txIcon = (type: string) => {
        const config = txTypeConfig[type];
        if (!config) return null;
        if (config.icon === "up") return <ArrowUp className={`h-4 w-4 ${config.color}`} />;
        if (config.icon === "down") return <ArrowDown className={`h-4 w-4 ${config.color}`} />;
        return <Gift className={`h-4 w-4 ${config.color}`} />;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-foreground">Mi plan</h2>
                <p className="text-sm text-muted-foreground">
                    Suscripción anual del profesional. La unidad de uso es el trabajador gestionado por instrumento y periodo:
                    los demás cuestionarios del mismo trabajador en el periodo no descuentan.
                </p>
            </div>

            {expired && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <p className="font-semibold text-sm text-red-800">Tu plan venció</p>
                        <p className="text-xs mt-0.5 text-red-700">
                            Puedes seguir consultando y descargando tus informes. Para crear evaluaciones, invitar
                            trabajadores o firmar, renueva el plan.
                        </p>
                    </div>
                </div>
            )}

            {/* Estado actual */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan actual</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{state?.planName ?? "—"}</p>
                    <p className={`mt-1 text-sm ${expired ? "text-red-600" : "text-muted-foreground"}`}>
                        {state?.status ? statusLabel[state.status] : ""}
                        {state?.periodEnd && !expired && (
                            <>
                                {" · vence el "}
                                {new Date(state.periodEnd).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                            </>
                        )}
                    </p>
                    {state?.draftReports && (
                        <p className="mt-3 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">
                            Los informes de este plan son borradores con marca PsicoSST y no se firman.
                        </p>
                    )}
                </div>

                <div className={`rounded-xl border-2 p-5 text-center ${
                    units !== null && units <= 0 ? "border-red-300 bg-red-50" : lowUnits ? "border-amber-300 bg-amber-50" : "border-primary/30 bg-primary/5"
                }`}>
                    <div className="flex items-center gap-2 justify-center">
                        <Users className={`h-6 w-6 ${units !== null && units <= 0 ? "text-red-500" : "text-primary"}`} />
                        <span className="text-3xl font-bold text-foreground">{units ?? "—"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">trabajadores disponibles</p>
                    {typeof state?.quotaGranted === "number" && state.quotaGranted > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1">cupo del periodo: {state.quotaGranted}</p>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresas</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                        {state?.orgCount ?? "—"}
                        <span className="text-base font-normal text-muted-foreground">
                            {state?.orgLimit === null ? " · sin límite" : state?.orgLimit ? ` / ${state.orgLimit}` : ""}
                        </span>
                    </p>
                    {typeof state?.daysLeft === "number" && !expired && (
                        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {state.daysLeft} días restantes
                        </p>
                    )}
                </div>
            </div>

            {/* Plan Profesional */}
            {planSku && (
                <div className={`rounded-2xl border-2 p-6 shadow-sm ${isProfesional && !expired ? "border-border bg-card" : "border-primary ring-1 ring-primary bg-card"}`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Plan {profesional.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{profesional.tagline}</p>
                            <ul className="mt-4 space-y-2">
                                {profesional.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                                        <Check className="h-4 w-4 text-green-600 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:text-right shrink-0">
                            <p className="text-3xl font-bold text-foreground">{formatCOP(profesional.priceCOP)}</p>
                            <p className="text-xs text-muted-foreground mb-4">por año · IVA incluido</p>
                            <BuyPackageButton
                                packageId={planSku.id}
                                label={isProfesional && !expired ? "Renovar un año más" : "Pasar a Profesional"}
                            />
                            {isProfesional && !expired && (
                                <p className="text-[11px] text-muted-foreground mt-2">
                                    La renovación se suma al periodo vigente: no pierdes días.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Complementos */}
            <div>
                <h3 className="font-semibold text-foreground mb-1">Complementos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Unidades adicionales y módulos. El clima organizacional no es un instrumento normativo y no tiene
                    restricción legal de aplicación.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {addons.map((sku) => (
                        <div key={sku.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
                            <h4 className="font-semibold text-foreground">{sku.name}</h4>
                            <p className="mt-2 text-xl font-bold text-foreground">{formatCOP(sku.priceCOP)}</p>
                            {sku.kind === "credits" && (
                                <p className="text-xs text-muted-foreground">{formatCOP(sku.pricePerCredit)} por trabajador</p>
                            )}
                            {sku.kind === "feature" && sku.featureDays && (
                                <p className="text-xs text-muted-foreground">vigencia {sku.featureDays} días</p>
                            )}
                            <div className="mt-4">
                                <BuyPackageButton
                                    packageId={sku.id}
                                    label="Comprar"
                                    className={
                                        !isProfesional
                                            ? "w-full py-2.5 px-4 rounded-lg border border-border text-muted-foreground font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                                            : undefined
                                    }
                                />
                                {!isProfesional && (
                                    <p className="text-[11px] text-muted-foreground mt-2">Disponible en el plan Profesional.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Historial */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">Movimientos</h3>
                {transactions.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
                        <p className="text-sm text-muted-foreground">Aún no hay movimientos.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalle</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Unidades</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.map((tx) => {
                                        const config = txTypeConfig[tx.type] || { label: tx.type, icon: "up" as const, color: "text-gray-600" };
                                        return (
                                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {txIcon(tx.type)}
                                                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {tx.description || "—"}
                                                    {tx.priceCOP ? <span className="ml-2 text-xs">({formatCOP(tx.priceCOP)})</span> : null}
                                                    {tx.expiresAt ? (
                                                        <span className="ml-2 text-xs">
                                                            · vence {new Date(tx.expiresAt).toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className={`px-5 py-3 whitespace-nowrap text-right font-semibold ${tx.amount > 0 ? "text-green-600" : tx.amount < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-foreground">{tx.balanceAfter}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
