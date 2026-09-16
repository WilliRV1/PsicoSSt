"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins, Check, ArrowDown, ArrowUp, Gift, AlertTriangle, Clock } from "lucide-react";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    priceCOP: number;
    pricePerCredit: number;
    discount: number;
    popular?: boolean;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    packageId?: string;
    priceCOP?: number;
    description?: string;
    createdAt: string;
}

const PACKAGES: CreditPackage[] = [
    { id: "starter", name: "Starter", credits: 20, priceCOP: 60000, pricePerCredit: 3000, discount: 0 },
    { id: "profesional", name: "Profesional", credits: 50, priceCOP: 125000, pricePerCredit: 2500, discount: 17 },
    { id: "business", name: "Business", credits: 100, priceCOP: 200000, pricePerCredit: 2000, discount: 33, popular: true },
    { id: "enterprise", name: "Enterprise", credits: 500, priceCOP: 750000, pricePerCredit: 1500, discount: 50 },
    { id: "corporativo", name: "Corporativo", credits: 1000, priceCOP: 1200000, pricePerCredit: 1200, discount: 60 },
];

function formatCOP(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

const txTypeConfig: Record<string, { label: string; icon: "up" | "down" | "gift"; color: string }> = {
    PURCHASE: { label: "Compra", icon: "up", color: "text-teal-dark" },
    TRIAL_GRANT: { label: "Trial", icon: "gift", color: "text-primary" },
    ADMIN_GRANT: { label: "Asignacion", icon: "gift", color: "text-info" },
    CONSUMPTION: { label: "Consumo", icon: "down", color: "text-danger" },
    REFUND: { label: "Reembolso", icon: "up", color: "text-teal-dark" },
};

export default function CreditsPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const refreshData = useCallback(() => {
        fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance)).catch(() => {});
        fetch("/api/credits/transactions").then((r) => r.json()).then((d) => setTransactions(d.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const txIcon = (type: string) => {
        const config = txTypeConfig[type];
        if (!config) return null;
        if (config.icon === "up") return <ArrowUp className={`h-4 w-4 ${config.color}`} />;
        if (config.icon === "down") return <ArrowDown className={`h-4 w-4 ${config.color}`} />;
        return <Gift className={`h-4 w-4 ${config.color}`} />;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header + balance */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Creditos</h2>
                    <p className="text-sm text-muted-foreground">1 credito = 1 bateria completa (intralaboral + extralaboral + estres + PDF + IA)</p>
                </div>
                <div
                    className="rounded-xl border-2 px-6 py-4 text-center"
                    style={
                        balance !== null && balance <= 0
                            ? { borderColor: "var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)" }
                            : balance !== null && balance <= 5
                            ? { borderColor: "var(--color-risk-medium-border)", background: "var(--color-risk-medium-bg)" }
                            : { borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)", background: "color-mix(in srgb, var(--color-primary) 5%, transparent)" }
                    }
                >
                    <div className="flex items-center gap-2 justify-center">
                        <Coins className="h-6 w-6" style={{ color: balance !== null && balance <= 0 ? "var(--color-risk-veryhigh-solid)" : "var(--color-primary)" }} />
                        <span className="text-3xl font-bold text-foreground">{balance ?? "—"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">creditos disponibles</p>
                </div>
            </div>

            {/* Low balance warning */}
            {balance !== null && balance <= 2 && (
                <div
                    className="rounded-xl border px-5 py-3.5 flex items-start gap-3"
                    style={balance <= 0
                        ? { borderColor: "var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)" }
                        : { borderColor: "var(--color-risk-medium-border)", background: "var(--color-risk-medium-bg)" }}
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: balance <= 0 ? "var(--color-risk-veryhigh-solid)" : "var(--color-risk-medium-solid)" }} />
                    <div>
                        <p className="font-semibold text-sm" style={{ color: balance <= 0 ? "var(--color-risk-veryhigh-text)" : "var(--color-risk-medium-text)" }}>
                            {balance <= 0 ? "Sin creditos" : `Solo te quedan ${balance} credito${balance > 1 ? "s" : ""}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: balance <= 0 ? "var(--color-risk-veryhigh-text)" : "var(--color-risk-medium-text)" }}>
                            {balance <= 0
                                ? "No podras crear nuevas evaluaciones hasta que adquieras un paquete."
                                : "Adquiere mas creditos para no interrumpir tu flujo de trabajo."}
                        </p>
                    </div>
                </div>
            )}

            {/* Message */}
            {message && (
                <div
                    className="rounded-xl border px-5 py-3 text-sm font-medium"
                    style={message.type === "success"
                        ? { borderColor: "var(--color-risk-low-border)", background: "var(--color-risk-low-bg)", color: "var(--color-risk-low-text)" }
                        : { borderColor: "var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }}
                >
                    {message.text}
                </div>
            )}

            {/* Packages */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">Paquetes de creditos</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative rounded-xl border-2 bg-card p-5 shadow-sm transition-all hover:shadow-md ${
                                pkg.popular
                                    ? "border-primary ring-1 ring-primary"
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                                    Popular
                                </div>
                            )}
                            <div className="text-center mb-4">
                                <h4 className="font-semibold text-foreground text-lg">{pkg.name}</h4>
                                <div className="mt-2">
                                    <span className="text-2xl font-bold text-foreground">{formatCOP(pkg.priceCOP)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatCOP(pkg.pricePerCredit)} / credito
                                </p>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-teal-dark shrink-0" />
                                    <span className="text-foreground font-medium">{pkg.credits} baterias</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-teal-dark shrink-0" />
                                    <span className="text-muted-foreground">PDF incluido</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-teal-dark shrink-0" />
                                    <span className="text-muted-foreground">Analisis IA incluido</span>
                                </div>
                                {pkg.discount > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-teal-dark shrink-0" />
                                        <span className="text-teal-dark font-medium">{pkg.discount}% de ahorro</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-teal-dark shrink-0" />
                                    <span className="text-muted-foreground">Sin vencimiento</span>
                                </div>
                            </div>

                            <div className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Pagos próximamente</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction history */}
            <div>
                <h3 className="font-semibold text-foreground mb-4">Historial de transacciones</h3>
                {transactions.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
                        <Coins className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No hay transacciones aun.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripcion</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Creditos</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.map((tx) => {
                                        const config = txTypeConfig[tx.type] || { label: tx.type, icon: "up" as const, color: "text-text-secondary" };
                                        return (
                                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleDateString("es-CO", {
                                                        year: "numeric", month: "short", day: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {txIcon(tx.type)}
                                                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {tx.description || "—"}
                                                    {tx.priceCOP && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({formatCOP(tx.priceCOP)})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-5 py-3 whitespace-nowrap text-right font-semibold ${
                                                    tx.amount > 0 ? "text-teal-dark" : "text-danger"
                                                }`}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-foreground">
                                                    {tx.balanceAfter}
                                                </td>
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
