import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, PURCHASABLE_SKUS, formatCOP } from "@/config/plans";

export const metadata: Metadata = {
    title: "Precios — PsicoSST",
    description: "Suscripción anual del psicólogo especialista en SST, con complementos por uso.",
};

export default function PricingPage() {
    const plans = [PLANS.RESIDENTE, PLANS.PROFESIONAL];
    const addons = PURCHASABLE_SKUS.filter((s) => s.kind !== "plan");

    return (
        <main className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-[15px] font-bold tracking-tight text-foreground">PsicoSST</Link>
                    <nav className="flex items-center gap-5 text-sm">
                        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Iniciar sesión</Link>
                        <Link href="/register" className="rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                            Crear cuenta
                        </Link>
                    </nav>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <h1 className="text-[36px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Precios</h1>
                <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
                    Se cobra por tu práctica, no por cuestionario aplicado. La unidad es el{" "}
                    <strong className="text-foreground">trabajador gestionado</strong> por instrumento y periodo:
                    el intralaboral, el extralaboral y el estrés de la misma persona dentro del periodo
                    cuentan como uno.
                </p>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`rounded-2xl border p-7 ${plan.id === "PROFESIONAL" ? "border-primary ring-1 ring-primary bg-card" : "border-border bg-card"}`}
                        >
                            <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                            <p className="mt-5 text-3xl font-bold text-foreground">
                                {plan.priceCOP === 0 ? "Gratis" : formatCOP(plan.priceCOP)}
                                {plan.priceCOP > 0 && <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ año</span>}
                            </p>
                            <ul className="mt-6 space-y-2.5">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/register"
                                className={`mt-7 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                    plan.id === "PROFESIONAL"
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "border border-border text-foreground hover:bg-muted"
                                }`}
                            >
                                {plan.id === "PROFESIONAL" ? "Empezar" : "Probar gratis"}
                            </Link>
                        </div>
                    ))}
                </div>

                <h2 className="mt-16 text-2xl font-semibold tracking-tight text-foreground">Complementos</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Se compran sobre el plan Profesional. El clima organizacional no es un instrumento
                    normativo y no tiene restricción legal de aplicación.
                </p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-5 py-3 text-left font-semibold">Complemento</th>
                                <th className="px-5 py-3 text-right font-semibold">Precio</th>
                                <th className="px-5 py-3 text-right font-semibold">Por trabajador</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {addons.map((sku) => (
                                <tr key={sku.id}>
                                    <td className="px-5 py-3 text-foreground">{sku.name}</td>
                                    <td className="px-5 py-3 text-right font-medium text-foreground">{formatCOP(sku.priceCOP)}</td>
                                    <td className="px-5 py-3 text-right text-muted-foreground">
                                        {sku.kind === "credits" ? formatCOP(sku.pricePerCredit) : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground">
                    <p>
                        <strong className="text-foreground">Cancelación y retracto.</strong> Puedes cancelar cuando
                        quieras; la cancelación surte efecto al terminar el periodo pagado. Conforme al artículo 47
                        de la Ley 1480 de 2011 dispones de cinco días hábiles de retracto sobre el cupo no
                        consumido. Tras cancelar conservas acceso de solo lectura a tus informes y evidencia,
                        porque el Decreto 1072 de 2015 obliga a custodiarlos.
                    </p>
                </div>
            </section>

            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground">
                    <span>PsicoSST © {new Date().getFullYear()}</span>
                    <nav className="flex gap-4">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                    </nav>
                </div>
            </footer>
        </main>
    );
}
