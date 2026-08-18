import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700 },
    ]
});

const C = {
    bg: '#FFFFFF',
    primary: '#1E3A8A', primaryLight: '#3B82F6', primaryBg: '#EFF6FF',
    text: '#0F172A', textMuted: '#475569', textLight: '#94A3B8',
    border: '#E2E8F0', borderLight: '#F1F5F9',
    green: '#10B981', greenBg: '#F0FDF4', greenText: '#166534',
    orange: '#F97316', orangeBg: '#FFF7ED', orangeText: '#9A3412',
    red: '#EF4444', redBg: '#FEF2F2', redText: '#991B1B',
    blue: '#3B82F6', blueBg: '#EFF6FF', blueText: '#1E40AF',
    sinRiesgo: '#10B981', bajo: '#3B82F6', medio: '#F59E0B', alto: '#EF4444', muyAlto: '#7F1D1D',
};

const RISK_COLORS: Record<string, string> = {
    SIN_RIESGO: C.sinRiesgo, BAJO: C.bajo, MEDIO: C.medio, ALTO: C.alto, MUY_ALTO: C.muyAlto,
};
const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: 'Sin Riesgo', BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto', MUY_ALTO: 'Muy Alto',
};

const s = StyleSheet.create({
    page: { padding: 45, paddingBottom: 65, fontFamily: 'Inter', backgroundColor: C.bg, fontSize: 9.5, color: C.text },
    coverPage: { padding: 55, fontFamily: 'Inter', backgroundColor: '#0B1120', color: '#FFFFFF' },

    // Cover
    coverBrandBar: { width: 70, height: 4, backgroundColor: C.primaryLight, marginBottom: 24 },
    coverBrand: { fontSize: 9, color: C.primaryLight, letterSpacing: 2, marginBottom: 60, textTransform: 'uppercase' },
    coverTitle: { fontSize: 30, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.8, lineHeight: 1.15 },
    coverSubtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 10 },
    coverNorm: { fontSize: 10, color: C.primaryLight, marginBottom: 45 },
    coverBox: { backgroundColor: '#1E293B', padding: 18, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: C.primaryLight, marginBottom: 14 },
    coverLabel: { fontSize: 8, color: '#64748B', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 },
    coverValue: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
    coverRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    coverHalf: { width: '48%', backgroundColor: '#1E293B', padding: 14, borderRadius: 6 },
    coverSmallValue: { fontSize: 11, fontWeight: 'bold', color: '#E2E8F0' },
    coverFooter: { position: 'absolute', bottom: 45, left: 55, right: 55, fontSize: 8, color: '#64748B', lineHeight: 1.6, borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: 12 },

    // Page header
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: C.primaryLight, paddingBottom: 7, marginBottom: 18 },
    pageTitle: { fontSize: 16, fontWeight: 'bold', color: C.primary, letterSpacing: -0.4 },
    pageNum: { fontSize: 8, color: C.textLight },

    h2: { fontSize: 12, fontWeight: 'bold', color: C.text, marginTop: 14, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },
    h3: { fontSize: 10, fontWeight: 'bold', color: C.primary, marginTop: 10, marginBottom: 5 },
    body: { fontSize: 9, color: C.textMuted, lineHeight: 1.65, marginBottom: 8, textAlign: 'justify' },
    bold: { fontWeight: 'bold', color: C.text },

    // TOC
    tocRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    tocText: { fontSize: 9.5, color: C.textMuted },
    tocTextBold: { fontSize: 9.5, color: C.text, fontWeight: 'bold' },
    tocPage: { fontSize: 9, color: C.textLight },

    // Bullets
    bullet: { flexDirection: 'row', marginBottom: 5, paddingRight: 10 },
    bulletDot: { width: 12, fontSize: 9, color: C.primaryLight, fontWeight: 'bold' },
    bulletText: { flex: 1, fontSize: 9, color: C.textMuted, lineHeight: 1.55, textAlign: 'justify' },

    // Tables
    table: { width: '100%', borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
    tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
    tRowLast: { flexDirection: 'row' },
    tHead: { backgroundColor: C.primary, padding: 7, fontSize: 7.5, fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.4 },
    tHeadLight: { backgroundColor: C.borderLight, padding: 7, fontSize: 7.5, fontWeight: 'bold', color: C.text, textTransform: 'uppercase', letterSpacing: 0.4 },
    tCell: { padding: 7, fontSize: 8.5, color: C.textMuted, lineHeight: 1.45 },
    tCellBold: { padding: 7, fontSize: 8.5, color: C.text, fontWeight: 'bold' },

    // KPI
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    kpiCard: { width: '23.5%', backgroundColor: C.borderLight, borderRadius: 5, padding: 10, alignItems: 'center' },
    kpiValue: { fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 2 },
    kpiLabel: { fontSize: 6.5, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },

    // Bars
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    barLabel: { width: 58, fontSize: 7.5, color: C.textMuted },
    barTrack: { flex: 1, height: 9, backgroundColor: C.borderLight, borderRadius: 4.5, marginRight: 6 },
    barFill: { height: 9, borderRadius: 4.5 },
    barPct: { width: 26, fontSize: 7.5, fontWeight: 'bold', color: C.text, textAlign: 'right' },

    distBox: { width: '32%', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 5, padding: 10 },
    distTitle: { fontSize: 8, fontWeight: 'bold', color: C.text, marginBottom: 8, textAlign: 'center' },

    // Groups matrix
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    matrixBox: { width: '48.5%', padding: 12, marginBottom: 10, borderWidth: 1, borderRadius: 5 },
    matrixLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    matrixName: { fontSize: 11, fontWeight: 'bold', color: C.text, marginBottom: 3 },
    matrixNum: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    matrixSub: { fontSize: 7.5, color: C.textMuted, lineHeight: 1.4 },

    // Alerts
    alert: { padding: 11, borderRadius: 4, marginBottom: 12, borderLeftWidth: 3 },
    alertText: { fontSize: 8.5, lineHeight: 1.55 },

    // Signature
    sigWrap: { marginTop: 45, alignItems: 'center' },
    sigLine: { width: 240, height: 1, backgroundColor: C.text, marginBottom: 8 },
    sigName: { fontSize: 11, fontWeight: 'bold', color: C.text },
    sigDetail: { fontSize: 8.5, color: C.textMuted, marginTop: 2 },

    // Footer
    footer: { position: 'absolute', bottom: 25, left: 45, right: 45, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: C.textLight },
});

// ─── Types ────────────────────────────────────────────────
export interface DemographicRow { label: string; count: number; pct: number }

export interface SVEReportData {
    org: {
        name: string; nit: string;
        psychologistName: string; psychologistLicense: string;
        dateStart: string; dateEnd: string; today: string;
    };
    summary: {
        uniqueWorkers: number; totalAssessments: number;
        intraA: number; intraB: number; extra: number; stress: number;
        criticalPercent: number; needsSVE: boolean;
    };
    demographics: {
        gender: DemographicRow[];
        ageRanges: DemographicRow[];
        education: DemographicRow[];
        maritalStatus: DemographicRow[];
        contractType: DemographicRow[];
        workSchedule: DemographicRow[];
        seniority: DemographicRow[];
    };
    distributions: {
        intra: Record<string, number>;
        extra: Record<string, number>;
        stress: Record<string, number>;
    };
    groups: { a: number; b: number; c: number; d: number };
    criticalDimensions: { name: string; questionnaire: string; avgScore: number; criticalPercent: number }[];
    areas: { name: string; count: number; dist: Record<string, number> }[];
}

// ─── Helpers ──────────────────────────────────────────────
const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={s.bullet}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>{children}</Text>
    </View>
);

const NumBullet = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <View style={s.bullet}>
        <Text style={s.bulletDot}>{n}.</Text>
        <Text style={s.bulletText}>{children}</Text>
    </View>
);

const DistBars = ({ dist }: { dist: Record<string, number> }) => (
    <View>
        {['SIN_RIESGO', 'BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO'].map(k => (
            <View key={k} style={s.barRow}>
                <Text style={s.barLabel}>{RISK_LABELS[k]}</Text>
                <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${dist[k] ?? 0}%`, backgroundColor: RISK_COLORS[k] }]} />
                </View>
                <Text style={s.barPct}>{dist[k] ?? 0}%</Text>
            </View>
        ))}
    </View>
);

const DemoTable = ({ title, rows }: { title: string; rows: DemographicRow[] }) => {
    if (rows.length === 0) return null;
    return (
        <View wrap={false}>
            <Text style={s.h3}>{title}</Text>
            <View style={s.table}>
                <View style={s.tRow}>
                    <Text style={[s.tHeadLight, { width: '55%' }]}>Categoría</Text>
                    <Text style={[s.tHeadLight, { width: '22%', textAlign: 'center' }]}>N</Text>
                    <Text style={[s.tHeadLight, { width: '23%', textAlign: 'center' }]}>%</Text>
                </View>
                {rows.map((r, i) => (
                    <View key={r.label} style={i === rows.length - 1 ? s.tRowLast : s.tRow}>
                        <Text style={[s.tCell, { width: '55%' }]}>{r.label}</Text>
                        <Text style={[s.tCell, { width: '22%', textAlign: 'center' }]}>{r.count}</Text>
                        <Text style={[s.tCellBold, { width: '23%', textAlign: 'center' }]}>{r.pct}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const PageFooter = ({ label }: { label: string }) => (
    <View style={s.footer} fixed>
        <Text style={s.footerText}>{label}</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
);

const Header = ({ title }: { title: string }) => (
    <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{title}</Text>
        <Text style={s.pageNum}>SVE · Res. 2764/2022</Text>
    </View>
);

// ─── Document ─────────────────────────────────────────────
export default function SVEReportPDF({ data }: { data: SVEReportData }) {
    const { org, summary, demographics, distributions, groups, criticalDimensions, areas } = data;
    const footerLabel = `${org.name} · NIT ${org.nit}`;

    return (
        <Document
            title={`Programa SVE Riesgo Psicosocial - ${org.name}`}
            author={org.psychologistName}
            subject="Programa de Vigilancia Epidemiológica de Factores de Riesgo Psicosocial"
        >
            {/* ═══ PORTADA ═══ */}
            <Page size="A4" style={s.coverPage}>
                <View style={s.coverBrandBar} />
                <Text style={s.coverBrand}>PsicoSST · Batería de Riesgo Psicosocial · Colombia</Text>

                <Text style={s.coverTitle}>Programa de Vigilancia Epidemiológica</Text>
                <Text style={s.coverSubtitle}>Factor de Riesgos Psicosocial</Text>
                <Text style={s.coverNorm}>Resolución 2764 de 2022 — Ministerio del Trabajo</Text>

                <View style={s.coverBox}>
                    <Text style={s.coverLabel}>Empresa</Text>
                    <Text style={s.coverValue}>{org.name}</Text>
                </View>

                <View style={s.coverRow}>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>NIT</Text>
                        <Text style={s.coverSmallValue}>{org.nit}</Text>
                    </View>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>Trabajadores evaluados</Text>
                        <Text style={s.coverSmallValue}>{summary.uniqueWorkers}</Text>
                    </View>
                </View>

                <View style={s.coverRow}>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>Psicólogo(a) responsable</Text>
                        <Text style={s.coverSmallValue}>{org.psychologistName}</Text>
                    </View>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>Licencia SST</Text>
                        <Text style={s.coverSmallValue}>{org.psychologistLicense}</Text>
                    </View>
                </View>

                <View style={s.coverRow}>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>Período de evaluación</Text>
                        <Text style={s.coverSmallValue}>{org.dateStart} — {org.dateEnd}</Text>
                    </View>
                    <View style={s.coverHalf}>
                        <Text style={s.coverLabel}>Fecha de elaboración</Text>
                        <Text style={s.coverSmallValue}>{org.today}</Text>
                    </View>
                </View>

                <Text style={s.coverFooter}>
                    Documento técnico confidencial. Forma parte del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).
                    Los datos presentados son de carácter estadístico y están sometidos a reserva conforme a la Ley 1090 de 2006
                    y la Resolución 2646 de 2008.
                </Text>
            </Page>

            {/* ═══ ÍNDICE ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="Índice de Contenidos" />
                {[
                    ['Introducción', true],
                    ['I. Justificación', true],
                    ['II. Marco Legal', true],
                    ['III. Objetivos', true],
                    ['   3.1 Objetivo General', false],
                    ['   3.2 Objetivos Específicos', false],
                    ['IV. Descripción del Agente de Riesgo', true],
                    ['   4.1 Definición de Factores de Riesgo Psicosocial', false],
                    ['   4.2 Clasificación de los Factores Psicosociales', false],
                    ['   4.3 Efectos sobre la Salud y el Trabajo', false],
                    ['   4.4 Instrumento de Evaluación', false],
                    ['V. Descripción de la Empresa', true],
                    ['   5.1 Descripción Demográfica', false],
                    ['   5.2 Horarios, Turnos y Aspectos Laborales', false],
                    ['VI. Metodología del Programa', true],
                    ['   6.1 Universo de Trabajo y Alcance', false],
                    ['   6.2 Enfoque del Programa', false],
                    ['   6.3 Fases del Programa', false],
                    ['   6.4 Análisis Psicosocial del Puesto de Trabajo', false],
                    ['VII. Resultados del Diagnóstico', true],
                    ['   7.1 Perfil General de Riesgo', false],
                    ['   7.2 Correlación de Resultados — Grupos de Intervención', false],
                    ['   7.3 Dimensiones en Riesgo Crítico', false],
                    ['   7.4 Análisis por Áreas de Trabajo', false],
                    ['VIII. Niveles de Intervención', true],
                    ['   8.1 Intervención Primaria', false],
                    ['   8.2 Intervención Secundaria y Terciaria', false],
                    ['   8.3 Conductas a Seguir por Grupo (A / B / C / D)', false],
                    ['IX. Plan de Intervención General', true],
                    ['X. Indicadores del Programa', true],
                    ['XI. Control de Documentación', true],
                    ['XII. Recursos Necesarios', true],
                    ['XIII. Responsabilidades', true],
                    ['XIV. Conclusiones', true],
                    ['XV. Bibliografía', true],
                ].map(([label, isBold], i) => (
                    <View key={i} style={s.tocRow}>
                        <Text style={isBold ? s.tocTextBold : s.tocText}>{label as string}</Text>
                    </View>
                ))}
                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ INTRODUCCIÓN + JUSTIFICACIÓN ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="Introducción y Justificación" />

                <Text style={s.h2}>Introducción</Text>
                <Text style={s.body}>
                    Bajo el cumplimiento de la normatividad vigente en cuanto a la documentación, aplicación y análisis de la batería de
                    riesgo psicosocial, la empresa <Text style={s.bold}>{org.name}</Text> se suma al compromiso de cumplir y responderle a
                    sus colaboradores en prevención y promoción para su salud mental y bienestar físico.
                </Text>
                <Text style={s.body}>
                    Desde el área de Gestión Humana y el Sistema Integrado de Gestión se lideran todos los procesos del Sistema de Gestión
                    de Seguridad y Salud en el Trabajo según los riesgos prioritarios a los cuales se encuentran expuestos los trabajadores.
                    En el ámbito psicosocial es fundamental y necesario el desarrollo de un Programa de Vigilancia Epidemiológica para el
                    Control de los Factores de Riesgo Psicosocial y la prevención de las patologías causadas por el estrés ocupacional.
                </Text>
                <Text style={s.body}>
                    Los factores psicosociales comprenden los aspectos intralaborales, extralaborales o externos a la organización y las
                    condiciones individuales o características intrínsecas del trabajador, los cuales, en una interrelación dinámica mediante
                    percepciones y experiencias, influyen en la salud y el desempeño de las personas. Los factores de riesgo psicosocial son
                    aquellas condiciones psicosociales cuya identificación y evaluación muestra efectos negativos en la salud de los
                    trabajadores o en el trabajo (Resolución 2764 de 2022).
                </Text>

                <Text style={s.h2}>I. Justificación</Text>
                <Text style={s.body}>
                    En la actualidad las exigencias del medio laboral relacionadas con la naturaleza cambiante del trabajo, la dinámica de los
                    mercados, la globalización y el modelo económico, el desarrollo tecnológico, los estándares de alto desempeño y las jornadas
                    prolongadas de trabajo han ocasionado que la relación hombre–trabajo se presente cada vez más compleja y con consecuencias
                    negativas, tanto para la salud del trabajador como para la productividad de las organizaciones.
                </Text>
                <Text style={s.body}>
                    Los resultados de la Segunda Encuesta Nacional de Condiciones de Salud y Trabajo (MinTrabajo, 2013) reportaron los factores
                    de riesgo psicosocial como los más frecuentemente percibidos por los trabajadores junto con los biomecánicos. Estas razones
                    hacen necesaria la identificación y el análisis de los factores de riesgo psicosocial, sus niveles de expresión y la
                    implementación de controles tanto en los procesos como en las personas.
                </Text>

                {summary.needsSVE && (
                    <View style={[s.alert, { backgroundColor: C.redBg, borderLeftColor: C.red }]}>
                        <Text style={[s.alertText, { color: C.redText }]}>
                            <Text style={s.bold}>Indicación obligatoria: </Text>
                            Los resultados del diagnóstico muestran que el {summary.criticalPercent}% de los trabajadores evaluados se encuentra
                            en nivel de riesgo Alto o Muy Alto. Según la Resolución 2764 de 2022, cuando más del 20% de la población evaluada
                            supera este umbral, la organización tiene la obligación de implementar y mantener activo el presente Programa de
                            Vigilancia Epidemiológica de Factores de Riesgo Psicosocial.
                        </Text>
                    </View>
                )}

                <Text style={s.body}>
                    Un Sistema de Vigilancia Epidemiológica se define como el conjunto de estrategias, técnicas y acciones orientadas a la
                    evaluación, intervención y control sistemático de las variables que intervienen en los aspectos de condiciones de trabajo
                    y de salud relacionados con los factores de riesgo psicosociales a los que están expuestos los trabajadores de{' '}
                    <Text style={s.bold}>{org.name}</Text>. Este programa permite la identificación, evaluación, prevención, intervención y
                    monitoreo permanente de la exposición a factores de riesgo psicosocial en el trabajo y la determinación del origen de las
                    patologías causadas por estrés ocupacional.
                </Text>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ MARCO LEGAL ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="II. Marco Legal" />
                <Text style={s.body}>
                    En Colombia, la siguiente normatividad regula la identificación, evaluación, prevención, intervención y monitoreo de los
                    factores de riesgo psicosocial en el ámbito laboral:
                </Text>

                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '28%' }]}>Norma</Text>
                        <Text style={[s.tHead, { width: '72%' }]}>Contenido relevante</Text>
                    </View>
                    {[
                        ['Decreto 614 de 1984', 'Organización y administración de la salud ocupacional. Establece la necesidad de proteger a la persona contra los riesgos psicosociales que puedan afectar la salud individual o colectiva en los lugares de trabajo.'],
                        ['Resolución 1016 de 1989', 'Define los programas empresariales de salud ocupacional y la planificación, organización, ejecución y evaluación de actividades de medicina preventiva, higiene industrial y seguridad industrial.'],
                        ['Decreto Ley 1295 de 1994', 'Define los servicios de prevención que debe brindar la ARL, incluyendo el fomento de estilos de vida y trabajo saludables según el perfil epidemiológico de la organización.'],
                        ['Ley 1010 de 2006', 'Adopta medidas para prevenir, corregir y sancionar el acoso laboral y otros hostigamientos, en protección de la salud mental de los trabajadores y la armonía del ambiente laboral.'],
                        ['Resolución 2646 de 2008', 'Establece disposiciones y define responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial y la determinación del origen de las patologías causadas por estrés ocupacional.'],
                        ['Resolución 652 y 1356 de 2012', 'Establecen la conformación y funcionamiento del Comité de Convivencia Laboral en entidades públicas y empresas privadas.'],
                        ['Ley 1562 de 2012', 'Modifica el Sistema General de Riesgos Laborales y define el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).'],
                        ['Decreto 1477 de 2014', 'Expide la tabla de enfermedades laborales. En el Grupo IV incluye los Trastornos Mentales y del Comportamiento derivados de agentes psicosociales: depresión, ansiedad, estrés postraumático, trastornos del sueño y síndrome de burnout.'],
                        ['Decreto 1072 de 2015', 'Decreto Único Reglamentario del Sector Trabajo. Establece las obligaciones del empleador en el SG-SST, incluyendo la gestión de los peligros psicosociales.'],
                        ['Resolución 2764 de 2022', 'Adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial y la Guía Técnica General para la promoción, prevención e intervención de los factores psicosociales. Define la periodicidad de aplicación y la obligatoriedad del SVE.'],
                    ].map(([norm, content], i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCellBold, { width: '28%' }]}>{norm}</Text>
                            <Text style={[s.tCell, { width: '72%' }]}>{content}</Text>
                        </View>
                    ))}
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ OBJETIVOS ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="III. Objetivos" />

                <Text style={s.h2}>3.1 Objetivo General</Text>
                <Text style={s.body}>
                    Este programa de vigilancia epidemiológica tiene como objetivo controlar las condiciones de trabajo y salud mediante la
                    identificación, evaluación, prevención, intervención y monitoreo de los factores de riesgo psicosocial. Las acciones buscan
                    prevenir la aparición de los efectos asociados al estrés ocupacional en los trabajadores de{' '}
                    <Text style={s.bold}>{org.name}</Text>.
                </Text>

                <Text style={s.h2}>3.2 Objetivos Específicos</Text>
                {[
                    'Brindar y estandarizar criterios para la identificación y evaluación de los factores psicosociales laborales, tanto protectores como de riesgo, así como sus potenciales efectos en la salud.',
                    'Establecer los lineamientos para identificar los grupos prioritarios de este programa de vigilancia, y para intervenirlos, con el fin de disminuir el riesgo de condiciones de salud asociadas a manifestaciones del estrés.',
                    'Definir las actividades de prevención recomendadas para fomentar en la población laboral estilos de afrontamiento adecuados para el manejo de situaciones estresantes y para la generación de comportamientos autónomos de autocuidado de la salud.',
                    'Establecer mecanismos de recolección y análisis de información que permitan orientar la toma de decisiones oportunas dentro del proceso de seguimiento y control de los agentes de riesgo, con el propósito de detectar oportunamente los casos que requieran atención.',
                    'Implementar medidas de prevención y control de los Factores de Riesgo Psicosocial a través de los diferentes subprogramas de intervención, según los resultados obtenidos en el diagnóstico, ya sea en la fuente, el medio o en los trabajadores.',
                    'Definir el procedimiento de acción en caso de presentarse una enfermedad laboral calificada originada por agentes psicosociales en el trabajo.',
                    'Definir indicadores para evaluar la gestión y el impacto que se logre en la salud individual o colectiva de los trabajadores objeto de este programa.',
                ].map((t, i) => <NumBullet key={i} n={i + 1}>{t}</NumBullet>)}

                <Text style={s.h2}>IV. Descripción del Agente de Riesgo</Text>

                <Text style={s.h3}>4.1 Definición de Factores de Riesgo Psicosocial</Text>
                <Text style={s.body}>
                    El Comité Mixto OMS–OIT define los factores de riesgo psicosocial como las interacciones entre el trabajo, su medio ambiente,
                    la satisfacción en el trabajo y las condiciones de su organización, por una parte; y por la otra, las capacidades del
                    trabajador, sus necesidades, su cultura y su situación personal fuera del trabajo, todo lo cual, a través de percepciones y
                    experiencias, puede influir en la salud, en el rendimiento y en la satisfacción en el trabajo.
                </Text>

                <Text style={s.h3}>4.2 Clasificación de los Factores Psicosociales</Text>
                <Text style={s.body}>
                    Comprenden los aspectos intralaborales, extralaborales o externos a la organización y las condiciones individuales o
                    características intrínsecas al trabajador, las cuales, en una interrelación dinámica mediante percepciones y experiencias,
                    influyen en la salud y desempeño de las personas.
                </Text>

                <Text style={s.h3}>4.2.1 Características del Individuo</Text>
                <Bullet>Información sociodemográfica (edad, sexo, estado civil, nivel educativo, estrato, personas a cargo).</Bullet>
                <Bullet>Características de personalidad (patrón conductual tipo A) y estilos de afrontamiento.</Bullet>
                <Bullet>Condiciones de salud evaluadas a través de diversos mecanismos, incluyendo los exámenes médicos ocupacionales.</Bullet>

                <Text style={s.h3}>4.2.2 Condiciones Internas de Trabajo (Intralaborales)</Text>
                <Bullet><Text style={s.bold}>Condiciones de la tarea: </Text>Demandas de carga mental, velocidad, complejidad, atención, minuciosidad, variedad y apremio de tiempo. Demandas emocionales y exigencias de responsabilidad del cargo.</Bullet>
                <Bullet><Text style={s.bold}>Gestión organizacional: </Text>Liderazgo, cambio organizacional, evaluación de desempeño, inducción, servicios de bienestar, políticas de contratación, sistemas de remuneración y capacitación.</Bullet>
                <Bullet><Text style={s.bold}>Características del grupo social de trabajo: </Text>Clima de relaciones, cohesión, calidad de las interacciones y trabajo en equipo.</Bullet>
                <Bullet><Text style={s.bold}>Interfase persona–tarea: </Text>Pertinencia del conocimiento y habilidades en relación con las demandas de la tarea, niveles de iniciativa y autonomía, reconocimiento e identificación con la organización.</Bullet>
                <Bullet><Text style={s.bold}>Jornada de trabajo: </Text>Duración de la jornada laboral, pausas, trabajo nocturno, rotación de turnos, horas extras y descansos semanales.</Bullet>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ AGENTE DE RIESGO (cont.) ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="IV. Descripción del Agente de Riesgo" />

                <Text style={s.h3}>4.2.3 Condiciones Externas al Trabajo (Extralaborales)</Text>
                <Bullet>Utilización del tiempo libre.</Bullet>
                <Bullet>Tiempo de desplazamiento y medios de transporte entre casa y trabajo y viceversa.</Bullet>
                <Bullet>Pertenencia a redes de apoyo social (familia, grupos sociales, comunitarios o de salud).</Bullet>
                <Bullet>Características de la vivienda y de su entorno.</Bullet>
                <Bullet>Acceso a servicios de salud y situación económica del grupo familiar.</Bullet>

                <Text style={s.h3}>4.3 Efectos de los Factores de Riesgo Psicosocial</Text>
                <Text style={s.body}>
                    Es importante anotar que los factores protectores crean en el trabajador sentido de crecimiento personal, identificación y
                    compromiso con la organización. Cuando los factores psicosociales son percibidos en riesgo pueden generar diversos efectos
                    según su intensidad, frecuencia de presentación y potencial dañino:
                </Text>
                <Bullet><Text style={s.bold}>Efectos fisiológicos: </Text>Malestares gastrointestinales, cardiovasculares y osteomusculares.</Bullet>
                <Bullet><Text style={s.bold}>Efectos psicológicos: </Text>Frustración, angustia, ansiedad y depresión; a nivel cognitivo, disminución de la capacidad de atención, memoria y concentración.</Bullet>
                <Bullet><Text style={s.bold}>Efectos en el comportamiento social y familiar: </Text>Posible aumento de comportamientos y consumos adictivos (alcohol, tabaco, cafeína, medicamentos).</Bullet>
                <Bullet><Text style={s.bold}>Efectos sobre el trabajo: </Text>Ausentismo, accidentalidad, rotación del personal, desmotivación, deterioro del rendimiento, aumento de conductas erráticas y clima laboral negativo.</Bullet>

                <Text style={s.h3}>4.4 Instrumento de Evaluación</Text>
                <Text style={s.body}>
                    La evaluación se realiza con la <Text style={s.bold}>Batería de Instrumentos para la Evaluación de Factores de Riesgo
                    Psicosocial</Text>, desarrollada y validada por el Ministerio de la Protección Social en conjunto con la Pontificia
                    Universidad Javeriana (2010) sobre una muestra de 2.360 trabajadores, y adoptada oficialmente mediante la Resolución 2764
                    de 2022.
                </Text>

                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '34%' }]}>Instrumento</Text>
                        <Text style={[s.tHead, { width: '30%' }]}>Población</Text>
                        <Text style={[s.tHead, { width: '14%', textAlign: 'center' }]}>Ítems</Text>
                        <Text style={[s.tHead, { width: '22%', textAlign: 'center' }]}>Duración</Text>
                    </View>
                    {[
                        ['Intralaboral Forma A', 'Jefaturas, profesionales o técnicos', '123', '~28 min'],
                        ['Intralaboral Forma B', 'Cargos auxiliares u operarios', '97', '~33 min'],
                        ['Extralaboral', 'Toda la población trabajadora', '31', '~15 min'],
                        ['Evaluación del Estrés (3.ª v.)', 'Toda la población trabajadora', '31', '~7 min'],
                        ['Ficha de Datos Generales', 'Toda la población trabajadora', '—', '~5 min'],
                    ].map((r, i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCellBold, { width: '34%' }]}>{r[0]}</Text>
                            <Text style={[s.tCell, { width: '30%' }]}>{r[1]}</Text>
                            <Text style={[s.tCell, { width: '14%', textAlign: 'center' }]}>{r[2]}</Text>
                            <Text style={[s.tCell, { width: '22%', textAlign: 'center' }]}>{r[3]}</Text>
                        </View>
                    ))}
                </View>

                <Text style={s.h3}>Dominios y dimensiones evaluadas (Intralaboral)</Text>
                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '32%' }]}>Dominio</Text>
                        <Text style={[s.tHead, { width: '68%' }]}>Dimensiones</Text>
                    </View>
                    {[
                        ['Demandas del trabajo', 'Demandas cuantitativas · Carga mental · Demandas emocionales · Exigencias de responsabilidad del cargo · Demandas ambientales y de esfuerzo físico · Demandas de la jornada · Consistencia de rol · Influencia del trabajo sobre el entorno extralaboral'],
                        ['Control sobre el trabajo', 'Control y autonomía · Oportunidades de desarrollo y uso de habilidades · Participación y manejo del cambio · Claridad de rol · Capacitación'],
                        ['Liderazgo y relaciones sociales', 'Características del liderazgo · Relaciones sociales en el trabajo · Retroalimentación del desempeño · Relación con los colaboradores'],
                        ['Recompensa', 'Reconocimiento y compensación · Recompensas derivadas de la pertenencia a la organización y del trabajo que se realiza'],
                    ].map((r, i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCellBold, { width: '32%' }]}>{r[0]}</Text>
                            <Text style={[s.tCell, { width: '68%' }]}>{r[1]}</Text>
                        </View>
                    ))}
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ DESCRIPCIÓN DE LA EMPRESA + DEMOGRAFÍA ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="V. Descripción de la Empresa" />

                <View style={s.table}>
                    {[
                        ['Razón social', org.name],
                        ['NIT', org.nit],
                        ['Trabajadores evaluados', String(summary.uniqueWorkers)],
                        ['Evaluaciones aplicadas', `${summary.totalAssessments} — Intra A: ${summary.intraA} · Intra B: ${summary.intraB} · Extralaboral: ${summary.extra} · Estrés: ${summary.stress}`],
                        ['Período de evaluación', `${org.dateStart} — ${org.dateEnd}`],
                        ['Áreas evaluadas', areas.length > 0 ? areas.map(a => a.name).join(', ') : 'No especificado'],
                        ['Psicólogo(a) responsable', `${org.psychologistName} — Lic. SST ${org.psychologistLicense}`],
                    ].map((r, i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCellBold, { width: '32%', backgroundColor: C.borderLight }]}>{r[0]}</Text>
                            <Text style={[s.tCell, { width: '68%' }]}>{r[1]}</Text>
                        </View>
                    ))}
                </View>

                <Text style={s.h2}>5.1 Descripción Demográfica</Text>
                <Text style={s.body}>
                    A continuación se presenta la caracterización sociodemográfica de la población trabajadora evaluada, obtenida a partir de
                    la Ficha de Datos Generales de la Batería de Instrumentos.
                </Text>

                <DemoTable title="Distribución por sexo" rows={demographics.gender} />
                <DemoTable title="Distribución por rango de edad" rows={demographics.ageRanges} />
                <DemoTable title="Distribución por nivel educativo" rows={demographics.education} />

                <PageFooter label={footerLabel} />
            </Page>

            <Page size="A4" style={s.page}>
                <Header title="V. Descripción de la Empresa" />

                <DemoTable title="Distribución por estado civil" rows={demographics.maritalStatus} />
                <DemoTable title="Distribución por antigüedad en la empresa" rows={demographics.seniority} />

                <Text style={s.h2}>5.2 Horarios, Turnos y Aspectos Laborales</Text>

                <DemoTable title="Tipo de contratación" rows={demographics.contractType} />
                <DemoTable title="Jornada / horario de trabajo" rows={demographics.workSchedule} />

                <Text style={s.body}>
                    Los beneficios adicionales a los de ley (salarios, cesantías, vacaciones, dotación, caja de compensación y vinculación al
                    sistema de seguridad social) que la organización otorgue a sus trabajadores —tales como brigadas de salud, jornadas
                    deportivas, pausas activas, celebraciones de fechas especiales, capacitaciones e integraciones— se constituyen, desde el
                    enfoque de la prevención de factores de riesgo psicosocial, en aspectos protectores en pro del bienestar y la salud física
                    y mental de los trabajadores.
                </Text>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ METODOLOGÍA ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="VI. Metodología del Programa" />

                <Text style={s.h3}>6.1 Universo de Trabajo y Alcance</Text>
                <Text style={s.body}>
                    El programa de vigilancia epidemiológica para la prevención y control de los factores de riesgo psicosocial cubre a todos
                    los trabajadores directos de <Text style={s.bold}>{org.name}</Text>, con diferentes alcances en el abordaje de cada grupo.
                    Las intervenciones se implementan prioritariamente en aquellas áreas, grupos o tareas en que los factores de riesgo sean
                    identificados y percibidos con riesgo Alto y Muy Alto.
                </Text>
                <Text style={s.body}>
                    Para el personal nuevo no contemplado dentro del presente cronograma se tendrá en cuenta en las valoraciones definidas para
                    cada año, con el requisito de inclusión de llevar más de seis meses laborando para la empresa, tiempo prudente para contar
                    con criterios de valoración de las condiciones internas de trabajo.
                </Text>

                <Text style={s.h3}>6.2 Enfoque del Programa</Text>
                <Text style={s.body}>
                    El propósito de la vigilancia epidemiológica de los factores de riesgo psicosocial se sitúa en el contexto de la prevención,
                    fundamentalmente la prevención primaria, orientada por las políticas de salud y seguridad y el control en la fuente de los
                    factores de riesgo. Se considera ideal el enfoque que vigila la presentación del factor de riesgo para prevenir la ocurrencia
                    de patologías, por cuanto ayuda a prevenir y no espera la ocurrencia de "casos" para registrarlos y actuar sobre ellos.
                </Text>

                <Text style={s.h3}>6.3 Fases del Programa de Vigilancia Epidemiológica</Text>
                {[
                    ['Fase de Información Preliminar', 'Identificación de las necesidades de la empresa en relación con el diseño e implementación del sistema, mediante la revisión inicial de la matriz de requisitos legales a nivel psicosocial propuesta por la ARL a la que se encuentra afiliada la empresa.'],
                    ['Fase de Identificación y Evaluación', 'Identificación y valoración de los factores de riesgo psicosocial (vigilancia del factor de riesgo) y de sus efectos en la salud de las personas (vigilancia de la salud), mediante la aplicación de la Batería de Instrumentos, el análisis psicosocial de puestos de trabajo y la medición de condiciones de salud.'],
                    ['Fase de Análisis de la Información', 'Identificación de áreas, ocupaciones y personas con mayor exposición a los factores de riesgo psicosocial y con mayores efectos, para establecer hipótesis explicativas de los hallazgos y definir prioridades de atención. Incluye tabulación, codificación y análisis estadístico, y la clasificación en grupos de intervención A, B, C y D.'],
                    ['Fase de Toma de Decisiones e Implementación', 'Prevención y control de los factores de riesgo y de sus efectos, así como la promoción de la salud. Se implementan acciones generales de prevención primaria de acuerdo con el análisis de información, que cubren a toda la población, y acciones específicas según el grupo de intervención.'],
                    ['Fase de Evaluación de Resultados', 'Conocimiento del impacto de las intervenciones y realización de los ajustes necesarios. Se propone su ejecución para cada actividad y un consolidado general cada año, difundido a la alta dirección y a los responsables de cada actividad.'],
                ].map(([title, desc], i) => (
                    <View key={i} style={s.bullet}>
                        <Text style={s.bulletDot}>{i + 1}.</Text>
                        <Text style={s.bulletText}>
                            <Text style={s.bold}>{title}: </Text>{desc}
                        </Text>
                    </View>
                ))}

                <Text style={s.h3}>6.4 Análisis Psicosocial del Puesto de Trabajo (APPT)</Text>
                <Text style={s.body}>
                    Corresponde a la <Text style={s.bold}>evaluación objetiva</Text> del riesgo. Su objetivo es recoger en forma sistemática y
                    objetiva la información relativa al cargo y a los factores de riesgo psicosocial presentes en el puesto de trabajo,
                    considerando la validación de la información por el personal del área. Debe realizarse por un psicólogo especialista en
                    seguridad y salud en el trabajo con licencia vigente en prestación de servicios de Psicología Ocupacional.
                </Text>
                <Text style={s.body}>
                    El APPT valora a profundidad el dominio <Text style={s.bold}>Demandas del trabajo</Text>, compuesto por las dimensiones:
                    demandas cuantitativas, demandas de carga mental, demandas emocionales, exigencias de responsabilidad del cargo, demandas
                    ambientales y de esfuerzo físico, demandas de la jornada de trabajo y consistencia del rol. La duración promedio de cada
                    observación/entrevista, en el caso de evaluar las siete dimensiones, es de 90 a 120 minutos.
                </Text>
                <Text style={s.h3}>Requisitos del APPT</Text>
                <Bullet>Debe realizarse en momentos que muestren la dinámica habitual del puesto que va a estudiarse.</Bullet>
                <Bullet>Debe seguir un método estandarizado que permita tomar la misma información por diferentes evaluadores y de varias fuentes.</Bullet>
                <Bullet>Debe reconocer únicamente las condiciones contenidas en las guías específicas por dimensiones de la Batería de Evaluación.</Bullet>
                <Bullet>Las condiciones son de carácter exclusivo: deben identificarse cada una por separado, evitando explicar unas a partir de otras.</Bullet>
                <Text style={s.body}>
                    <Text style={s.bold}>Frecuencia de aplicación: </Text>
                    Se realiza para cargos tipo, priorizando los puestos donde los instrumentos subjetivos hayan arrojado puntajes Alto y Muy
                    Alto, o los puestos de las personas ubicadas dentro del grupo de prioridad de intervención (Grupo D). Igualmente, cuando se
                    realice análisis de puesto de trabajo para calificar el origen del estrés como enfermedad laboral, o cuando se requiera un
                    proceso de reubicación laboral.
                </Text>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ RESULTADOS ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="VII. Resultados del Diagnóstico" />

                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{summary.uniqueWorkers}</Text>
                        <Text style={s.kpiLabel}>Trabajadores evaluados</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{summary.totalAssessments}</Text>
                        <Text style={s.kpiLabel}>Evaluaciones aplicadas</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{groups.d}</Text>
                        <Text style={s.kpiLabel}>Prioridad intervención</Text>
                    </View>
                    <View style={[s.kpiCard, { backgroundColor: summary.criticalPercent > 30 ? C.redBg : summary.criticalPercent > 15 ? C.orangeBg : C.greenBg }]}>
                        <Text style={[s.kpiValue, { color: summary.criticalPercent > 30 ? C.redText : summary.criticalPercent > 15 ? C.orangeText : C.greenText }]}>
                            {summary.criticalPercent}%
                        </Text>
                        <Text style={s.kpiLabel}>Zona crítica</Text>
                    </View>
                </View>

                <Text style={s.h3}>7.1 Perfil General de Riesgo</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                    <View style={s.distBox}>
                        <Text style={s.distTitle}>Intralaboral (N={summary.intraA + summary.intraB})</Text>
                        <DistBars dist={distributions.intra} />
                    </View>
                    <View style={s.distBox}>
                        <Text style={s.distTitle}>Extralaboral (N={summary.extra})</Text>
                        <DistBars dist={distributions.extra} />
                    </View>
                    <View style={s.distBox}>
                        <Text style={s.distTitle}>Estrés (N={summary.stress})</Text>
                        <DistBars dist={distributions.stress} />
                    </View>
                </View>

                <Text style={s.h3}>7.2 Correlación de Resultados — Grupos de Intervención</Text>
                <Text style={s.body}>
                    Correlacionando los resultados de la evaluación subjetiva del estrés con la evaluación subjetiva de los factores de riesgo
                    psicosocial intralaboral, los trabajadores evaluados se clasifican en cuatro grupos que determinan la prioridad de intervención:
                </Text>

                <View style={s.matrixGrid}>
                    {[
                        { key: 'a', label: 'Grupo 1A', name: 'Sanos', n: groups.a, bg: C.greenBg, bd: C.green, tx: C.greenText, sub: 'Riesgo intralaboral bajo/medio + Estrés bajo/medio.' },
                        { key: 'b', label: 'Grupo 1B', name: 'Vulnerables', n: groups.b, bg: C.orangeBg, bd: C.orange, tx: C.orangeText, sub: 'Riesgo intralaboral bajo/medio + Estrés alto/muy alto.' },
                        { key: 'c', label: 'Grupo 1C', name: 'Adaptados', n: groups.c, bg: C.blueBg, bd: C.blue, tx: C.blueText, sub: 'Riesgo intralaboral alto/muy alto + Estrés bajo/medio.' },
                        { key: 'd', label: 'Grupo 1D', name: 'Prioridad de Intervención', n: groups.d, bg: C.redBg, bd: C.red, tx: C.redText, sub: 'Riesgo intralaboral alto/muy alto + Estrés alto/muy alto. Requiere atención inmediata.' },
                    ].map(g => (
                        <View key={g.key} style={[s.matrixBox, { backgroundColor: g.bg, borderColor: g.bd }]}>
                            <Text style={[s.matrixLabel, { color: g.tx }]}>{g.label}</Text>
                            <Text style={s.matrixName}>{g.name}</Text>
                            <Text style={[s.matrixNum, { color: g.tx }]}>{g.n}</Text>
                            <Text style={s.matrixSub}>{g.sub}</Text>
                        </View>
                    ))}
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ DIMENSIONES CRÍTICAS + ÁREAS ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="VII. Resultados del Diagnóstico" />

                <Text style={s.h3}>7.3 Dimensiones en Riesgo Crítico</Text>
                {criticalDimensions.length > 0 ? (
                    <>
                        <Text style={s.body}>
                            Dimensiones con mayor proporción de trabajadores en nivel Alto o Muy Alto. Estas constituyen los focos prioritarios
                            de intervención en la fuente y en el medio.
                        </Text>
                        <View style={s.table}>
                            <View style={s.tRow}>
                                <Text style={[s.tHead, { width: '44%' }]}>Dimensión</Text>
                                <Text style={[s.tHead, { width: '20%' }]}>Cuestionario</Text>
                                <Text style={[s.tHead, { width: '18%', textAlign: 'center' }]}>Puntaje prom.</Text>
                                <Text style={[s.tHead, { width: '18%', textAlign: 'center' }]}>% Crítico</Text>
                            </View>
                            {criticalDimensions.slice(0, 15).map((d, i, arr) => (
                                <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                                    <Text style={[s.tCellBold, { width: '44%' }]}>{d.name}</Text>
                                    <Text style={[s.tCell, { width: '20%' }]}>{d.questionnaire}</Text>
                                    <Text style={[s.tCell, { width: '18%', textAlign: 'center' }]}>{d.avgScore.toFixed(1)}%</Text>
                                    <Text style={[s.tCellBold, { width: '18%', textAlign: 'center', color: d.criticalPercent > 30 ? C.redText : d.criticalPercent > 15 ? C.orangeText : C.textMuted }]}>
                                        {d.criticalPercent}%
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </>
                ) : (
                    <Text style={s.body}>No se identificaron dimensiones en nivel de riesgo Alto o Muy Alto en la población evaluada.</Text>
                )}

                <Text style={s.h3}>7.4 Análisis por Áreas de Trabajo</Text>
                {areas.length > 0 ? (
                    <View style={s.table}>
                        <View style={s.tRow}>
                            <Text style={[s.tHead, { width: '38%' }]}>Área / Departamento</Text>
                            <Text style={[s.tHead, { width: '12%', textAlign: 'center' }]}>N</Text>
                            <Text style={[s.tHead, { width: '50%' }]}>Distribución de riesgo (Sin/Bajo/Medio/Alto/Muy Alto)</Text>
                        </View>
                        {areas.map((a, i, arr) => (
                            <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                                <Text style={[s.tCellBold, { width: '38%' }]}>{a.name}</Text>
                                <Text style={[s.tCell, { width: '12%', textAlign: 'center' }]}>{a.count}</Text>
                                <Text style={[s.tCell, { width: '50%' }]}>
                                    {a.dist.SIN_RIESGO}% · {a.dist.BAJO}% · {a.dist.MEDIO}% · {a.dist.ALTO}% · {a.dist.MUY_ALTO}%
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={s.body}>No se registró información de áreas o departamentos para la población evaluada.</Text>
                )}

                <View style={[s.alert, { backgroundColor: C.primaryBg, borderLeftColor: C.primaryLight }]}>
                    <Text style={[s.alertText, { color: C.primary }]}>
                        <Text style={s.bold}>Custodia de datos: </Text>
                        Los resultados aquí presentados son estrictamente estadísticos y no permiten la identificación individual de los
                        trabajadores, garantizando el anonimato conforme a la Ley 1090 de 2006 y a los criterios de reserva de la historia clínica.
                    </Text>
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ NIVELES DE INTERVENCIÓN ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="VIII. Niveles de Intervención" />

                <Text style={s.h3}>8.1 Intervención Primaria: Promoción y Prevención</Text>
                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '18%' }]}>Nivel</Text>
                        <Text style={[s.tHead, { width: '27%' }]}>Dirigido a</Text>
                        <Text style={[s.tHead, { width: '55%' }]}>Actividades</Text>
                    </View>
                    <View style={s.tRowLast}>
                        <Text style={[s.tCellBold, { width: '18%' }]}>Primaria</Text>
                        <Text style={[s.tCell, { width: '27%' }]}>Toda la población de la empresa ({summary.uniqueWorkers} trabajadores)</Text>
                        <Text style={[s.tCell, { width: '55%' }]}>
                            • Elaboración y difusión de material audiovisual que apoye el control del factor de riesgo.{'\n'}
                            • Campañas y sensibilización en fortalecimiento de ambientes de trabajo favorables y estilos de vida saludables.{'\n'}
                            • Capacitaciones en control de riesgo psicosocial, estilos de afrontamiento y manejo del estrés.{'\n'}
                            • Prevención del consumo de sustancias psicoactivas y otras adicciones.{'\n'}
                            • Fortalecimiento del clima organizacional.{'\n'}
                            • Medidas de prevención del acoso laboral: política, código de convivencia, funcionamiento del Comité de Convivencia Laboral.{'\n'}
                            • Asesorías de intervención en crisis en caso de ser requerido.
                        </Text>
                    </View>
                </View>

                <Text style={s.h3}>8.2 Intervención Secundaria y Terciaria</Text>
                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '18%' }]}>Nivel</Text>
                        <Text style={[s.tHead, { width: '27%' }]}>Dirigido a</Text>
                        <Text style={[s.tHead, { width: '55%' }]}>Actividades</Text>
                    </View>
                    <View style={s.tRow}>
                        <Text style={[s.tCellBold, { width: '18%' }]}>Secundaria</Text>
                        <Text style={[s.tCell, { width: '27%' }]}>Trabajadores de los Grupos B y D, y remitidos por las EPS con diagnósticos asociados a factores de riesgo psicosocial de origen común</Text>
                        <Text style={[s.tCell, { width: '55%' }]}>
                            • Diagnóstico de condiciones de trabajo.{'\n'}
                            • Estudios de puesto de trabajo para definir mecanismos de cumplimiento de restricciones o necesidad de reubicación.{'\n'}
                            • Seguimiento y control del trabajador para asegurar el manejo asistencial requerido.{'\n'}
                            • Seguimiento de las recomendaciones propuestas por la EPS y por el estudio de puesto de trabajo.{'\n'}
                            • Retroalimentación individual y conducta a seguir según resultado específico.{'\n'}
                            • Análisis Psicosocial de Puestos de Trabajo (APPT) para los cargos con mayores percepciones de riesgo alto y muy alto.{'\n'}
                            • Asesorías psicológicas a los casos que lo ameriten.
                        </Text>
                    </View>
                    <View style={s.tRowLast}>
                        <Text style={[s.tCellBold, { width: '18%' }]}>Terciaria</Text>
                        <Text style={[s.tCell, { width: '27%' }]}>"Casos": trabajadores con patologías derivadas del estrés ya diagnosticadas y reconocidas por la ARL o las Juntas de Calificación como de origen laboral</Text>
                        <Text style={[s.tCell, { width: '55%' }]}>
                            • Estudios de puesto de trabajo donde se identifique la pauta a seguir, ya sea de reubicación o readaptación (APPT).{'\n'}
                            • Rehabilitación psicosocial al trabajador.{'\n'}
                            • Seguimiento y control del trabajador para asegurar el tratamiento requerido por parte de la ARL.{'\n'}
                            • Seguimiento de las recomendaciones del estudio de puesto de trabajo.
                        </Text>
                    </View>
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ CONDUCTAS POR GRUPO ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="VIII. Niveles de Intervención" />

                <Text style={s.h3}>8.3 Conductas a Seguir por Grupo de Intervención</Text>
                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '17%' }]}>Grupo</Text>
                        <Text style={[s.tHead, { width: '26%' }]}>Clasificación del nivel</Text>
                        <Text style={[s.tHead, { width: '57%' }]}>Conductas a seguir</Text>
                    </View>

                    <View style={s.tRow}>
                        <Text style={[s.tCellBold, { width: '17%' }]}>A — Sanos{'\n'}(N={groups.a})</Text>
                        <Text style={[s.tCell, { width: '26%' }]}>FRP intralaboral medio, bajo o sin riesgo. Estrés medio, bajo o sin riesgo.</Text>
                        <Text style={[s.tCell, { width: '57%' }]}>
                            • Retest bianual para condiciones de salud por autorreporte.{'\n'}
                            • Inclusión en los procesos generales de capacitación y promoción de la salud.{'\n'}
                            • Fortalecimiento de los factores protectores identificados.
                        </Text>
                    </View>

                    <View style={s.tRow}>
                        <Text style={[s.tCellBold, { width: '17%' }]}>B — Vulnerables{'\n'}(N={groups.b})</Text>
                        <Text style={[s.tCell, { width: '26%' }]}>FRP intralaboral medio, bajo o sin riesgo. Estrés alto o muy alto.</Text>
                        <Text style={[s.tCell, { width: '57%' }]}>
                            • Retroalimentación individual de resultados de la escala de estrés.{'\n'}
                            • Asesoría psicológica grupal inicial con sugerencias puntuales para el manejo de situaciones estresantes.{'\n'}
                            • Indagar posibles fuentes específicas de estrés, incluyendo análisis adicionales que permitan identificar significancia estadística con las demás variables estudiadas.{'\n'}
                            • Retest anual para escala de estrés y FRP.{'\n'}
                            • Inclusión en programas de capacitación en manejo de estrés y estilos de afrontamiento, incluyendo entrenamiento específico en técnicas de relajación.
                        </Text>
                    </View>

                    <View style={s.tRow}>
                        <Text style={[s.tCellBold, { width: '17%' }]}>C — Adaptados{'\n'}(N={groups.c})</Text>
                        <Text style={[s.tCell, { width: '26%' }]}>FRP intralaboral alto o muy alto. Estrés medio, bajo o sin riesgo.</Text>
                        <Text style={[s.tCell, { width: '57%' }]}>
                            • Retroalimentación de resultados sobre condiciones de salud a los trabajadores que puntúen alto.{'\n'}
                            • Retroalimentación al grupo directivo (jefes de área) de resultados generales de condiciones de trabajo y salud.{'\n'}
                            • Análisis Psicosocial del Puesto de Trabajo (APPT) de los cargos que puntuaron con FRP intralaboral alto o muy alto, posterior a los programados para el Grupo D.{'\n'}
                            • Asesoría psicológica inicial con sugerencias puntuales para enfrentar situaciones a nivel laboral.{'\n'}
                            • Retest bianual para condiciones de salud por autorreporte.
                        </Text>
                    </View>

                    <View style={s.tRowLast}>
                        <Text style={[s.tCellBold, { width: '17%', color: C.redText }]}>D — Prioridad de intervención{'\n'}(N={groups.d})</Text>
                        <Text style={[s.tCell, { width: '26%' }]}>FRP intralaboral alto o muy alto. Estrés alto o muy alto.</Text>
                        <Text style={[s.tCell, { width: '57%' }]}>
                            • Retroalimentación individual de resultados de FRP y estrés con recomendaciones específicas para cada caso, tanto para la empresa como para el trabajador.{'\n'}
                            • APPT objetivo de todos los cargos incluidos en este grupo.{'\n'}
                            • Asesoría psicológica inicial a cada caso con sugerencias puntuales para enfrentar situaciones a nivel laboral.{'\n'}
                            • Seguimiento según resultado de la asesoría psicológica inicial, con un máximo de 3 seguimientos.{'\n'}
                            • Remisión a EPS de acuerdo con criterio profesional del psicólogo y evaluación por médico de salud ocupacional para casos que continúen requiriendo intervención.{'\n'}
                            • Capacitación en manejo de estrés y estilos de afrontamiento, incluyendo técnicas de relajación.{'\n'}
                            • Análisis de accidentalidad y ausentismo de los trabajadores con puntuaciones máximas.{'\n'}
                            • Retest anual para FRP y escala de estrés.
                        </Text>
                    </View>
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ PLAN DE INTERVENCIÓN ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="IX. Plan de Intervención General" />
                <Text style={s.body}>
                    Cronograma de actividades de intervención general que cubren a toda la población trabajadora, con los responsables
                    asignados dentro de la organización.
                </Text>

                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '6%', textAlign: 'center' }]}>#</Text>
                        <Text style={[s.tHead, { width: '34%' }]}>Tema / Actividad</Text>
                        <Text style={[s.tHead, { width: '26%' }]}>Responsable</Text>
                        <Text style={[s.tHead, { width: '34%' }]}>Observación</Text>
                    </View>
                    {[
                        ['Selección de Personal', 'Talento Humano, SST', 'Revisión y ajuste del proceso de selección.'],
                        ['Gestión del Desempeño', 'Talento Humano, SST', 'Revisión del plan de incentivos y canales comunicativos.'],
                        ['Incentivos', 'Talento Humano, Bienestar', 'Programa y divulgación de los mismos.'],
                        ['Gestión por Competencias', 'Talento Humano, SST', 'Empoderamiento, rotación del personal, cambio de roles.'],
                        ['Inducción y Entrenamiento', 'Talento Humano, SST', 'Revisión y ajuste del programa.'],
                        ['Formación, Capacitación y Bienestar', 'Talento Humano, Bienestar', 'Programas interempresariales con vinculación de familias (SENA, corporaciones, fundaciones).'],
                        ['Sucesión y Plan de Carrera', 'Talento Humano', 'Programa de crecimiento de carrera y reconocimientos.'],
                        ['Gestión del Cambio', 'Talento Humano, SST', 'Taller de empoderamiento en la gestión del cambio.'],
                        ['Gestión del Conocimiento', 'Talento Humano', 'Plan de capacitación en el perfil ocupacional u operacional.'],
                        ['Comunicaciones Internas', 'Talento Humano, SST', 'Programa y canales comunicativos.'],
                        ['Gestión del Clima y la Cultura', 'Talento Humano, SST', 'Aplicación, evaluación, seguimiento y campañas.'],
                        ['Seguridad y Salud en el Trabajo', 'SST', 'Revisión y ajustes al SG-SST.'],
                        ['Prevención de Consumo de Alcohol y SPA', 'Talento Humano, SST', 'Programa, política, campañas y divulgación.'],
                        ['Prevención del Riesgo Público', 'SST', 'Capacitaciones.'],
                        ['Convivencia Laboral', 'Comité de Convivencia, SST', 'Talleres de comunicación asertiva y resolución de conflictos.'],
                        ['Escuela de Líderes', 'Talento Humano, Bienestar', 'Desarrollo de competencias en estilos de liderazgo y liderazgo personal.'],
                        ['Calidad de Vida', 'Bienestar Laboral', 'Taller y programa.'],
                        ['Promoción de la Resiliencia', 'Talento Humano, Bienestar', 'Talleres.'],
                        ['Programa de Salud Mental', 'SST, Bienestar', 'Talleres y seguimiento psicológico.'],
                        ['Taller de Inteligencia Emocional', 'Talento Humano, Bienestar', 'Talleres.'],
                        ['Administración del Tiempo y Tiempo Libre', 'Talento Humano, Bienestar', 'Talleres.'],
                        ['Manejo de la Economía Familiar', 'Talento Humano, Bienestar', 'Talleres de inteligencia financiera.'],
                    ].map((r, i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCell, { width: '6%', textAlign: 'center' }]}>{i + 1}</Text>
                            <Text style={[s.tCellBold, { width: '34%' }]}>{r[0]}</Text>
                            <Text style={[s.tCell, { width: '26%' }]}>{r[1]}</Text>
                            <Text style={[s.tCell, { width: '34%' }]}>{r[2]}</Text>
                        </View>
                    ))}
                </View>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ INDICADORES ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="X. Indicadores del Programa" />
                <Text style={s.body}>
                    Los siguientes indicadores permiten evaluar la gestión y el impacto del Programa de Vigilancia Epidemiológica. El informe
                    generado debe ser difundido a la alta dirección, a los implicados de cada actividad y al responsable del SG-SST.
                </Text>

                <View style={s.table}>
                    <View style={s.tRow}>
                        <Text style={[s.tHead, { width: '26%' }]}>Objetivo</Text>
                        <Text style={[s.tHead, { width: '13%' }]}>Tipo</Text>
                        <Text style={[s.tHead, { width: '22%' }]}>Indicador</Text>
                        <Text style={[s.tHead, { width: '27%' }]}>Fórmula</Text>
                        <Text style={[s.tHead, { width: '12%', textAlign: 'center' }]}>Frec.</Text>
                    </View>
                    {[
                        ['Identificar los factores de riesgo psicosocial y los factores protectores', 'Ejecución', '% de encuestas aplicadas', 'N.º encuestas aplicadas × 100 / N.º población definida', 'Anual'],
                        ['Evaluar y analizar los factores de riesgo psicosocial', 'Ejecución', '% de encuestas evaluadas y analizadas', 'N.º encuestas analizadas × 100 / N.º encuestas aplicadas', 'Anual'],
                        ['Clasificar la población por grupos de intervención', 'Ejecución', 'Resultado por grupos A, B, C, D', 'N.º encuestas ubicadas por grupo × 100 / N.º encuestas analizadas', 'Anual'],
                        ['Realizar intervenciones en grupos priorizados', 'Ejecución', 'N.º de actividades de intervención para grupos prioritarios', 'N.º actividades realizadas para grupos B y D × 100 / N.º programadas', 'Anual'],
                        ['Detectar casos nuevos', 'Incidencia', '% de casos nuevos en grupos B y D', 'Total casos nuevos grupos B y D × 100 / N.º total de la población', 'Anual'],
                        ['Fomentar estilos de afrontamiento adecuados', 'Ejecución', '% de actividades desarrolladas (asesorías y capacitación)', 'Total actividades desarrolladas × 100 / Total actividades programadas', 'Anual'],
                        ['Medir prevalencia de exposición al riesgo alto', 'Prevalencia', '% de ambientes con FRP alto', 'N.º ambientes con FRP alto × 100 / Total ambientes evaluados', 'Anual'],
                        ['Medir el impacto de la intervención sobre el ambiente', 'Impacto', '% de ambientes con FRP alto luego de intervención', 'N.º ambientes con FRP alto post-intervención × 100 / N.º total ambientes con FRP alto', 'Anual'],
                    ].map((r, i, arr) => (
                        <View key={i} style={i === arr.length - 1 ? s.tRowLast : s.tRow}>
                            <Text style={[s.tCell, { width: '26%' }]}>{r[0]}</Text>
                            <Text style={[s.tCellBold, { width: '13%' }]}>{r[1]}</Text>
                            <Text style={[s.tCell, { width: '22%' }]}>{r[2]}</Text>
                            <Text style={[s.tCell, { width: '27%', fontSize: 7.5 }]}>{r[3]}</Text>
                            <Text style={[s.tCell, { width: '12%', textAlign: 'center' }]}>{r[4]}</Text>
                        </View>
                    ))}
                </View>

                <Text style={s.h2}>XI. Control de Documentación</Text>
                <Text style={s.body}>
                    La información resultante de la aplicación del programa de vigilancia debe manejarse según los parámetros de los
                    procedimientos de control de documentos y registros de <Text style={s.bold}>{org.name}</Text>. Debe considerarse en especial:
                </Text>
                <Bullet>
                    Los registros médicos y las historias psicológicas completas —incluyendo los cuestionarios diligenciados y los informes de
                    resultados individuales— están sometidos a los criterios de confidencialidad, reserva y custodia de las historias clínicas.
                </Bullet>
                <Bullet>
                    Deben mantenerse en los archivos de la empresa durante <Text style={s.bold}>20 años después del retiro del trabajador</Text>,
                    ya sea en medio magnético o físico, bajo la responsabilidad de reserva y custodia por parte del Médico y/o Psicólogo
                    Especialista en Seguridad y Salud en el Trabajo que el empleador disponga para tal fin.
                </Bullet>
                <Bullet>
                    Todo informe consolidado que incluya información individual está sometido a reserva médica y se considera confidencial.
                    Su uso se limita a fines médicos de prevención y control.
                </Bullet>
                <Bullet>
                    El acceso a la plataforma y a los resultados individuales debe estar restringido al profesional responsable, garantizando
                    la trazabilidad de las consultas mediante registros de auditoría.
                </Bullet>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ RECURSOS + RESPONSABILIDADES ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="XII. Recursos y XIII. Responsabilidades" />

                <Text style={s.h2}>XII. Recursos Necesarios</Text>
                <Text style={s.h3}>Recursos Humanos</Text>
                <Bullet>Cargo de Responsable del SG-SST, como administrador de los esfuerzos de gestión del sistema.</Bullet>
                <Bullet>Psicólogo(a) especializado(a) en Seguridad y Salud en el Trabajo, con licencia vigente, que dirige y orienta los procesos de diagnóstico e intervención del riesgo.</Bullet>
                <Bullet>Psicólogos para la ejecución de actividades específicas, bajo la asesoría técnica del psicólogo especialista.</Bullet>
                <Bullet>Soporte del área de Gestión Humana, dado que muchas de las actividades de diagnóstico, intervención y control requieren ser apalancadas desde esta gerencia.</Bullet>

                <Text style={s.h3}>Recursos Técnicos y Científicos</Text>
                <Bullet>Equipos de cómputo y software para el manejo de la información del sistema (plataforma PsicoSST).</Bullet>
                <Bullet>Formatos de las pruebas psicológicas establecidas para el diagnóstico.</Bullet>
                <Bullet>Salones y ayudas audiovisuales necesarias para realizar las actividades de entrenamiento y sensibilización definidas.</Bullet>
                <Bullet>Consultorio dotado para realizar las evaluaciones médicas y psicológicas requeridas.</Bullet>

                <Text style={s.h3}>Recursos Financieros</Text>
                <Text style={s.body}>
                    Dentro del presupuesto general para el desarrollo del programa de salud ocupacional se han definido recursos específicos
                    para el desarrollo y mantenimiento del sistema de vigilancia para control de factores de riesgo psicosociales, incluyendo
                    los elementos que se han descrito en el presente documento.
                </Text>

                <Text style={s.h2}>XIII. Responsabilidades</Text>

                <Text style={s.h3}>Gerencia, Grupo Directivo y Jefes de Área</Text>
                <Bullet>Proveer los recursos necesarios para el adecuado funcionamiento del PVE.</Bullet>
                <Bullet>Facilitar la obtención de información requerida para el mantenimiento del PVE.</Bullet>
                <Bullet>Facilitar la participación de los trabajadores en las actividades establecidas.</Bullet>
                <Bullet>Asignar el recurso humano especializado responsable del desarrollo y mantenimiento del programa.</Bullet>
                <Bullet>Identificar y remitir a Gestión Humana a aquellos trabajadores con cambios de conducta o comportamiento para su valoración y estudio.</Bullet>

                <Text style={s.h3}>Responsable del SG-SST y Psicólogo(a) Especialista</Text>
                <Bullet>Participar en el diseño y aplicación de alternativas de control para factores de riesgo psicosocial.</Bullet>
                <Bullet>Integrar las actividades del SG-SST y el presente Programa de Vigilancia, según los principios de gestión establecidos en la empresa.</Bullet>
                <Bullet>Asegurar canales de comunicación en ambas vías para la difusión de los hallazgos y medidas resultantes de la aplicación del programa.</Bullet>
                <Bullet>Asegurar la investigación y el seguimiento de los casos identificados dentro del programa, ya sea como de alto riesgo a desarrollar alteraciones, con altas calificaciones de estrés, ansiedad o depresión, o con patologías en las que se describe relación con estrés.</Bullet>

                <Text style={s.h3}>Trabajadores</Text>
                <Bullet>Informar oportunamente al área de Seguridad y Salud en el Trabajo sobre cambios de condiciones o conductas de trabajo que puedan generar efectos psicosociales dañinos.</Bullet>
                <Bullet>Participar en las actividades y seguir las indicaciones del Programa de Vigilancia, para lograr un adecuado control de los riesgos.</Bullet>
                <Bullet>Procurar e incorporar en el comportamiento diario conductas de autocuidado difundidas en los programas de capacitación y entrenamiento.</Bullet>

                <PageFooter label={footerLabel} />
            </Page>

            {/* ═══ CONCLUSIONES + BIBLIOGRAFÍA + FIRMA ═══ */}
            <Page size="A4" style={s.page}>
                <Header title="XIV. Conclusiones" />

                <Bullet>
                    Se evaluaron <Text style={s.bold}>{summary.uniqueWorkers} trabajadores</Text> de la empresa{' '}
                    <Text style={s.bold}>{org.name}</Text> mediante la aplicación de la Batería de Instrumentos para la Evaluación de Factores
                    de Riesgo Psicosocial, completando un total de <Text style={s.bold}>{summary.totalAssessments} evaluaciones</Text>{' '}
                    distribuidas entre los cuestionarios intralaboral (Formas A y B), extralaboral y de estrés, durante el período comprendido
                    entre el {org.dateStart} y el {org.dateEnd}.
                </Bullet>

                <Bullet>
                    El <Text style={s.bold}>{summary.criticalPercent}%</Text> de las evaluaciones aplicadas arrojó un nivel de riesgo{' '}
                    <Text style={s.bold}>Alto o Muy Alto</Text>, lo que{' '}
                    {summary.criticalPercent > 30
                        ? 'constituye una proporción significativamente elevada que exige intervención prioritaria e inmediata.'
                        : summary.criticalPercent > 15
                        ? 'representa una proporción moderada que amerita implementar acciones de intervención y seguimiento sistemático.'
                        : 'refleja un perfil de riesgo favorable, en el cual corresponde mantener y fortalecer las acciones de promoción y prevención.'}
                </Bullet>

                <Bullet>
                    La correlación entre condiciones de trabajo y condiciones de salud permitió clasificar la población en cuatro grupos de
                    intervención: <Text style={s.bold}>Grupo A (Sanos): {groups.a}</Text>,{' '}
                    <Text style={s.bold}>Grupo B (Vulnerables): {groups.b}</Text>,{' '}
                    <Text style={s.bold}>Grupo C (Adaptados): {groups.c}</Text> y{' '}
                    <Text style={s.bold}>Grupo D (Prioridad de intervención): {groups.d}</Text>.
                </Bullet>

                {groups.d > 0 && (
                    <Bullet>
                        Se identificaron <Text style={s.bold}>{groups.d} trabajadores en el Grupo D</Text>, quienes presentan simultáneamente
                        riesgo intralaboral y sintomatología de estrés en niveles Alto o Muy Alto. Este grupo constituye la prioridad absoluta
                        de intervención y requiere retroalimentación individual, Análisis Psicosocial del Puesto de Trabajo, asesoría psicológica
                        con seguimiento y, cuando el criterio profesional lo determine, remisión a la EPS.
                    </Bullet>
                )}

                {groups.b > 0 && (
                    <Bullet>
                        Los <Text style={s.bold}>{groups.b} trabajadores del Grupo B (Vulnerables)</Text> presentan sintomatología de estrés
                        elevada pese a percibir condiciones intralaborales favorables, lo que sugiere la influencia de factores extralaborales
                        o individuales. Se recomienda indagar fuentes específicas de estrés y fortalecer los estilos de afrontamiento.
                    </Bullet>
                )}

                {groups.c > 0 && (
                    <Bullet>
                        Los <Text style={s.bold}>{groups.c} trabajadores del Grupo C (Adaptados)</Text> perciben condiciones intralaborales
                        adversas sin manifestar aún sintomatología de estrés. Este grupo requiere intervención en la fuente para evitar que la
                        exposición sostenida derive en efectos sobre la salud.
                    </Bullet>
                )}

                {criticalDimensions.length > 0 && (
                    <Bullet>
                        Las dimensiones que concentran la mayor proporción de trabajadores en riesgo crítico y que constituyen los focos
                        prioritarios de intervención son:{' '}
                        <Text style={s.bold}>
                            {criticalDimensions.slice(0, 5).map(d => `${d.name} (${d.criticalPercent}%)`).join(', ')}
                        </Text>. La intervención sobre estas dimensiones debe priorizarse en la fuente y en el medio, conforme a la Guía Técnica
                        General de la Resolución 2764 de 2022.
                    </Bullet>
                )}

                {summary.needsSVE && (
                    <Bullet>
                        Dado que la proporción de trabajadores en riesgo crítico ({summary.criticalPercent}%) supera el umbral del 20%
                        establecido normativamente, <Text style={s.bold}>la organización tiene la obligación legal de implementar y mantener
                        activo el presente Programa de Vigilancia Epidemiológica</Text>, con seguimiento documentado de las intervenciones y
                        medición anual de los indicadores definidos en el capítulo X.
                    </Bullet>
                )}

                <Bullet>
                    Se recomienda realizar la <Text style={s.bold}>reevaluación de los factores de riesgo psicosocial en un plazo máximo de{' '}
                    {summary.criticalPercent > 20 ? 'un (1) año' : 'dos (2) años'}</Text>, conforme a lo establecido en la Resolución 2764 de
                    2022, con el fin de medir el impacto de las acciones de intervención implementadas.
                </Bullet>

                <Bullet>
                    Los resultados del presente programa deben integrarse al Sistema de Gestión de Seguridad y Salud en el Trabajo de la
                    organización, alimentando la matriz de identificación de peligros y valoración de riesgos, el plan anual de trabajo y el
                    programa de capacitación.
                </Bullet>

                <PageFooter label={footerLabel} />
            </Page>

            <Page size="A4" style={s.page}>
                <Header title="XV. Bibliografía" />

                {[
                    'Alcover, C., Martínez, D., Rodríguez, F. & Domínguez, R. (2004). Introducción a la Psicología del Trabajo. Madrid: McGraw Hill.',
                    'Betancur, F. (2001). Salud Ocupacional: Un Enfoque Humanista. Bogotá: McGraw-Hill Interamericana S.A.',
                    'Comité Mixto OIT-OMS. (1992). Factores psicosociales en el trabajo. Naturaleza, incidencia y prevención. México: Alfa Omega.',
                    'Ministerio de la Protección Social y Pontificia Universidad Javeriana. (2010). Batería de instrumentos para la Evaluación de Factores de Riesgo Psicosocial. Bogotá.',
                    'Ministerio de la Protección Social. (2004). Protocolo para la determinación del origen de patologías derivadas del estrés. Bogotá.',
                    'Ministerio de la Protección Social. (2008). Resolución 2646 de 2008. Bogotá.',
                    'Ministerio de Trabajo. (2014). Decreto 1477 de 2014. Tabla de Enfermedades Laborales. Bogotá.',
                    'Ministerio de Trabajo. (2015). Decreto 1072 de 2015. Decreto Único Reglamentario del Sector Trabajo. Bogotá.',
                    'Ministerio de Trabajo. (2022). Resolución 2764 de 2022. Por la cual se adopta la Batería de instrumentos para la evaluación de factores de Riesgo Psicosocial y la Guía Técnica General. Bogotá.',
                    'Ministerio de Trabajo y Organización Iberoamericana de Seguridad Social. (2013). Informe Ejecutivo II Encuesta Nacional de Condiciones de Seguridad y Salud en el Trabajo en el Sistema General de Riesgos. Bogotá.',
                    'Ministerio de Trabajo y Seguridad Social y Universidad Javeriana. (1996). Programa de Vigilancia Epidemiológica de Factores de Riesgo Psicosocial. Bogotá.',
                    'Salanova, M. (s.f.). Organizaciones Saludables y Desarrollo de Recursos Humanos. Revista de Trabajo y Seguridad Social. Universidad Jaume I de Castellón, CEF núm. 303, pp. 179–214.',
                    'Toro, F. (1991). Desempeño y productividad. Medellín: Cincel.',
                ].map((ref, i) => <Bullet key={i}>{ref}</Bullet>)}

                <View style={s.sigWrap}>
                    <View style={{ height: 45 }} />
                    <View style={s.sigLine} />
                    <Text style={s.sigName}>{org.psychologistName}</Text>
                    <Text style={s.sigDetail}>Psicólogo(a) Especialista en Seguridad y Salud en el Trabajo</Text>
                    <Text style={s.sigDetail}>Licencia SST: {org.psychologistLicense}</Text>
                    <Text style={s.sigDetail}>{org.today}</Text>
                </View>

                <PageFooter label={footerLabel} />
            </Page>
        </Document>
    );
}
