"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
    Archive,
    ArrowRight,
    FileText,
    Scale,
    ShieldCheck,
    Upload,
    Users,
} from "lucide-react";
import { Logo } from "@/components/psicosst/logo";
import { PLANS, TRIAL_DAYS } from "@/config/plans";
import { PricingTable } from "@/components/payments/pricing-table";

/**
 * Página pública del producto.
 *
 * El posicionamiento es deliberado: PsicoSST gestiona, califica y documenta
 * resultados de riesgo psicosocial para el psicólogo especialista en SST. No
 * se ofrece como herramienta de aplicación virtual de la Batería, que la
 * Res. 2764/2022 art. 4 reserva a la herramienta del Ministerio.
 *
 * Es la única pantalla del producto donde se admite algo más de movimiento
 * que en el panel: es la puerta de entrada. Aun así se queda dentro de la
 * convención del sistema —curva de salida fuerte, 300 ms de techo, sólo
 * opacidad y desplazamiento— y se desactiva por completo con
 * `prefers-reduced-motion`.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const CAPABILITIES = [
    {
        icon: Upload,
        title: "Importa resultados calificados",
        body: "Trae los puntajes de SIRPSI o de otra herramienta con una plantilla por instrumento. Los niveles de riesgo se derivan con los baremos del manual, no se copian del archivo.",
    },
    {
        icon: FileText,
        title: "Informes que resisten una inspección",
        body: "Informe individual y colectivo, plan de intervención y vigilancia epidemiológica, con la marca de tu consultorio y la procedencia de cada resultado documentada.",
    },
    {
        icon: Users,
        title: "Todas tus empresas en un lugar",
        body: "Vigencias por nivel de riesgo según el artículo 3 de la Resolución 2764, alertas de vencimiento y tablero de cumplimiento por empresa.",
    },
    {
        icon: ShieldCheck,
        title: "Custodia con reserva profesional",
        body: "El resultado individual solo lo ve el psicólogo tratante. Los agregados aplican un piso de anonimato, y la evidencia se conserva conforme al Decreto 1072.",
    },
];

const NORMAS = [
    { icon: ShieldCheck, label: "Resolución 2764 de 2022" },
    { icon: Scale, label: "Reserva profesional · Ley 1090" },
    { icon: Archive, label: "Custodia 20 años · Decreto 1072" },
];

/** Entrada de portada: se dispara al montar. */
function Rise({
    delay = 0,
    className,
    children,
}: {
    delay?: number;
    className?: string;
    children: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT, delay }}
        >
            {children}
        </motion.div>
    );
}

/** Aparición al entrar en pantalla, una sola vez. */
function Reveal({
    delay = 0,
    className,
    children,
}: {
    delay?: number;
    className?: string;
    children: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.3, ease: EASE_OUT, delay }}
        >
            {children}
        </motion.div>
    );
}

export default function Landing() {
    const residente = PLANS.RESIDENTE;

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
                            href="/pricing"
                            className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-text-secondary transition-colors hover:text-foreground sm:px-3 sm:text-sm"
                        >
                            Precios
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
                {/* ── Portada ────────────────────────────────── */}
                <section className="relative isolate overflow-hidden">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[460px]"
                        style={{
                            background:
                                "radial-gradient(62% 58% at 50% 0%, var(--color-teal-light) 0%, transparent 72%)",
                        }}
                    />
                    <div className="mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20 lg:pt-28">
                        <Rise>
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-teal-light px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-teal-dark">
                                Para el psicólogo especialista en SST
                            </span>
                        </Rise>

                        <Rise delay={0.06}>
                            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-5xl sm:leading-[1.06] lg:text-6xl">
                                Gestiona y califica el riesgo psicosocial de todas tus empresas
                            </h1>
                        </Rise>

                        <Rise delay={0.12}>
                            <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-text-secondary sm:text-[17px]">
                                Importa los resultados, califícalos con los baremos del manual y produce los
                                informes, el plan de intervención y la evidencia que exige el SG-SST. Con tu
                                marca y bajo tu custodia.
                            </p>
                        </Rise>

                        <Rise delay={0.18}>
                            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                                <Link
                                    href="/register"
                                    className="press-feedback inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 sm:w-auto"
                                >
                                    Empezar gratis <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="press-feedback inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-surface-muted sm:w-auto"
                                >
                                    Ver precios
                                </Link>
                            </div>
                            <p className="mt-4 text-[12.5px] text-text-muted">
                                {residente.annualQuota} trabajadores y una empresa durante {TRIAL_DAYS} días.
                                Sin tarjeta.
                            </p>
                        </Rise>

                        <Rise delay={0.24}>
                            <ul className="mt-10 flex flex-col items-center gap-3 border-t border-border-muted pt-8 text-[12.5px] text-text-muted sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-2">
                                {NORMAS.map(({ icon: Icon, label }) => (
                                    <li key={label} className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </Rise>
                    </div>
                </section>

                {/* ── Capacidades ────────────────────────────── */}
                <section className="border-y border-border bg-surface-muted/60">
                    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
                        <Reveal className="max-w-2xl">
                            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
                                Lo que hace por tu práctica
                            </h2>
                            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                                Cuatro piezas que hoy resuelves con hojas de cálculo, plantillas sueltas y
                                carpetas compartidas.
                            </p>
                        </Reveal>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
                            {CAPABILITIES.map(({ icon: Icon, title, body }, i) => (
                                <Reveal key={title} delay={i * 0.05} className="h-full">
                                    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal-dark">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-foreground">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                                            {body}
                                        </p>
                                    </article>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Planes ─────────────────────────────────── */}
                <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20">
                    <Reveal className="max-w-2xl">
                        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
                            Planes
                        </h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                            Empieza gratis con el plan Residente ({residente.annualQuota} trabajadores,{" "}
                            {residente.orgLimit} empresa). Cuando quieras firmar informes, pasa a uno de estos tres.
                        </p>
                    </Reveal>

                    <Reveal delay={0.06} className="mt-10">
                        <PricingTable mode="register" />
                    </Reveal>

                    <Reveal>
                        <p className="mt-8 text-[12.5px] leading-relaxed text-text-muted">
                            La unidad de uso es el trabajador gestionado por instrumento y periodo: los demás
                            cuestionarios del mismo trabajador dentro del periodo no consumen cupo. Hay
                            complementos de trabajadores adicionales, clima organizacional y módulos.{" "}
                            <Link
                                href="/pricing"
                                className="font-medium text-teal-dark underline underline-offset-2 transition-colors hover:text-primary"
                            >
                                Ver el detalle
                            </Link>
                            .
                        </p>
                    </Reveal>
                </section>

                {/* ── Cierre ─────────────────────────────────── */}
                <section className="border-t border-border bg-primary">
                    <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-6 sm:py-20">
                        <Reveal>
                            <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-primary-foreground sm:text-4xl">
                                Pruébalo con {residente.annualQuota} trabajadores durante {TRIAL_DAYS} días
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-primary-foreground/80">
                                Crea tu cuenta, carga una batería ya calificada y mira el informe que sale.
                                Si no te sirve, no has pagado nada.
                            </p>
                            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                                <Link
                                    href="/register"
                                    className="press-feedback inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface px-6 text-[15px] font-semibold text-primary shadow-md transition-opacity hover:opacity-90 sm:w-auto"
                                >
                                    Crear cuenta <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="press-feedback inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary-foreground/30 px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 sm:w-auto"
                                >
                                    Ya tengo cuenta
                                </Link>
                            </div>
                        </Reveal>
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
                                href="/pricing"
                                className="text-text-secondary transition-colors hover:text-foreground"
                            >
                                Precios
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
                        PsicoSST © {new Date().getFullYear()} · Información sujeta a reserva profesional,
                        Ley 1090 de 2006. PsicoSST no aplica la Batería en línea: gestiona, califica y
                        documenta sus resultados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
