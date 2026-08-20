import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildSVEData } from "@/lib/reports/sve-data";
import { DownloadReportButton } from "@/components/reports/download-report-button";
import {
    BandScale,
    ETable,
    Label,
    Micro,
    NoteBlock,
    PAPER,
    Paper,
    QuadCell,
    RISK_KEYS,
    RISK_LABEL,
    RiskLegend,
    SectionTitle,
    StackedBar,
    StatCard,
    SubTitle,
    numStyle,
    rc,
} from "@/components/reports/paper";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

const serif = "var(--font-report-serif), Georgia, serif";

/**
 * Vista previa del Programa de Vigilancia Epidemiológica.
 *
 * El documento completo son veinticinco páginas, en buena parte contenido
 * normativo fijo. Aquí se muestran las secciones que dependen de los datos de la
 * organización, con el mismo diseño del PDF, y el resto se consulta al
 * descargarlo.
 */
export default async function SVEReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const built = await buildSVEData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Programa de Vigilancia Epidemiológica
                </h1>
                <p className="text-muted-foreground">
                    No hay evaluaciones completadas para generar el SVE, o no tienes acceso a esta
                    organización.
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

    const { data } = built;
    const { org, summary, groups, distributions, criticalDimensions, areas, domains } = data;
    const href = `/api/organizations/${orgId}/sve/pdf`;

    const instruments = [
        { title: "Intralaboral", n: summary.intraA + summary.intraB, dist: distributions.intra },
        { title: "Extralaboral", n: summary.extra, dist: distributions.extra },
        { title: "Estrés", n: summary.stress, dist: distributions.stress },
    ];

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
                        Programa de Vigilancia Epidemiológica
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Vista previa del documento · {org.name}
                    </p>
                </div>
                <DownloadReportButton href={href} fallbackName="Programa_SVE.pdf" />
            </div>

            <Paper>
                <Label>Programa de vigilancia epidemiológica · Resolución 2764 de 2022</Label>
                <h2
                    style={{
                        fontFamily: serif,
                        fontSize: 38,
                        fontWeight: 600,
                        lineHeight: 1.12,
                        margin: "18px 0 8px",
                    }}
                >
                    Factores de riesgo psicosocial
                </h2>
                <p style={{ color: PAPER.ink2, fontSize: 16, margin: 0 }}>
                    Programa de vigilancia epidemiológica de la organización
                </p>

                <div style={{ height: 1.6, background: PAPER.ink, margin: "28px 0 22px" }} />

                <Label>Empresa</Label>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, marginTop: 5 }}>
                    {org.name}
                </div>
                <Micro style={{ marginTop: 3 }}>
                    NIT {org.nit}
                    {org.city ? ` · ${org.city}` : ""}
                </Micro>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mt-8">
                    {[
                        ["Periodo evaluado", `${org.dateStart} — ${org.dateEnd}`],
                        ["Fecha del informe", org.today],
                        ["Profesional responsable", org.psychologistName],
                    ].map(([lbl, val]) => (
                        <div key={lbl}>
                            <Label style={{ fontSize: 9 }}>{lbl}</Label>
                            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{val}</div>
                        </div>
                    ))}
                </div>

                <SectionTitle n={1}>Población y cobertura</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard value={summary.uniqueWorkers} label="Trabajadores" />
                    <StatCard value={summary.totalAssessments} label="Evaluaciones aplicadas" />
                    <StatCard
                        value={groups.d}
                        label="Grupo D · trabajadores"
                        accent={groups.d > 0 ? rc("MUY_ALTO") : PAPER.ink}
                    />
                    <StatCard
                        value={`${summary.criticalWorkerPercent}%`}
                        label="Trabajadores en zona crítica"
                        accent={summary.needsSVE ? rc("ALTO") : PAPER.ink}
                    />
                </div>

                <Micro style={{ marginTop: 14 }}>
                    A cada trabajador se le aplican hasta tres cuestionarios, de modo que el número
                    de evaluaciones es mayor que el de personas. El umbral del 20% de la Resolución
                    2764 se contrasta contra el número de trabajadores.
                </Micro>

                {summary.needsSVE && (
                    <div style={{ marginTop: 16 }}>
                        <NoteBlock accent={rc("MUY_ALTO")}>
                            <strong>Obligatoriedad.</strong> El {summary.criticalWorkerPercent}% de
                            los trabajadores —{summary.criticalWorkers} de {summary.uniqueWorkers}—
                            se ubica en nivel de riesgo Alto o Muy Alto. Al superarse el umbral del
                            20% de la población evaluada, la organización tiene la obligación de
                            implementar y mantener activo este Programa de Vigilancia
                            Epidemiológica.
                        </NoteBlock>
                    </div>
                )}

                <SectionTitle n={2}>Perfil general de riesgo</SectionTitle>
                <div className="space-y-3">
                    {instruments.map(({ title, n, dist }) => (
                        <div
                            key={title}
                            style={{
                                background: PAPER.panel,
                                border: `1px solid ${PAPER.rule}`,
                                padding: 16,
                            }}
                        >
                            <div className="flex items-baseline justify-between gap-4">
                                <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 600 }}>
                                    {title}
                                </span>
                                <Micro size={11} color={PAPER.ink3}>
                                    {n} evaluaciones
                                </Micro>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                <StackedBar dist={dist} height={11} />
                            </div>
                            <div className="grid grid-cols-5 mt-2.5">
                                {RISK_KEYS.map(k => (
                                    <div key={k} style={{ textAlign: "center" }}>
                                        <div
                                            style={{
                                                ...numStyle,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: rc(k),
                                            }}
                                        >
                                            {dist[k]}%
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "var(--font-report-sans), sans-serif",
                                                fontSize: 9,
                                                color: PAPER.ink3,
                                            }}
                                        >
                                            {RISK_LABEL[k]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 14 }}>
                    <RiskLegend />
                </div>

                <SectionTitle n={3}>Grupos de intervención</SectionTitle>
                <p style={{ marginTop: 0 }}>
                    El cruce entre condiciones de trabajo y condiciones de salud separa a la
                    población en cuatro grupos, cada uno con una respuesta distinta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuadCell
                        tag="Grupo A"
                        name="Sanos"
                        n={groups.a}
                        desc="Sin riesgo crítico y sin sintomatología. Mantener las condiciones actuales."
                        accent={rc("SIN_RIESGO")}
                    />
                    <QuadCell
                        tag="Grupo B"
                        name="Vulnerables"
                        n={groups.b}
                        desc="Sintomatología alta sin exposición crítica. Revisar factores extralaborales e individuales."
                        accent={rc("MEDIO")}
                    />
                    <QuadCell
                        tag="Grupo C"
                        name="Adaptados"
                        n={groups.c}
                        desc="Exposición crítica sin sintomatología. Intervenir antes de que aparezca el daño."
                        accent={rc("ALTO")}
                    />
                    <QuadCell
                        tag="Grupo D"
                        name="Prioridad de intervención"
                        n={groups.d}
                        desc="Riesgo y sintomatología simultáneos. Atención inmediata e individual."
                        accent={rc("MUY_ALTO")}
                    />
                </div>

                {(domains.formA.length > 0 || domains.formB.length > 0) && (
                    <>
                        <SectionTitle n={4}>Resultado por dominios</SectionTitle>
                        {[
                            { label: "Forma A", items: domains.formA },
                            { label: "Forma B", items: domains.formB },
                        ]
                            .filter(g => g.items.length > 0)
                            .map(g => (
                                <div key={g.label}>
                                    <SubTitle>{g.label}</SubTitle>
                                    <div className="space-y-6">
                                        {g.items.map(dom => (
                                            <div key={dom.name}>
                                                <div className="flex items-end justify-between gap-4">
                                                    <span
                                                        style={{
                                                            fontFamily: serif,
                                                            fontSize: 15,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {dom.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            ...numStyle,
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {dom.avg}
                                                    </span>
                                                </div>
                                                <div style={{ marginTop: 8 }}>
                                                    <BandScale bounds={dom.bounds} value={dom.avg} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </>
                )}

                {criticalDimensions.length > 0 && (
                    <>
                        <SectionTitle n={5}>Dimensiones en riesgo crítico</SectionTitle>
                        <ETable
                            headers={["Dimensión", "Cuestionario", "Evaluados", "% crítico"]}
                            align={["left", "left", "center", "center"]}
                            rows={criticalDimensions.slice(0, 12).map(x => [
                                <span key="n" style={{ color: PAPER.ink, fontWeight: 500 }}>
                                    {x.name}
                                </span>,
                                x.questionnaire,
                                <span key="c" style={numStyle}>
                                    {x.count}
                                </span>,
                                <span
                                    key="p"
                                    style={{
                                        ...numStyle,
                                        fontWeight: 600,
                                        color:
                                            x.criticalPercent >= 40
                                                ? rc("MUY_ALTO")
                                                : x.criticalPercent >= 20
                                                  ? rc("ALTO")
                                                  : PAPER.ink2,
                                    }}
                                >
                                    {x.criticalPercent}%
                                </span>,
                            ])}
                        />
                    </>
                )}

                {areas.length > 0 && (
                    <>
                        <SectionTitle n={6}>Análisis por áreas de trabajo</SectionTitle>
                        <div className="space-y-5">
                            {areas.map(a => (
                                <div key={a.name}>
                                    <div className="flex items-end justify-between gap-4">
                                        <span
                                            style={{
                                                fontFamily: serif,
                                                fontSize: 15,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {a.name}
                                        </span>
                                        <Micro size={11} color={PAPER.ink3}>
                                            {a.workers} trabajadores · {a.assessments} evaluaciones
                                        </Micro>
                                    </div>
                                    <div style={{ marginTop: 7 }}>
                                        <StackedBar dist={a.dist} height={9} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 14 }}>
                            <RiskLegend />
                        </div>
                    </>
                )}

                <div style={{ marginTop: 40 }}>
                    <NoteBlock>
                        Esta vista previa muestra las secciones que dependen de los datos de la
                        organización. El documento completo incluye además el marco normativo, los
                        objetivos y el alcance del programa, la metodología de vigilancia, las
                        conductas a seguir por grupo, el análisis psicosocial del puesto de trabajo,
                        el plan de intervención y el control documental.
                    </NoteBlock>
                </div>
            </Paper>

            <div className="flex justify-end mt-6">
                <DownloadReportButton href={href} fallbackName="Programa_SVE.pdf" />
            </div>
        </div>
    );
}
