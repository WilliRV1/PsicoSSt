import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildSociodemographicData } from "@/lib/reports/sociodemographic-data";
import { DownloadReportButton } from "@/components/reports/download-report-button";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

export default async function SociodemographicReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const built = await buildSociodemographicData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-foreground mb-2">Perfil sociodemográfico</h1>
                <p className="text-muted-foreground">
                    No hay trabajadores con evaluaciones calificadas en esta organización, o no
                    tienes acceso a ella.
                </p>
                <Link
                    href={`/dashboard/organizations/${orgId}`}
                    className="inline-block mt-8 text-blue-600 font-semibold hover:underline"
                >
                    ← Volver a la organización
                </Link>
            </div>
        );
    }

    const { org, coverage, personal, occupational } = built.data;
    const blocks = [...personal, ...occupational];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
            <div>
                <Link
                    href={`/dashboard/organizations/${orgId}`}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                    ← Volver a la organización
                </Link>
                <h1 className="text-2xl font-bold text-foreground mt-3">Perfil sociodemográfico</h1>
                <p className="text-muted-foreground">
                    {org.name} · NIT {org.nit} · {org.dateStart} — {org.dateEnd}
                </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between gap-6 flex-wrap">
                <div>
                    <h2 className="font-bold text-foreground">Documento listo para generar</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {blocks.length} variables · {coverage.evaluated} trabajadores evaluados ·{" "}
                        {coverage.assessments} evaluaciones aplicadas.
                    </p>
                    {coverage.registered > coverage.evaluated && (
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            Cobertura parcial: {coverage.evaluated} de {coverage.registered}{" "}
                            trabajadores registrados.
                        </p>
                    )}
                </div>
                <DownloadReportButton
                    href={`/api/organizations/${orgId}/reports/sociodemographic/pdf`}
                    fallbackName="Perfil_sociodemografico.pdf"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {blocks.map(b => (
                    <section key={b.title} className="p-5 bg-card border border-border rounded-xl">
                        <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                        <div className="mt-3 space-y-1.5">
                            {b.rows.map(r => (
                                <div key={r.label} className="flex items-center gap-3 text-xs">
                                    <span className="flex-1 text-foreground truncate" title={r.label}>
                                        {r.label}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {r.count}
                                    </span>
                                    <span className="w-12 text-right font-semibold text-foreground tabular-nums">
                                        {r.pct}%
                                    </span>
                                    <span className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <span
                                            className="block h-full bg-foreground/40 rounded-full"
                                            style={{ width: `${r.pct}%` }}
                                        />
                                    </span>
                                </div>
                            ))}
                        </div>
                        {b.missing > 0 && (
                            <p className="mt-3 text-[11px] text-muted-foreground">
                                Sin dato registrado: {b.missing}.
                            </p>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}
