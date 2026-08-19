import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SVEPrintButton } from "./print-button";
import { buildSVEData, RISK_ORDER } from "@/lib/reports/sve-data";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin riesgo", BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", MUY_ALTO: "Muy alto",
};

const RISK_BAR: Record<string, string> = {
    SIN_RIESGO: "bg-emerald-600",
    BAJO: "bg-lime-600",
    MEDIO: "bg-amber-500",
    ALTO: "bg-orange-600",
    MUY_ALTO: "bg-red-700",
};

export default async function SVEReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const built = await buildSVEData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-foreground mb-2">Programa SVE — Riesgo Psicosocial</h1>
                <p className="text-muted-foreground">
                    No hay evaluaciones completadas para generar el SVE, o no tienes acceso a esta organización.
                </p>
                <Link href={`/dashboard/organizations/${orgId}`} className="inline-block mt-8 text-blue-600 font-semibold hover:underline">
                    ← Volver a la organización
                </Link>
            </div>
        );
    }

    const { data } = built;
    const { org, summary, groups, distributions, criticalDimensions, areas } = data;

    const groupCards = [
        { label: "Grupo A", name: "Sanos", n: groups.a, cls: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300" },
        { label: "Grupo B", name: "Vulnerables", n: groups.b, cls: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300" },
        { label: "Grupo C", name: "Adaptados", n: groups.c, cls: "border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:border-orange-900 dark:text-orange-300" },
        { label: "Grupo D", name: "Prioridad de intervención", n: groups.d, cls: "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            <div>
                <Link href={`/dashboard/organizations/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                    ← Volver a la organización
                </Link>
                <h1 className="text-2xl font-bold text-foreground mt-3">Programa de Vigilancia Epidemiológica</h1>
                <p className="text-muted-foreground">
                    {org.name} · NIT {org.nit} · Resolución 2764 de 2022
                </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between gap-6 flex-wrap">
                <div>
                    <h2 className="font-bold text-foreground">Documento listo para generar</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        16 capítulos · {summary.uniqueWorkers} trabajadores · {summary.totalAssessments} evaluaciones ·
                        período {org.dateStart} — {org.dateEnd}.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Incluye perfil demográfico, resultados por dominio y dimensión, matriz de grupos y plan de intervención.
                        {org.logoPath ? " Con logo." : ""}{org.signaturePath ? " Con firma." : ""}
                    </p>
                </div>
                <SVEPrintButton orgId={orgId} />
            </div>

            {summary.needsSVE && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg text-red-900 dark:bg-red-950/40 dark:text-red-200">
                    <p className="text-sm">
                        <strong>SVE obligatorio:</strong> el {summary.criticalPercent}% de las evaluaciones está en riesgo
                        Alto o Muy Alto, superando el umbral del 20% de la Resolución 2764 de 2022.
                    </p>
                </div>
            )}

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grupos de intervención</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {groupCards.map(g => (
                        <div key={g.label} className={`p-4 rounded-xl border ${g.cls}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest">{g.label}</p>
                            <p className="text-sm font-bold text-foreground">{g.name}</p>
                            <p className="text-3xl font-black mt-1">{g.n}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Perfil general de riesgo</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Intralaboral", dist: distributions.intra, n: summary.intraA + summary.intraB },
                        { title: "Extralaboral", dist: distributions.extra, n: summary.extra },
                        { title: "Estrés", dist: distributions.stress, n: summary.stress },
                    ].map(({ title, dist, n }) => (
                        <div key={title} className="p-4 bg-card border border-border rounded-xl">
                            <p className="text-xs font-bold text-foreground mb-3">
                                {title} <span className="text-muted-foreground font-normal">N={n}</span>
                            </p>
                            {RISK_ORDER.map(k => (
                                <div key={k} className="mb-2">
                                    <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                                        <span>{RISK_LABELS[k]}</span>
                                        <span className="font-mono">{dist[k]}%</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${RISK_BAR[k]}`} style={{ width: `${dist[k]}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {criticalDimensions.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Dimensiones en riesgo crítico</h2>
                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-bold">Dimensión</th>
                                    <th className="text-left px-4 py-2.5 font-bold">Cuestionario</th>
                                    <th className="text-center px-4 py-2.5 font-bold">% Crítico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {criticalDimensions.slice(0, 8).map(d => (
                                    <tr key={`${d.name}-${d.questionnaire}`}>
                                        <td className="px-4 py-2.5 font-medium text-foreground">{d.name}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{d.questionnaire}</td>
                                        <td className={`px-4 py-2.5 text-center font-bold ${
                                            d.criticalPercent >= 40 ? "text-red-700"
                                            : d.criticalPercent >= 20 ? "text-orange-600"
                                            : "text-muted-foreground"
                                        }`}>
                                            {d.criticalPercent}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {areas.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Áreas evaluadas</h2>
                    <div className="flex flex-wrap gap-2">
                        {areas.map(a => (
                            <span key={a.name} className="px-3 py-1.5 bg-muted rounded-lg text-xs text-foreground">
                                {a.name} <span className="text-muted-foreground">· {a.count}</span>
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
                <SVEPrintButton orgId={orgId} />
            </div>
        </div>
    );
}
