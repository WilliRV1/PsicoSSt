import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildSociodemographicData } from "@/lib/reports/sociodemographic-data";
import { DownloadReportButton } from "@/components/reports/download-report-button";
import {
    Label,
    Micro,
    NoteBlock,
    PAPER,
    Paper,
    SectionTitle,
    StatCard,
    numStyle,
    rc,
} from "@/components/reports/paper";
import type { ProfileBlock } from "@/lib/reports/sociodemographic-data";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

const serif = "var(--font-report-serif), Georgia, serif";

/**
 * Una variable, con su tabla de frecuencias. La barra se escala contra la
 * categoría mayoritaria y no contra 100: con doce categorías, medirlas contra
 * 100 dejaría todas las barras igual de cortas y no distinguirían nada.
 */
function Profile({ b }: { b: ProfileBlock }) {
    const peak = Math.max(1, ...b.rows.map(r => r.pct));
    return (
        <div style={{ breakInside: "avoid", marginBottom: 26 }}>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600 }}>{b.title}</div>
            {b.note && (
                <Micro size={11} color={PAPER.ink3} style={{ marginTop: 3 }}>
                    {b.note}
                </Micro>
            )}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: 9,
                    fontFamily: "var(--font-report-sans), sans-serif",
                    fontSize: 12.5,
                }}
            >
                <tbody>
                    {b.rows.map((r, i) => (
                        <tr
                            key={r.label}
                            style={{
                                borderTop: i === 0 ? `1.3px solid ${PAPER.ink}` : `1px solid ${PAPER.rule}`,
                            }}
                        >
                            <td style={{ padding: "6px 8px 6px 0", color: PAPER.ink }}>{r.label}</td>
                            <td
                                style={{
                                    ...numStyle,
                                    padding: "6px 8px",
                                    textAlign: "right",
                                    color: PAPER.ink2,
                                    width: 48,
                                }}
                            >
                                {r.count}
                            </td>
                            <td
                                style={{
                                    ...numStyle,
                                    padding: "6px 8px",
                                    textAlign: "right",
                                    fontWeight: 600,
                                    width: 62,
                                }}
                            >
                                {r.pct}%
                            </td>
                            <td style={{ padding: "6px 0 6px 8px", width: "38%" }}>
                                <div style={{ height: 6, background: PAPER.paper }}>
                                    <div
                                        style={{
                                            height: 6,
                                            width: `${(r.pct / peak) * 100}%`,
                                            background: "rgba(22,21,15,0.42)",
                                        }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {b.missing > 0 && (
                <Micro size={10.5} color={PAPER.ink3} style={{ marginTop: 7 }}>
                    Sin dato registrado: {b.missing}{" "}
                    {b.missing === 1 ? "trabajador" : "trabajadores"}. Los porcentajes se calculan
                    sobre quienes sí tienen el dato.
                </Micro>
            )}
        </div>
    );
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

    const { org, coverage, personal, occupational, professional } = built.data;
    const href = `/api/organizations/${orgId}/reports/sociodemographic/pdf`;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
                <div>
                    <Link
                        href={`/dashboard/organizations/${orgId}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                        ← Volver a la organización
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground mt-3">
                        Perfil sociodemográfico
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Vista previa del documento · {org.name}
                    </p>
                </div>
                <DownloadReportButton href={href} fallbackName="Perfil_sociodemografico.pdf" />
            </div>

            <Paper>
                <Label>
                    Evaluación de factores de riesgo psicosocial · Resolución 2764 de 2022
                </Label>
                <h2
                    style={{
                        fontFamily: serif,
                        fontSize: 38,
                        fontWeight: 600,
                        lineHeight: 1.12,
                        margin: "18px 0 8px",
                    }}
                >
                    Perfil sociodemográfico
                </h2>
                <p style={{ color: PAPER.ink2, fontSize: 16, margin: 0 }}>
                    Caracterización de la población evaluada
                </p>

                <div style={{ height: 1.6, background: PAPER.ink, margin: "28px 0 22px" }} />

                <Label>Organización</Label>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, marginTop: 5 }}>
                    {org.name}
                </div>
                <Micro style={{ marginTop: 3 }}>
                    NIT {org.nit}
                    {org.city ? ` · ${org.city}` : ""}
                    {org.economicSector ? ` · ${org.economicSector}` : ""}
                </Micro>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mt-8">
                    {[
                        ["Periodo", `${org.dateStart} — ${org.dateEnd}`],
                        ["Fecha del informe", org.today],
                        ["Profesional responsable", professional.name],
                    ].map(([lbl, val]) => (
                        <div key={lbl}>
                            <Label style={{ fontSize: 9 }}>{lbl}</Label>
                            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{val}</div>
                        </div>
                    ))}
                </div>

                <SectionTitle n={1}>Alcance</SectionTitle>
                <p style={{ marginTop: 0 }}>
                    Este documento caracteriza a la población a la que se aplicó la Batería. El
                    perfil sociodemográfico es lo que permite interpretar los resultados de riesgo:
                    una misma condición de trabajo no significa lo mismo en una población joven con
                    contrato temporal que en una con quince años de antigüedad.
                </p>

                <div className="grid grid-cols-3 gap-3 mt-5">
                    <StatCard value={coverage.evaluated} label="Trabajadores evaluados" />
                    <StatCard value={coverage.assessments} label="Evaluaciones aplicadas" />
                    <StatCard
                        value={coverage.registered}
                        label="Trabajadores registrados"
                        accent={coverage.registered > coverage.evaluated ? rc("MEDIO") : PAPER.ink}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    {coverage.registered > coverage.evaluated ? (
                        <NoteBlock accent={rc("MEDIO")}>
                            <strong>Cobertura parcial.</strong> La organización tiene{" "}
                            {coverage.registered} trabajadores registrados y se evaluó a{" "}
                            {coverage.evaluated}. Este perfil describe únicamente a la población
                            evaluada, que es la que produjo los resultados de riesgo; no debe leerse
                            como la composición de la planta completa.
                        </NoteBlock>
                    ) : (
                        <NoteBlock>
                            Se evaluó a la totalidad de los trabajadores registrados en la
                            organización.
                        </NoteBlock>
                    )}
                </div>

                <Micro style={{ marginTop: 14 }}>
                    A cada trabajador se le aplican hasta tres cuestionarios, de modo que el número
                    de evaluaciones supera al de personas. Todas las frecuencias de este informe se
                    cuentan sobre trabajadores, nunca sobre evaluaciones.
                </Micro>

                <SectionTitle n={2}>Características personales y familiares</SectionTitle>
                {personal.map(b => (
                    <Profile key={b.title} b={b} />
                ))}

                <SectionTitle n={3}>Características ocupacionales</SectionTitle>
                {occupational.map(b => (
                    <Profile key={b.title} b={b} />
                ))}

                <SectionTitle n={4}>Reserva de la información</SectionTitle>
                <NoteBlock>
                    Los datos presentados son agregados y no permiten identificar a ningún
                    trabajador. La información está sujeta a reserva profesional conforme a la Ley
                    1090 de 2006 y debe conservarse por veinte años según la Resolución 2346 de
                    2007. No puede emplearse como criterio de selección, permanencia o
                    desvinculación laboral.
                </NoteBlock>

                <div style={{ marginTop: 48 }}>
                    <Label>Firma del profesional evaluador</Label>
                    <div style={{ height: 52 }} />
                    <div style={{ width: 230, height: 1.2, background: PAPER.ink }} />
                    <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, marginTop: 7 }}>
                        {professional.name}
                    </div>
                    <Micro size={11.5} style={{ marginTop: 2 }}>
                        Psicólogo especialista en Seguridad y Salud en el Trabajo
                        <br />
                        Licencia SST {professional.license}
                    </Micro>
                </div>
            </Paper>

            <div className="flex justify-end mt-6">
                <DownloadReportButton href={href} fallbackName="Perfil_sociodemografico.pdf" />
            </div>
        </div>
    );
}
