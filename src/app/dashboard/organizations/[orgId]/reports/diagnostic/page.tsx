import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildDiagnosticData } from "@/lib/reports/diagnostic-data";
import { DownloadReportButton } from "@/components/reports/download-report-button";
import {
    BandScale,
    ETable,
    HeatMatrix,
    Label,
    LevelChip,
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

/**
 * Vista previa del informe diagnóstico.
 *
 * Reproduce el documento que se descarga, con los mismos datos y los mismos
 * componentes de diseño. Antes esta página calculaba sus propias estadísticas y
 * las pintaba con una hoja de estilos aparte, de modo que la previa y el PDF
 * podían diferir tanto en apariencia como en cifras.
 */
export default async function DiagnosticReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const built = await buildDiagnosticData(orgId, session.user.id, !!session.user.isAdmin);

    if (!built) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Informe diagnóstico organizacional
                </h1>
                <p className="text-muted-foreground">
                    No hay evaluaciones calificadas en esta organización, o no tienes acceso a ella.
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

    const d = built.data;
    const { coverage, distributions, domains, dimensions, areas, groups } = d;
    const criticas = dimensions.filter(x => x.criticalPercent >= 20);
    const accionables = criticas.filter(x => x.action);

    const instruments = [
        { title: "Intralaboral", n: coverage.intra, dist: distributions.intra },
        { title: "Extralaboral", n: coverage.extra, dist: distributions.extra },
        { title: "Estrés", n: coverage.stress, dist: distributions.stress },
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
                        Informe diagnóstico organizacional
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Vista previa del documento · {d.org.name}
                    </p>
                </div>
                <DownloadReportButton
                    href={`/api/organizations/${orgId}/reports/diagnostic/pdf`}
                    fallbackName="Diagnostico_organizacional.pdf"
                />
            </div>

            <Paper>
                {/* ── Encabezado del documento ── */}
                <Label>
                    Batería de instrumentos para la evaluación de factores de riesgo psicosocial
                </Label>
                <h2
                    style={{
                        fontFamily: "var(--font-report-serif), Georgia, serif",
                        fontSize: 38,
                        fontWeight: 600,
                        lineHeight: 1.12,
                        margin: "18px 0 8px",
                    }}
                >
                    Informe diagnóstico organizacional
                </h2>
                <p style={{ color: PAPER.ink2, fontSize: 16, margin: 0 }}>
                    Resolución 2764 de 2022 · Ministerio del Trabajo de Colombia
                </p>

                <div style={{ height: 1.6, background: PAPER.ink, margin: "28px 0 22px" }} />

                <Label>Empresa evaluada</Label>
                <div
                    style={{
                        fontFamily: "var(--font-report-serif), Georgia, serif",
                        fontSize: 22,
                        fontWeight: 600,
                        marginTop: 5,
                    }}
                >
                    {d.org.name}
                </div>
                <Micro style={{ marginTop: 3 }}>
                    NIT {d.org.nit}
                    {d.org.city ? ` · ${d.org.city}` : ""}
                    {d.org.economicSector ? ` · ${d.org.economicSector}` : ""}
                </Micro>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mt-8">
                    {[
                        ["Periodo evaluado", `${d.org.dateStart} — ${d.org.dateEnd}`],
                        ["Trabajadores evaluados", String(coverage.uniqueWorkers)],
                        ["Evaluaciones aplicadas", String(coverage.totalAssessments)],
                        ["Fecha del informe", d.org.today],
                        ["Trabajadores en riesgo crítico", `${coverage.criticalWorkerPercent}%`],
                        ["Profesional responsable", d.professional.name],
                    ].map(([lbl, val]) => (
                        <div key={lbl}>
                            <Label style={{ fontSize: 9 }}>{lbl}</Label>
                            <div
                                style={{
                                    ...numStyle,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: PAPER.ink,
                                    marginTop: 3,
                                }}
                            >
                                {val}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── 1. Presentación ── */}
                <SectionTitle n={1}>Presentación y alcance</SectionTitle>
                <p style={{ margin: 0 }}>
                    Este documento presenta el diagnóstico de los factores de riesgo psicosocial de{" "}
                    {d.org.name}, calificado con los baremos vigentes conforme a la Resolución 2764
                    de 2022. Es el insumo del que se derivan el programa de vigilancia
                    epidemiológica y el plan de intervención. Sus resultados son estrictamente
                    estadísticos: describen condiciones de grupos, no situaciones individuales.
                </p>

                <SubTitle>Cobertura de la evaluación</SubTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard value={coverage.uniqueWorkers} label="Trabajadores evaluados" />
                    <StatCard value={coverage.totalAssessments} label="Evaluaciones aplicadas" />
                    <StatCard
                        value={`${coverage.criticalWorkerPercent}%`}
                        label="Trabajadores en riesgo alto o muy alto"
                        accent={coverage.criticalWorkerPercent >= 20 ? rc("ALTO") : PAPER.ink}
                    />
                    <StatCard
                        value={`${coverage.intra}/${coverage.extra}/${coverage.stress}`}
                        label="Evaluaciones intra / extra / estrés"
                    />
                </div>

                <Micro style={{ marginTop: 14 }}>
                    A cada trabajador se le aplican hasta tres cuestionarios, de modo que el número
                    de evaluaciones es mayor que el de personas. Los porcentajes por instrumento y
                    por área se calculan sobre evaluaciones; el umbral del 20% de la Resolución 2764
                    se contrasta contra el número de trabajadores.
                </Micro>

                {coverage.predominant && (
                    <p style={{ marginTop: 16, marginBottom: 0 }}>
                        El nivel de riesgo más frecuente entre las evaluaciones aplicadas es{" "}
                        <strong>{coverage.predominant.label.toLowerCase()}</strong>, con el{" "}
                        {coverage.predominant.percent}% de los resultados.
                        {coverage.highest && coverage.highest.level !== coverage.predominant.level && (
                            <>
                                {" "}
                                El nivel más severo registrado es{" "}
                                <strong>{coverage.highest.label.toLowerCase()}</strong>, presente en{" "}
                                {coverage.highest.count}{" "}
                                {coverage.highest.count === 1 ? "evaluación" : "evaluaciones"}.
                            </>
                        )}
                    </p>
                )}

                {coverage.unsigned > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <NoteBlock accent={rc("MEDIO")}>
                            <strong>Evaluaciones sin firma.</strong> {coverage.unsigned} de las{" "}
                            {coverage.totalAssessments} evaluaciones incluidas están calificadas pero
                            aún no firmadas. Los resultados estadísticos son válidos, pero el informe
                            no debe presentarse ante la autoridad hasta que todas estén suscritas.
                        </NoteBlock>
                    </div>
                )}

                <SubTitle>Reserva y anonimato</SubTitle>
                <NoteBlock>
                    Los resultados son agregados y no permiten identificar a ningún trabajador.
                    Ningún grupo se reporta por separado con menos de {d.minGroupSize} trabajadores.
                    La información está sujeta a reserva profesional conforme a la Ley 1090 de 2006
                    y debe conservarse por veinte años según la Resolución 2346 de 2007.
                </NoteBlock>

                {/* ── 2. Resultados generales ── */}
                <SectionTitle n={2}>Resultados generales</SectionTitle>
                <p style={{ marginTop: 0 }}>
                    Distribución de los resultados globales de cada instrumento entre los cinco
                    niveles de riesgo. Los porcentajes se calculan sobre las evaluaciones
                    calificadas de cada cuestionario.
                </p>

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
                                <span
                                    style={{
                                        fontFamily: "var(--font-report-serif), Georgia, serif",
                                        fontSize: 16,
                                        fontWeight: 600,
                                    }}
                                >
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

                {/* ── 3. Dominios ── */}
                {(domains.formA.length > 0 || domains.formB.length > 0) && (
                    <>
                        <SectionTitle n={3}>Resultados por dominio</SectionTitle>
                        <p style={{ marginTop: 0 }}>
                            Puntaje transformado promedio de cada dominio sobre las bandas de baremo
                            de su forma. El marcador señala el valor observado.
                        </p>

                        {[
                            {
                                label: "Forma A · cargos de jefatura, profesionales y técnicos",
                                items: domains.formA,
                            },
                            { label: "Forma B · cargos auxiliares y operarios", items: domains.formB },
                        ]
                            .filter(g => g.items.length > 0)
                            .map(g => (
                                <div key={g.label}>
                                    <SubTitle>{g.label}</SubTitle>
                                    <div className="space-y-6">
                                        {g.items.map(dom => (
                                            <div key={dom.key}>
                                                <div className="flex items-end justify-between gap-4">
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                "var(--font-report-serif), Georgia, serif",
                                                            fontSize: 15,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {dom.name}
                                                    </span>
                                                    <LevelChip
                                                        level={dom.level}
                                                        label={RISK_LABEL[dom.level]}
                                                        score={dom.avg}
                                                    />
                                                </div>
                                                <div style={{ marginTop: 8 }}>
                                                    <BandScale bounds={dom.bounds} value={dom.avg} />
                                                </div>
                                                {dom.definition && (
                                                    <Micro size={11.5} color={PAPER.ink3} style={{ marginTop: 7 }}>
                                                        {dom.definition}
                                                    </Micro>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </>
                )}

                {/* ── 4. Priorización ── */}
                <SectionTitle n={4}>Priorización de dimensiones</SectionTitle>
                <p style={{ marginTop: 0 }}>
                    Las dimensiones se ordenan por un índice que pondera el puntaje promedio y la
                    proporción de trabajadores en riesgo alto o muy alto. Una dimensión con promedio
                    moderado pero con una fracción grande de casos críticos sube en el orden, porque
                    concentra el daño en un subgrupo aunque el promedio lo diluya.
                </p>
                <ETable
                    headers={["Dimensión", "Instrumento", "Evaluados", "Promedio", "% crítico", "Prioridad"]}
                    align={["left", "left", "center", "center", "center", "center"]}
                    rows={dimensions.map(x => [
                        <span key="n" style={{ color: PAPER.ink, fontWeight: 500 }}>
                            {x.name}
                        </span>,
                        x.questionnaire,
                        <span key="c" style={numStyle}>
                            {x.count}
                        </span>,
                        <span key="a" style={numStyle}>
                            {x.avg}
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
                        <span key="r" style={numStyle}>
                            {x.priority}
                        </span>,
                    ])}
                />

                {/* ── 5. Intralaboral × estrés ── */}
                <SectionTitle n={5}>Riesgo intralaboral y sintomatología de estrés</SectionTitle>
                {d.correlationBase === 0 ? (
                    <NoteBlock>
                        Ningún trabajador tiene calificados simultáneamente el cuestionario
                        intralaboral y el de estrés, de modo que este cruce no puede calcularse.
                    </NoteBlock>
                ) : (
                    <>
                        <p style={{ marginTop: 0 }}>
                            El cruce de ambos instrumentos separa a los trabajadores en cuatro grupos
                            que requieren respuestas distintas. Se calcula sobre los{" "}
                            {d.correlationBase} trabajadores con los dos cuestionarios calificados.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <QuadCell
                                tag="Grupo A"
                                name="Sanos"
                                n={groups.sanos}
                                desc="Sin riesgo crítico y sin sintomatología. Mantener las condiciones actuales."
                                accent={rc("SIN_RIESGO")}
                            />
                            <QuadCell
                                tag="Grupo B"
                                name="Vulnerables"
                                n={groups.vulnerables}
                                desc="Sintomatología alta sin exposición crítica. Revisar factores extralaborales e individuales."
                                accent={rc("MEDIO")}
                            />
                            <QuadCell
                                tag="Grupo C"
                                name="Adaptados"
                                n={groups.adaptados}
                                desc="Exposición crítica sin sintomatología. Intervenir antes de que aparezca el daño."
                                accent={rc("ALTO")}
                            />
                            <QuadCell
                                tag="Grupo D"
                                name="Prioridad de intervención"
                                n={groups.prioritarios}
                                desc="Exposición crítica y sintomatología simultáneas. Atención inmediata e individual."
                                accent={rc("MUY_ALTO")}
                            />
                        </div>

                        <SubTitle>Matriz de distribución</SubTitle>
                        <HeatMatrix
                            matrix={d.correlation}
                            rowLabel="Filas: riesgo intralaboral"
                            colLabel="Columnas: sintomatología de estrés"
                        />
                    </>
                )}

                {/* ── 6. Áreas ── */}
                <SectionTitle n={6}>Resultados por área</SectionTitle>
                {areas.reported.length === 0 ? (
                    <NoteBlock>
                        Ninguna área alcanza los {d.minGroupSize} trabajadores que se exigen para
                        reportarla por separado sin comprometer el anonimato de sus integrantes. Sus{" "}
                        {areas.withheld.workers} trabajadores están incluidos en las cifras generales.
                    </NoteBlock>
                ) : (
                    <>
                        <p style={{ marginTop: 0 }}>
                            Áreas ordenadas por la proporción de evaluaciones en riesgo alto o muy
                            alto, para dirigir la intervención donde la exposición se concentra.
                        </p>
                        <ETable
                            headers={["Área", "Trabajadores", "Evaluaciones", "% crítico", "Distribución"]}
                            align={["left", "center", "center", "center", "left"]}
                            rows={areas.reported.map(a => [
                                <span key="n" style={{ color: PAPER.ink, fontWeight: 500 }}>
                                    {a.name}
                                </span>,
                                <span key="w" style={numStyle}>
                                    {a.workers}
                                </span>,
                                <span key="e" style={numStyle}>
                                    {a.assessments}
                                </span>,
                                <span
                                    key="p"
                                    style={{
                                        ...numStyle,
                                        fontWeight: 600,
                                        color:
                                            a.criticalPercent >= 40
                                                ? rc("MUY_ALTO")
                                                : a.criticalPercent >= 20
                                                  ? rc("ALTO")
                                                  : PAPER.ink2,
                                    }}
                                >
                                    {a.criticalPercent}%
                                </span>,
                                <div key="d" style={{ minWidth: 120 }}>
                                    <StackedBar dist={a.dist} height={8} />
                                </div>,
                            ])}
                        />
                        {areas.withheld.areas > 0 && (
                            <Micro size={11} color={PAPER.ink3} style={{ marginTop: 10 }}>
                                Se omitieron {areas.withheld.areas} áreas que no alcanzan los{" "}
                                {d.minGroupSize} trabajadores necesarios para reportarlas sin
                                comprometer el anonimato. Sus {areas.withheld.workers} trabajadores y{" "}
                                {areas.withheld.assessments} evaluaciones sí están incluidos en las
                                cifras generales.
                            </Micro>
                        )}
                    </>
                )}

                {/* ── 7. Conclusiones ── */}
                <SectionTitle n={7}>Conclusiones</SectionTitle>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {[
                        `La organización aplicó ${coverage.totalAssessments} evaluaciones a ${coverage.uniqueWorkers} trabajadores entre ${d.org.dateStart} y ${d.org.dateEnd}. ${coverage.criticalWorkers} trabajadores —el ${coverage.criticalWorkerPercent}% de los evaluados— presentaron al menos un instrumento en riesgo alto o muy alto. Sobre el total de evaluaciones, la proporción crítica es del ${coverage.criticalPercent}%.`,
                        coverage.criticalWorkerPercent >= 20
                            ? "Al alcanzar o superar el umbral del 20% de la población evaluada en riesgo alto o muy alto, la organización debe implementar un sistema de vigilancia epidemiológica de factores de riesgo psicosocial, con intervención inmediata y seguimiento anual, conforme a la Resolución 2764 de 2022."
                            : "La proporción de trabajadores en riesgo crítico se mantiene por debajo del umbral del 20%. La reevaluación debe realizarse en un plazo máximo de dos años, conforme a la Resolución 2764 de 2022.",
                        criticas.length > 0
                            ? `Concentran la prioridad ${criticas.length} dimensiones con al menos un 20% de trabajadores en riesgo crítico; encabeza la lista ${criticas[0].name}, con el ${criticas[0].criticalPercent}%.`
                            : null,
                        d.correlationBase > 0 && groups.prioritarios > 0
                            ? `${groups.prioritarios} trabajadores presentan simultáneamente exposición crítica y sintomatología de estrés. Son el grupo de atención inmediata y requieren seguimiento individual documentado.`
                            : null,
                    ]
                        .filter(Boolean)
                        .map((t, i) => (
                            <li key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                                <span style={{ color: PAPER.ink3 }}>—</span>
                                <span>{t}</span>
                            </li>
                        ))}
                </ul>

                {/* ── 8. Recomendaciones ── */}
                <SectionTitle n={8}>Recomendaciones</SectionTitle>
                {accionables.length === 0 ? (
                    <NoteBlock>
                        Ninguna dimensión alcanza el 20% de trabajadores en riesgo alto o muy alto,
                        por lo que no se identifican condiciones que exijan intervención específica.
                    </NoteBlock>
                ) : (
                    <>
                        <p style={{ marginTop: 0 }}>
                            Acciones sugeridas para las dimensiones con al menos un 20% de
                            trabajadores en riesgo alto o muy alto. Cada acción debe incorporarse al
                            plan de trabajo anual con responsable, recursos y fecha de verificación.
                        </p>
                        <ETable
                            headers={["Dimensión", "% crítico", "Acción recomendada"]}
                            align={["left", "center", "left"]}
                            rows={accionables.map(x => [
                                <span key="n" style={{ color: PAPER.ink, fontWeight: 500 }}>
                                    {x.name}
                                </span>,
                                <span
                                    key="p"
                                    style={{
                                        ...numStyle,
                                        fontWeight: 600,
                                        color: x.criticalPercent >= 40 ? rc("MUY_ALTO") : rc("ALTO"),
                                    }}
                                >
                                    {x.criticalPercent}%
                                </span>,
                                x.action,
                            ])}
                        />
                    </>
                )}

                {/* ── Firma ── */}
                <div style={{ marginTop: 48 }}>
                    <Label>Firma del profesional evaluador</Label>
                    <div style={{ height: 52 }} />
                    <div style={{ width: 230, height: 1.2, background: PAPER.ink }} />
                    <div
                        style={{
                            fontFamily: "var(--font-report-serif), Georgia, serif",
                            fontSize: 16,
                            fontWeight: 600,
                            marginTop: 7,
                        }}
                    >
                        {d.professional.name}
                    </div>
                    <Micro size={11.5} style={{ marginTop: 2 }}>
                        Psicólogo especialista en Seguridad y Salud en el Trabajo
                        <br />
                        Licencia SST {d.professional.license}
                    </Micro>
                </div>
            </Paper>

            <div className="flex justify-end mt-6">
                <DownloadReportButton
                    href={`/api/organizations/${orgId}/reports/diagnostic/pdf`}
                    fallbackName="Diagnostico_organizacional.pdf"
                />
            </div>
        </div>
    );
}
