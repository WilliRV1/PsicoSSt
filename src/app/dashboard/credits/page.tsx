"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins, Check, ArrowDown, ArrowUp, Gift, AlertTriangle } from "lucide-react";
import { WompiCheckout } from "@/components/psicosst/wompi-checkout";

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
    PURCHASE: { label: "Compra", icon: "up", color: "text-green-600" },
    TRIAL_GRANT: { label: "Trial", icon: "gift", color: "text-indigo-600" },
    ADMIN_GRANT: { label: "Asignacion", icon: "gift", color: "text-blue-600" },
    CONSUMPTION: { label: "Consumo", icon: "down", color: "text-red-600" },
    REFUND: { label: "Reembolso", icon: "up", color: "text-emerald-600" },
};

export default function CreditsPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const refreshData = useCallback(() => {
        fetch("/api/credits").then((r) => r.json()).then((d) => setBalance(d.balance)).catch(() => {});
        fetch("/api/credits/transactions").then((r) => r.json()).then((d) => setTransactions(d.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleSuccess = useCallback(() => {
        setPurchasing(null);
        setMessage({ type: "success", text: "Pago procesado exitosamente. Tus creditos han sido agregados." });
        refreshData();
    }, [refreshData]);

    const handleError = useCallback((errorMessage: string) => {
        setPurchasing(null);
        setMessage({ type: "error", text: errorMessage });
    }, []);

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
                <div className={`rounded-xl border-2 px-6 py-4 text-center ${
                    balance !== null && balance <= 0
                        ? "border-red-300 bg-red-50"
                        : balance !== null && balance <= 5
                        ? "border-amber-300 bg-amber-50"
                        : "border-primary/30 bg-primary/5"
                }`}>
                    <div className="flex items-center gap-2 justify-center">
                        <Coins className={`h-6 w-6 ${
                            balance !== null && balance <= 0 ? "text-red-500" : "text-primary"
                        }`} />
                        <span className="text-3xl font-bold text-foreground">{balance ?? "—"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">creditos disponibles</p>
                </div>
            </div>

            {/* Low balance warning */}
            {balance !== null && balance <= 2 && (
                <div className={`rounded-xl border px-5 py-3.5 flex items-start gap-3 ${
                    balance <= 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                }`}>
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${balance <= 0 ? "text-red-500" : "text-amber-500"}`} />
                    <div>
                        <p className={`font-semibold text-sm ${balance <= 0 ? "text-red-800" : "text-amber-800"}`}>
                            {balance <= 0 ? "Sin creditos" : `Solo te quedan ${balance} credito${balance > 1 ? "s" : ""}`}
                        </p>
                        <p className={`text-xs mt-0.5 ${balance <= 0 ? "text-red-700" : "text-amber-700"}`}>
                            {balance <= 0
                                ? "No podras crear nuevas evaluaciones hasta que adquieras un paquete."
                                : "Adquiere mas creditos para no interrumpir tu flujo de trabajo."}
                        </p>
                    </div>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`rounded-xl border px-5 py-3 text-sm font-medium ${
                    message.type === "success"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-red-200 bg-red-50 text-red-800"
                }`}>
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
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    <span className="text-foreground font-medium">{pkg.credits} baterias</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    <span className="text-muted-foreground">PDF incluido</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    <span className="text-muted-foreground">Analisis IA incluido</span>
                                </div>
                                {pkg.discount > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                                        <span className="text-green-700 font-medium">{pkg.discount}% de ahorro</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    <span className="text-muted-foreground">Sin vencimiento</span>
                                </div>
                            </div>

                            <WompiCheckout
                                packageId={pkg.id}
                                popular={pkg.popular}
                                disabled={purchasing !== null && purchasing !== pkg.id}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
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
                                        const config = txTypeConfig[tx.type] || { label: tx.type, icon: "up", color: "text-gray-600" };
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
                                                    tx.amount > 0 ? "text-green-600" : "text-red-600"
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
