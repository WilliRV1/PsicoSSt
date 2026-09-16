import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, PURCHASABLE_SKUS, formatCOP } from "@/config/plans";
import { PricingTable } from "@/components/payments/pricing-table";

export const metadata: Metadata = {
    title: "Precios — PsicoSST",
    description: "Suscripción del psicólogo especialista en SST, anual o mensual, con complementos por uso.",
};

export default function PricingPage() {
    const residente = PLANS.RESIDENTE;
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

                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Empieza gratis con el plan <strong className="text-foreground">Residente</strong>:
                    {" "}{residente.annualQuota} trabajadores, {residente.orgLimit} empresa, {30} días — informes
                    en borrador, sin marca de firma. <Link href="/register" className="underline hover:text-foreground">Crear cuenta</Link>.
                </div>

                <div className="mt-10">
                    <PricingTable mode="register" />
                </div>

                <h2 className="mt-16 text-2xl font-semibold tracking-tight text-foreground">Complementos</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Se compran sobre cualquiera de los tres planes pagados. Clima organizacional requiere
                    Profesional o Avanzado; no es un instrumento normativo y no tiene restricción legal de
                    aplicación.
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
