import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Info } from "lucide-react";
import { Logo } from "@/components/psicosst/logo";
import { PLANS, PURCHASABLE_SKUS, formatCOP } from "@/config/plans";

export const metadata: Metadata = {
    title: "Precios — PsicoSST",
    description: "Suscripción anual del psicólogo especialista en SST, con complementos por uso.",
};

/**
 * Tarifario público.
 *
 * Los precios y las características salen de `src/config/plans.ts`: esta
 * página no repite ninguna cifra, para que el catálogo comercial y lo que ve
 * el visitante no puedan divergir.
 */
export default function PricingPage() {
    const plans = [PLANS.RESIDENTE, PLANS.PROFESIONAL];
    const addons = PURCHASABLE_SKUS.filter((s) => s.kind !== "plan");

    return (
        <div className="min-h-screen bg-background">
            {/* ── Barra ──────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-6">
                    <Link href="/" aria-label="PsicoSST — inicio" className="flex items-center">
                        <Logo size={28} className="hidden sm:flex" />
                        <Logo size={28} iconOnly className="sm:hidden" />
                    </Link>
                    <nav className="flex items-center gap-1 sm:gap-1.5">
                        <Link
                            href="/"
                            className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-text-secondary transition-colors hover:text-foreground sm:px-3 sm:text-sm"
                        >
                            Inicio
                        </Link>
                        <Link
                            href="/login"
                            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-foreground sm:inline-flex"
                        >
                            Iniciar sesión
                        </Link>
                        <Link
                            href="/register"
                            className="press-feedback inline-flex h-9 items-center rounded-[10px] bg-primary px-3.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
                        >
                            Crear cuenta
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* ── Encabezado ─────────────────────────────── */}
                <section className="relative isolate overflow-hidden border-b border-border">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[360px]"
                        style={{
                            background:
                                "radial-gradient(60% 55% at 50% 0%, var(--color-teal-light) 0%, transparent 72%)",
                        }}
                    />
                    <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-6 sm:py-20">
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-teal-light px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-teal-dark">
                            Suscripción anual
                        </span>
                        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-5xl">
                            Precios
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-text-secondary sm:text-[16.5px]">
                            Se cobra por tu práctica, no por cuestionario aplicado. La unidad es el{" "}
                            <strong className="font-semibold text-foreground">trabajador gestionado</strong>{" "}
                            por instrumento y periodo: el intralaboral, el extralaboral y el estrés de la
                            misma persona dentro del periodo cuentan como uno.
                        </p>
                    </div>
                </section>

                {/* ── Planes ─────────────────────────────────── */}
                <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-16">
                    <div className="grid gap-5 md:grid-cols-2">
                        {plans.map((plan) => {
                            const destacado = plan.id === "PROFESIONAL";
                            return (
                                <article
                                    key={plan.id}
                                    className={`relative flex h-full flex-col rounded-2xl border bg-surface p-6 sm:p-8 ${
                                        destacado
                                            ? "border-primary shadow-md ring-1 ring-primary/30"
                                            : "border-border shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">
                                                {plan.name}
                                            </h2>
                                            <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">
                                                {plan.tagline}
                                            </p>
                                        </div>
                                        {destacado && (
                                            <span className="shrink-0 rounded-full bg-teal-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-dark">
                                                Recomendado
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-6 flex items-baseline gap-1.5">
                                        <span className="text-4xl font-bold tracking-[-0.025em] text-foreground">
                                            {plan.priceCOP === 0 ? "Gratis" : formatCOP(plan.priceCOP)}
                                        </span>
                                        {plan.priceCOP > 0 && (
                                            <span className="text-[13.5px] font-normal text-text-muted">/ año</span>
                                        )}
                                    </p>

                                    <div className="mt-7 h-px bg-border-muted" />

                                    <p className="mt-5 text-[11.5px] font-semibold uppercase tracking-[0.11em] text-text-muted">
                                        Incluye
                                    </p>
                                    <ul className="mt-3 space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-start gap-2.5 text-[14px] leading-relaxed text-text-secondary"
                                            >
                                                <Check
                                                    className="mt-[3px] h-4 w-4 shrink-0 text-primary"
                                                    aria-hidden="true"
                                                />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/register"
                                        className={`press-feedback mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] font-semibold transition-colors ${
                                            destacado
                                                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                                : "border border-border bg-surface text-foreground hover:bg-surface-muted"
                                        }`}
                                    >
                                        {destacado ? "Empezar" : "Probar gratis"}
                                        {destacado && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* ── Complementos ───────────────────────────── */}
                <section className="border-t border-border bg-surface-muted/60">
                    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-16">
                        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
                            Complementos
                        </h2>
                        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-text-secondary">
                            Se compran sobre el plan Profesional. El clima organizacional no es un instrumento
                            normativo y no tiene restricción legal de aplicación.
                        </p>

                        {/* Móvil: una ficha por complemento; una tabla de tres
                            columnas no cabe en 375 px sin desbordarse. */}
                        <ul className="mt-6 space-y-3 md:hidden">
                            {addons.map((sku) => (
                                <li
                                    key={sku.id}
                                    className="rounded-xl border border-border bg-surface p-4 shadow-sm"
                                >
                                    <p className="text-[14px] font-medium leading-snug text-foreground">
                                        {sku.name}
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                        <span className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                                            {formatCOP(sku.priceCOP)}
                                        </span>
                                        {sku.kind === "credits" && (
                                            <span className="text-[12.5px] text-text-muted">
                                                {formatCOP(sku.pricePerCredit)} por trabajador
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:block">
                            <table className="w-full text-[14px]">
                                <thead className="bg-surface-muted text-[11.5px] uppercase tracking-[0.1em] text-text-muted">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-semibold">Complemento</th>
                                        <th className="px-6 py-3.5 text-right font-semibold">Precio</th>
                                        <th className="px-6 py-3.5 text-right font-semibold">Por trabajador</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-muted">
                                    {addons.map((sku) => (
                                        <tr key={sku.id} className="transition-colors hover:bg-surface-muted/60">
                                            <td className="px-6 py-4 text-foreground">{sku.name}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                                                {formatCOP(sku.priceCOP)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-text-muted">
                                                {sku.kind === "credits" ? formatCOP(sku.pricePerCredit) : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 flex gap-3.5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
                            <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
                            <p className="text-[13.5px] leading-relaxed text-text-secondary">
                                <strong className="font-semibold text-foreground">
                                    Cancelación y retracto.
                                </strong>{" "}
                                Puedes cancelar cuando quieras; la cancelación surte efecto al terminar el
                                periodo pagado. Conforme al artículo 47 de la Ley 1480 de 2011 dispones de
                                cinco días hábiles de retracto sobre el cupo no consumido. Tras cancelar
                                conservas acceso de solo lectura a tus informes y evidencia, porque el
                                Decreto 1072 de 2015 obliga a custodiarlos.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Cierre ─────────────────────────────────── */}
                <section className="border-t border-border bg-primary">
                    <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-6 sm:py-16">
                        <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-primary-foreground sm:text-3xl">
                            ¿Dudas antes de suscribirte?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-primary-foreground/80">
                            El plan {PLANS.RESIDENTE.name} es gratuito y no pide tarjeta: crea la cuenta,
                            carga una batería ya calificada y revisa el informe que sale.
                        </p>
                        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                            <Link
                                href="/register"
                                className="press-feedback inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface px-6 text-[15px] font-semibold text-primary shadow-md transition-opacity hover:opacity-90 sm:w-auto"
                            >
                                Crear cuenta <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href="/"
                                className="press-feedback inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary-foreground/30 px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 sm:w-auto"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Pie ────────────────────────────────────────── */}
            <footer className="border-t border-border bg-background">
                <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <Logo size={28} />
                        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                            <Link
                                href="/"
                                className="text-text-secondary transition-colors hover:text-foreground"
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-text-secondary transition-colors hover:text-foreground"
                            >
                                Privacidad
                            </Link>
                            <Link
                                href="/terms"
                                className="text-text-secondary transition-colors hover:text-foreground"
                            >
                                Términos
                            </Link>
                            <Link
                                href="/login"
                                className="text-text-secondary transition-colors hover:text-foreground"
                            >
                                Iniciar sesión
                            </Link>
                        </nav>
                    </div>
                    <p className="mt-8 border-t border-border-muted pt-6 text-[12px] leading-relaxed text-text-muted">
                        PsicoSST © {new Date().getFullYear()} · Precios en pesos colombianos. Información
                        sujeta a reserva profesional, Ley 1090 de 2006.
                    </p>
                </div>
            </footer>
        </div>
    );
}
