import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Upload, Users } from "lucide-react";
import { PLANS } from "@/config/plans";
import { PricingTable } from "@/components/payments/pricing-table";

/**
 * Página pública del producto.
 *
 * El posicionamiento es deliberado: PsicoSST gestiona, califica y documenta
 * resultados de riesgo psicosocial para el psicólogo especialista en SST. No
 * se ofrece como herramienta de aplicación virtual de la Batería, que la
 * Res. 2764/2022 art. 4 reserva a la herramienta del Ministerio.
 */

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

export default function Landing() {
    const residente = PLANS.RESIDENTE;

    return (
        <main className="min-h-screen bg-background">
            {/* Barra */}
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <span className="text-[15px] font-bold tracking-tight text-foreground">PsicoSST</span>
                    <nav className="flex items-center gap-5 text-sm">
                        <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Precios</Link>
                        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Iniciar sesión</Link>
                        <Link href="/register" className="rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                            Crear cuenta
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Portada */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Para el psicólogo especialista en SST
                </p>
                <h1 className="mt-4 max-w-3xl text-[44px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">
                    Gestiona y califica el riesgo psicosocial de todas tus empresas
                </h1>
                <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
                    Importa los resultados, califícalos con los baremos del manual y produce los informes,
                    el plan de intervención y la evidencia que exige el SG-SST. Con tu marca y bajo tu custodia.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        Empezar gratis <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/pricing" className="inline-flex items-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        Ver precios
                    </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    {residente.annualQuota} trabajadores y una empresa gratis. Sin tarjeta.
                </p>
            </section>

            {/* Capacidades */}
            <section className="border-t border-border bg-muted/30">
                <div className="mx-auto max-w-6xl px-6 py-16">
                    <div className="grid gap-10 sm:grid-cols-2">
                        {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                            <div key={title} className="flex gap-4">
                                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <div>
                                    <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Planes */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Planes</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Empieza gratis con el plan Residente ({residente.annualQuota} trabajadores, {residente.orgLimit} empresa).
                    Cuando quieras firmar informes, pasa a uno de estos tres.
                </p>
                <div className="mt-8">
                    <PricingTable mode="register" />
                </div>
                <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                    La unidad de uso es el trabajador gestionado por instrumento y periodo: los demás
                    cuestionarios del mismo trabajador dentro del periodo no consumen cupo. Hay
                    complementos de trabajadores adicionales, clima organizacional y módulos.{" "}
                    <Link href="/pricing" className="underline hover:text-foreground">Ver el detalle</Link>.
                </p>
            </section>

            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground">
                    <span>PsicoSST © {new Date().getFullYear()} · Información sujeta a reserva profesional, Ley 1090 de 2006</span>
                    <nav className="flex gap-4">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                    </nav>
                </div>
            </footer>
        </main>
    );
}
