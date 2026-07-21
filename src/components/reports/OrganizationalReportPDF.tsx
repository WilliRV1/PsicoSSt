import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle, Rect } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff', fontWeight: 400, fontStyle: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700, fontStyle: 'normal' },
    ]
});

// ─── COLORS ──────────────────────────────────────────────
const C = {
    bg: '#FFFFFF', pageBg: '#F8FAFC',
    primary: '#1E3A8A', primaryLight: '#3B82F6', primaryBg: '#EFF6FF',
    text: '#0F172A', textMuted: '#475569', textLight: '#94A3B8',
    border: '#E2E8F0', borderLight: '#F1F5F9',
    green: '#10B981', greenBg: '#F0FDF4', greenText: '#166534',
    yellow: '#F59E0B', yellowBg: '#FEFCE8', yellowText: '#854D0E',
    orange: '#F97316', orangeBg: '#FFF7ED', orangeText: '#9A3412',
    red: '#EF4444', redBg: '#FEF2F2', redText: '#991B1B',
    darkRed: '#7F1D1D',
    sinRiesgo: '#10B981', bajo: '#3B82F6', medio: '#F59E0B', alto: '#EF4444', muyAlto: '#7F1D1D',
};

const RISK_COLORS: Record<string, string> = {
    SIN_RIESGO: C.sinRiesgo, BAJO: C.bajo, MEDIO: C.medio, ALTO: C.alto, MUY_ALTO: C.muyAlto,
};
const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: 'Sin Riesgo', BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto', MUY_ALTO: 'Muy Alto',
};

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
    "liderazgo y relaciones sociales en el trabajo": "Características de la jefatura y dinámicas de interacción entre compañeros.",
    "control sobre el trabajo": "Margen de autonomía del trabajador para tomar decisiones sobre su tarea.",
    "demandas del trabajo": "Exigencias físicas, mentales, emocionales y de jornada que el trabajo impone.",
    "recompensa": "Sentimiento de retribución justa (financiera, reconocimiento, estabilidad).",
};

// ─── STYLES ──────────────────────────────────────────────
const s = StyleSheet.create({
    page: { padding: 40, paddingBottom: 60, fontFamily: 'Inter', backgroundColor: C.bg, fontSize: 10, color: C.text },
    coverPage: { padding: 50, fontFamily: 'Inter', backgroundColor: '#0B1120', color: '#FFFFFF', justifyContent: 'center' },

    // Cover
    coverAccent: { width: 60, height: 4, backgroundColor: C.primaryLight, marginBottom: 20 },
    coverTitle: { fontSize: 36, fontWeight: 'bold', color: C.primaryLight, marginBottom: 8, letterSpacing: -1 },
    coverSubtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 40 },
    coverBox: { backgroundColor: '#1E293B', padding: 20, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: C.primaryLight, marginBottom: 20 },
    coverLabel: { fontSize: 10, color: '#94A3B8', marginBottom: 3 },
    coverValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
    coverSmall: { fontSize: 11, color: '#CBD5E1', marginBottom: 2 },
    coverFooter: { position: 'absolute', bottom: 40, left: 50, right: 50, fontSize: 9, color: '#64748B', lineHeight: 1.5 },

    // Section headers
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: C.primaryLight, paddingBottom: 8, marginBottom: 20 },
    pageTitle: { fontSize: 18, fontWeight: 'bold', color: C.primary, letterSpacing: -0.5 },
    sectionNum: { fontSize: 10, color: C.primaryLight, fontWeight: 'bold' },

    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: C.text, marginBottom: 8, marginTop: 15, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },
    subTitle: { fontSize: 11, fontWeight: 'bold', color: C.textMuted, marginBottom: 6 },
    body: { fontSize: 9.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 },
    bodyBold: { fontSize: 9.5, fontWeight: 'bold', color: C.text },

    // KPI Cards
    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    kpiCard: { width: '24%', backgroundColor: C.borderLight, borderRadius: 6, padding: 10, alignItems: 'center' },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: C.text, marginBottom: 2 },
    kpiLabel: { fontSize: 7, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

    // Tables
    table: { width: '100%', borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 15 },
    tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
    tHeader: { backgroundColor: C.borderLight, padding: 8, fontSize: 8, fontWeight: 'bold', color: C.text, textTransform: 'uppercase', letterSpacing: 0.3 },
    tCell: { padding: 8, fontSize: 9, color: C.textMuted },

    // Distribution bars
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    barLabel: { width: 65, fontSize: 8, color: C.textMuted },
    barTrack: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginRight: 8 },
    barPct: { width: 30, fontSize: 8, fontWeight: 'bold', color: C.text, textAlign: 'right' },

    // Gauge
    gaugeBox: { width: '48%', backgroundColor: C.bg, padding: 15, marginBottom: 12, borderRadius: 6, border: `1px solid ${C.border}`, alignItems: 'center' },
    gaugeTitle: { fontSize: 10, fontWeight: 'bold', color: C.text, marginBottom: 4, textAlign: 'center' },
    gaugeDesc: { fontSize: 7.5, color: C.textLight, textAlign: 'center', marginBottom: 10, height: 20 },
    gaugeValue: { fontSize: 16, fontWeight: 'bold', color: C.primary, marginTop: -12 },

    // Matrix
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    matrixBox: { width: '48%', padding: 15, marginBottom: 12, borderWidth: 1, borderRadius: 6, alignItems: 'center' },
    matrixNum: { fontSize: 28, fontWeight: 'bold', marginBottom: 3 },
    matrixLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
    matrixSub: { fontSize: 8, textAlign: 'center' },

    // Priority items
    prioRow: { flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 4, backgroundColor: C.borderLight, borderRadius: 4, border: `1px solid ${C.border}` },
    prioBar: { width: 3, height: 30, borderRadius: 2, marginRight: 10 },
    prioBadge: { fontSize: 7, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, textTransform: 'uppercase', marginLeft: 6 },

    // Area card
    areaCard: { width: '48%', backgroundColor: C.bg, padding: 12, marginBottom: 10, borderRadius: 6, border: `1px solid ${C.border}` },
    areaTitle: { fontSize: 10, fontWeight: 'bold', color: C.text, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },

    // Footer
    footer: { position: 'absolute', bottom: 25, left: 40, right: 40, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
    footerText: { fontSize: 7, color: C.textLight, textAlign: 'center' },

    // Watermark
    watermark: { position: 'absolute', top: 350, left: 30, transform: 'rotate(-45deg)', fontSize: 42, color: 'rgba(220,38,38,0.08)', fontWeight: 'bold', letterSpacing: 2 },

    // Anonymity notice
    notice: { flexDirection: 'row', backgroundColor: C.primaryBg, padding: 10, borderRadius: 4, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: C.primaryLight },
    noticeText: { fontSize: 8, color: C.primary, lineHeight: 1.5, flex: 1 },

    // Bullet
    bullet: { flexDirection: 'row', marginBottom: 6, paddingRight: 15 },
    bulletDot: { width: 12, fontSize: 10, color: C.primaryLight, fontWeight: 'bold' },
    bulletText: { flex: 1, fontSize: 9, color: C.textMuted, lineHeight: 1.5 },

    // Recommendation table
    recDim: { padding: 8, fontSize: 9, fontWeight: 'bold', color: C.text, width: '30%' },
    recAction: { padding: 8, fontSize: 8.5, color: C.textMuted, width: '70%', lineHeight: 1.4 },
});

// ─── GAUGE COMPONENT ──────────────────────────────────────
const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg - 180) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};
const describeArc = (x: number, y: number, r: number, s: number, e: number) => {
    const start = polarToCartesian(x, y, r, e);
    const end = polarToCartesian(x, y, r, s);
    const large = e - s <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
};

const PDFGauge = ({ value, thresholds }: { value: number; thresholds: number[] }) => {
    const cx = 90, cy = 70, r = 50, sw = 16;
    const max = thresholds[4] || 100;
    const getAngle = (v: number) => Math.min(Math.max(v / max, 0), 1) * 180;
    const colors = [C.sinRiesgo, C.bajo, C.medio, C.alto, C.muyAlto];
    let prev = 0;
    const needleCoords = polarToCartesian(cx, cy, r - 4, getAngle(value));

    return (
        <Svg width="180" height="90">
            {thresholds.map((th, i) => {
                if (i === 4) return null;
                const angle = getAngle(th);
                const arc = describeArc(cx, cy, r, prev, angle);
                prev = angle;
                return <Path key={i} d={arc} fill="none" stroke={colors[i]} strokeWidth={sw} />;
            })}
            <Path d={describeArc(cx, cy, r, prev, 180)} fill="none" stroke={colors[4]} strokeWidth={sw} />
            <Circle cx={cx} cy={cy} r={5} fill={C.text} />
            <Path d={`M ${cx} ${cy} L ${needleCoords.x} ${needleCoords.y}`} stroke={C.text} strokeWidth={2.5} />
        </Svg>
    );
};

// ─── DISTRIBUTION BAR ─────────────────────────────────────
const DistBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={s.barRow}>
        <Text style={s.barLabel}>{label}</Text>
        <View style={s.barTrack}>
            <View style={{ width: `${Math.min(value, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
        </View>
        <Text style={s.barPct}>{value}%</Text>
    </View>
);

const RiskDistribution = ({ distribution }: { distribution: Record<string, number> }) => (
    <View>
        {Object.entries(RISK_LABELS).map(([key, label]) => (
            <DistBar key={key} label={label} value={distribution[key] || 0} color={RISK_COLORS[key]} />
        ))}
    </View>
);

// ─── DATA INTERFACE ───────────────────────────────────────
export interface DimensionStat {
    name: string;
    questionnaire: string;
    avgScore: number;
    count: number;
    criticalPercent: number;
    priorityScore: number;
}

export interface OrganizationalReportData {
    orgInfo: {
        organizationName: string;
        organizationNit: string;
        reportDate: string;
        psychologistName: string;
        psychologistLicense: string;
        psychologistLicenseDate: string | null;
    };
    executiveSummary: {
        totalWorkers: number;
        totalAssessments: number;
        intraCount: number;
        extraCount: number;
        stressCount: number;
        criticalPercent: number;
        predominantRisk: string | null;
        priorityMatrix: {
            group1D: number;
            vulnerables: number;
            adaptados: number;
            sanos: number;
        };
    };
    stats: {
        intralaboral: Record<string, number>;
        extralaboral: Record<string, number>;
        stress: Record<string, number>;
    };
    domainsFormaA: { key: string; name: string; average: number; thresholds: number[] }[];
    domainsFormaB: { key: string; name: string; average: number; thresholds: number[] }[];
    dimensionAnalysis: DimensionStat[];
    segmentedData: {
        byArea: Record<string, { count: number; riskDistribution: Record<string, number> }>;
    };
    recommendations: { dimension: string; recommendation: string }[];
    areaPyramid: { area: string; totalEvaluated: number; criticalPercent: number }[];
}

// ─── PDF DOCUMENT ─────────────────────────────────────────
export default function OrganizationalReportPDF({ data }: { data: OrganizationalReportData }) {
    const isCritical = data.executiveSummary.criticalPercent > 30;
    const vigencia = isCritical ? '1 AÑO' : '2 AÑOS';
    const invalidReport = !data.orgInfo.psychologistLicenseDate;
    const pm = data.executiveSummary.priorityMatrix;

    const prioritizedDims = [...data.dimensionAnalysis]
        .filter(d => d.criticalPercent > 0 || d.avgScore >= 25)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 8);

    const topCriticalDims = [...data.dimensionAnalysis]
        .filter(d => d.criticalPercent > 0)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 3)
        .map(d => d.name);

    const areaEntries = Object.entries(data.segmentedData.byArea);

    const PageFooter = () => (
        <View style={s.footer} fixed>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
                `${data.orgInfo.organizationName} — Diagnóstico Psicosocial BRP · Ley 1090 · Res. 2764/2022 · Pág. ${pageNumber} de ${totalPages}`
            } />
        </View>
    );

    return (
        <Document>
            {/* ═══════════ PORTADA ═══════════ */}
            <Page size="LETTER" style={s.coverPage}>
                <View style={s.coverAccent} />
                <Text style={s.coverTitle}>Diagnóstico Psicosocial{'\n'}Organizacional</Text>
                <Text style={s.coverSubtitle}>Batería de Riesgo Psicosocial — Resolución 2764 de 2022</Text>

                <View style={s.coverBox}>
                    <Text style={s.coverLabel}>Organización</Text>
                    <Text style={s.coverValue}>{data.orgInfo.organizationName}</Text>
                    <Text style={s.coverSmall}>NIT: {data.orgInfo.organizationNit}</Text>
                    <Text style={s.coverSmall}>Población Evaluada: {data.executiveSummary.totalWorkers} trabajadores</Text>
                    <Text style={s.coverSmall}>Fecha de Emisión: {data.orgInfo.reportDate}</Text>
                </View>

                <View style={{ ...s.coverBox, borderLeftColor: C.green }}>
                    <Text style={s.coverLabel}>Validación Profesional</Text>
                    <Text style={s.coverValue}>{data.orgInfo.psychologistName}</Text>
                    <Text style={s.coverSmall}>Psicólogo(a) Especialista en SST</Text>
                    <Text style={s.coverSmall}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                    {data.orgInfo.psychologistLicenseDate && (
                        <Text style={s.coverSmall}>Expedición: {data.orgInfo.psychologistLicenseDate}</Text>
                    )}
                </View>

                {invalidReport && (
                    <View style={{ marginTop: 15, backgroundColor: C.darkRed, padding: 15, borderRadius: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FECACA', textAlign: 'center', marginBottom: 4 }}>⚠ INFORME SIN VALIDEZ LEGAL</Text>
                        <Text style={{ fontSize: 10, color: '#FCA5A5', textAlign: 'center', lineHeight: 1.4 }}>Carencia de Fecha de Expedición de Licencia SST según manual técnico.</Text>
                    </View>
                )}

                <Text style={s.coverFooter}>* Según la Resolución 2764 de 2022, este diagnóstico tiene vigencia de {vigencia}.</Text>
            </Page>

            {/* ═══════════ 1. RESUMEN EJECUTIVO ═══════════ */}
            <Page size="LETTER" style={s.page}>
                {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                <View style={s.pageHeader}>
                    <Text style={s.pageTitle}>1. Resumen Ejecutivo</Text>
                </View>

                <View style={s.notice}>
                    <Text style={s.noticeText}>
                        <Text style={{ fontWeight: 'bold' }}>Custodia de Datos: </Text>
                        Este informe cumple con la Ley 1090 de 2006. Los resultados son estrictamente estadísticos y no permiten la identificación individual de los trabajadores.
                    </Text>
                </View>

                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{data.executiveSummary.totalWorkers}</Text>
                        <Text style={s.kpiLabel}>Trabajadores evaluados</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{data.executiveSummary.totalAssessments}</Text>
                        <Text style={s.kpiLabel}>Evaluaciones totales</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiValue}>{data.executiveSummary.intraCount}/{data.executiveSummary.extraCount}/{data.executiveSummary.stressCount}</Text>
                        <Text style={s.kpiLabel}>Intra / Extra / Estrés</Text>
                    </View>
                    <View style={{ ...s.kpiCard, backgroundColor: data.executiveSummary.criticalPercent > 30 ? C.redBg : data.executiveSummary.criticalPercent > 15 ? C.orangeBg : C.greenBg }}>
                        <Text style={{ ...s.kpiValue, color: data.executiveSummary.criticalPercent > 30 ? C.redText : data.executiveSummary.criticalPercent > 15 ? C.orangeText : C.greenText }}>{data.executiveSummary.criticalPercent}%</Text>
                        <Text style={s.kpiLabel}>Zona crítica (Alto+Muy Alto)</Text>
                    </View>
                </View>

                <Text style={s.body}>
                    Se evaluaron {data.executiveSummary.totalWorkers} trabajadores de la organización {data.orgInfo.organizationName}, mediante la aplicación de la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, completando un total de {data.executiveSummary.totalAssessments} evaluaciones distribuidas en los tres cuestionarios de la batería.
                </Text>
                <Text style={s.body}>
                    {data.executiveSummary.criticalPercent > 30
                        ? 'Los resultados revelan una proporción significativamente alta de trabajadores en zona de riesgo crítico (Alto y Muy Alto), lo que requiere intervención prioritaria e inmediata según la normatividad vigente.'
                        : data.executiveSummary.criticalPercent > 15
                        ? 'Se identifica una proporción moderada de trabajadores en zona de riesgo crítico que amerita implementar acciones de intervención y seguimiento.'
                        : 'Los resultados generales muestran un perfil de riesgo favorable. Se recomienda mantener las acciones de promoción y prevención implementadas.'}
                </Text>
                {data.executiveSummary.predominantRisk && (
                    <Text style={s.body}>El nivel de riesgo predominante en la organización es <Text style={s.bodyBold}>{RISK_LABELS[data.executiveSummary.predominantRisk] || data.executiveSummary.predominantRisk}</Text>.</Text>
                )}

                {/* ── 2. Perfil General de Riesgo ── */}
                <View style={s.sectionTitle}><Text>2. Perfil General de Riesgo</Text></View>
                <Text style={s.body}>Distribución porcentual de la población evaluada según nivel de riesgo por cada cuestionario.</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <View style={{ width: '31%', backgroundColor: C.borderLight, padding: 10, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.text, marginBottom: 8 }}>Intralaboral</Text>
                        <RiskDistribution distribution={data.stats.intralaboral} />
                    </View>
                    <View style={{ width: '31%', backgroundColor: C.borderLight, padding: 10, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.text, marginBottom: 8 }}>Extralaboral</Text>
                        <RiskDistribution distribution={data.stats.extralaboral} />
                    </View>
                    <View style={{ width: '31%', backgroundColor: C.borderLight, padding: 10, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.text, marginBottom: 8 }}>Estrés</Text>
                        <RiskDistribution distribution={data.stats.stress} />
                    </View>
                </View>

                <PageFooter />
            </Page>

            {/* ═══════════ 3. DOMINIOS FORMA A ═══════════ */}
            {data.domainsFormaA.length > 0 && (
                <Page size="LETTER" style={s.page}>
                    {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                    <View style={s.pageHeader}>
                        <Text style={s.pageTitle}>3. Evaluación por Dominios — Forma A</Text>
                    </View>
                    <Text style={s.body}>Resultados consolidados para Jefaturas y Profesionales. Los velocímetros indican el promedio poblacional frente a los umbrales normativos de la Res. 2764.</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {data.domainsFormaA.map((d, i) => {
                            const desc = DOMAIN_DESCRIPTIONS[d.name.toLowerCase()] || '';
                            return (
                                <View key={i} style={s.gaugeBox}>
                                    <Text style={s.gaugeTitle}>{d.name}</Text>
                                    {desc ? <Text style={s.gaugeDesc}>{desc}</Text> : <View style={{ height: 20 }} />}
                                    <PDFGauge value={d.average} thresholds={d.thresholds} />
                                    <Text style={s.gaugeValue}>{d.average}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <PageFooter />
                </Page>
            )}

            {/* ═══════════ 4. DOMINIOS FORMA B ═══════════ */}
            {data.domainsFormaB.length > 0 && (
                <Page size="LETTER" style={s.page}>
                    {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                    <View style={s.pageHeader}>
                        <Text style={s.pageTitle}>4. Evaluación por Dominios — Forma B</Text>
                    </View>
                    <Text style={s.body}>Resultados consolidados para Auxiliares y Operativos. Este segmento poblacional requiere particular atención en las dimensiones vinculadas a la carga física y ritmo de trabajo.</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {data.domainsFormaB.map((d, i) => {
                            const desc = DOMAIN_DESCRIPTIONS[d.name.toLowerCase()] || '';
                            return (
                                <View key={i} style={s.gaugeBox}>
                                    <Text style={s.gaugeTitle}>{d.name}</Text>
                                    {desc ? <Text style={s.gaugeDesc}>{desc}</Text> : <View style={{ height: 20 }} />}
                                    <PDFGauge value={d.average} thresholds={d.thresholds} />
                                    <Text style={s.gaugeValue}>{d.average}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <PageFooter />
                </Page>
            )}

            {/* ═══════════ 5. ANÁLISIS POR DIMENSIONES ═══════════ */}
            {data.dimensionAnalysis.length > 0 && (
                <Page size="LETTER" style={s.page}>
                    {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                    <View style={s.pageHeader}>
                        <Text style={s.pageTitle}>5. Análisis por Dimensiones</Text>
                    </View>
                    <Text style={s.body}>Dimensiones con mayor puntaje transformado promedio, indicando las áreas que requieren mayor atención.</Text>

                    <View style={s.table}>
                        <View style={s.tRow}>
                            <Text style={{ ...s.tHeader, width: '35%' }}>Dimensión</Text>
                            <Text style={{ ...s.tHeader, width: '18%', textAlign: 'center' }}>Cuestionario</Text>
                            <Text style={{ ...s.tHeader, width: '15%', textAlign: 'center' }}>Puntaje Prom.</Text>
                            <Text style={{ ...s.tHeader, width: '15%', textAlign: 'center' }}>Evaluados</Text>
                            <Text style={{ ...s.tHeader, width: '17%', textAlign: 'center' }}>% Alto/Muy Alto</Text>
                        </View>
                        {data.dimensionAnalysis.slice(0, 15).map((dim, i) => {
                            const scoreColor = dim.avgScore >= 40 ? C.redText : dim.avgScore >= 30 ? C.orangeText : dim.avgScore >= 20 ? C.yellowText : C.greenText;
                            const scoreBg = dim.avgScore >= 40 ? C.redBg : dim.avgScore >= 30 ? C.orangeBg : dim.avgScore >= 20 ? C.yellowBg : C.greenBg;
                            return (
                                <View key={i} style={{ ...s.tRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
                                    <Text style={{ ...s.tCell, width: '35%', fontWeight: 'bold', color: C.text }}>{dim.name}</Text>
                                    <Text style={{ ...s.tCell, width: '18%', textAlign: 'center', fontSize: 8 }}>{dim.questionnaire}</Text>
                                    <View style={{ width: '15%', padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: scoreColor, backgroundColor: scoreBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                                            {dim.avgScore.toFixed(1)}%
                                        </Text>
                                    </View>
                                    <Text style={{ ...s.tCell, width: '15%', textAlign: 'center' }}>{dim.count}</Text>
                                    <Text style={{ ...s.tCell, width: '17%', textAlign: 'center', fontWeight: 'bold', color: dim.criticalPercent > 30 ? C.red : dim.criticalPercent > 15 ? C.orange : C.textMuted }}>
                                        {dim.criticalPercent}%
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                    <PageFooter />
                </Page>
            )}

            {/* ═══════════ 6. PRIORIZACIÓN DE INTERVENCIÓN ═══════════ */}
            {prioritizedDims.length > 0 && (
                <Page size="LETTER" style={s.page}>
                    {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                    <View style={s.pageHeader}>
                        <Text style={s.pageTitle}>6. Priorización de Intervención</Text>
                    </View>
                    <Text style={s.body}>Matriz de prioridad basada en la combinación del nivel de riesgo promedio y el número de trabajadores afectados. Las dimensiones se ordenan por prioridad de intervención.</Text>

                    {prioritizedDims.map((dim, i) => {
                        const priority = dim.priorityScore >= 70 ? 'CRÍTICA' : dim.priorityScore >= 40 ? 'ALTA' : 'MEDIA';
                        const pColor = dim.priorityScore >= 70 ? C.red : dim.priorityScore >= 40 ? C.orange : C.yellow;
                        const badgeBg = dim.priorityScore >= 70 ? C.redBg : dim.priorityScore >= 40 ? C.orangeBg : C.yellowBg;
                        const badgeColor = dim.priorityScore >= 70 ? C.redText : dim.priorityScore >= 40 ? C.orangeText : C.yellowText;

                        return (
                            <View key={i} style={s.prioRow}>
                                <View style={{ ...s.prioBar, backgroundColor: pColor }} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.text }}>{i + 1}. {dim.name}</Text>
                                        <Text style={{ ...s.prioBadge, backgroundColor: badgeBg, color: badgeColor }}>{priority}</Text>
                                    </View>
                                    <Text style={{ fontSize: 8, color: C.textLight, marginTop: 2 }}>
                                        Promedio: {dim.avgScore.toFixed(1)}% · {dim.criticalPercent}% en zona crítica · {dim.count} evaluados
                                    </Text>
                                </View>
                                <View style={{ width: 60, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                    <View style={{ width: `${Math.min(dim.priorityScore, 100)}%`, height: '100%', backgroundColor: pColor, borderRadius: 3 }} />
                                </View>
                            </View>
                        );
                    })}

                    {/* ── Matriz de Vigilancia Epidemiológica ── */}
                    <View style={{ ...s.sectionTitle, marginTop: 20 }}><Text>Matriz de Vigilancia Epidemiológica</Text></View>
                    <Text style={s.body}>Cruce individual entre Riesgo Intralaboral y Nivel de Estrés de la población evaluada.</Text>

                    <View style={s.matrixGrid}>
                        <View style={{ ...s.matrixBox, borderColor: '#FCA5A5', backgroundColor: C.redBg }}>
                            <Text style={{ ...s.matrixNum, color: C.red }}>{pm.group1D}</Text>
                            <Text style={{ ...s.matrixLabel, color: C.redText }}>Prioridad 1D</Text>
                            <Text style={{ ...s.matrixSub, color: C.redText }}>Riesgo Intralaboral Alto{'\n'}+ Estrés Alto</Text>
                        </View>
                        <View style={{ ...s.matrixBox, borderColor: '#FDE047', backgroundColor: C.yellowBg }}>
                            <Text style={{ ...s.matrixNum, color: C.yellow }}>{pm.vulnerables}</Text>
                            <Text style={{ ...s.matrixLabel, color: C.yellowText }}>Vulnerables</Text>
                            <Text style={{ ...s.matrixSub, color: C.yellowText }}>Riesgo Intralaboral Bajo{'\n'}+ Estrés Alto</Text>
                        </View>
                        <View style={{ ...s.matrixBox, borderColor: '#FDBA74', backgroundColor: C.orangeBg }}>
                            <Text style={{ ...s.matrixNum, color: C.orange }}>{pm.adaptados}</Text>
                            <Text style={{ ...s.matrixLabel, color: C.orangeText }}>Adaptados</Text>
                            <Text style={{ ...s.matrixSub, color: C.orangeText }}>Riesgo Intralaboral Alto{'\n'}+ Estrés Bajo</Text>
                        </View>
                        <View style={{ ...s.matrixBox, borderColor: '#86EFAC', backgroundColor: C.greenBg }}>
                            <Text style={{ ...s.matrixNum, color: C.green }}>{pm.sanos}</Text>
                            <Text style={{ ...s.matrixLabel, color: C.greenText }}>Sanos</Text>
                            <Text style={{ ...s.matrixSub, color: C.greenText }}>Riesgo Intralaboral Bajo{'\n'}+ Estrés Bajo</Text>
                        </View>
                    </View>

                    <PageFooter />
                </Page>
            )}

            {/* ═══════════ 7. ANÁLISIS POR ÁREAS ═══════════ */}
            {areaEntries.length > 0 && (
                <Page size="LETTER" style={s.page}>
                    {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                    <View style={s.pageHeader}>
                        <Text style={s.pageTitle}>7. Análisis por Áreas de Trabajo</Text>
                    </View>
                    <Text style={s.body}>Distribución de riesgo segmentada por departamento o área funcional. Permite identificar focos de intervención localizados.</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {areaEntries.map(([area, areaData]: [string, any], i) => (
                            <View key={i} style={s.areaCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.text }}>{area}</Text>
                                    <Text style={{ fontSize: 7, fontWeight: 'bold', color: C.textLight, backgroundColor: C.borderLight, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>N={areaData.count}</Text>
                                </View>
                                <RiskDistribution distribution={areaData.riskDistribution} />
                            </View>
                        ))}
                    </View>

                    <PageFooter />
                </Page>
            )}

            {/* ═══════════ 8. CONCLUSIONES Y RECOMENDACIONES ═══════════ */}
            <Page size="LETTER" style={s.page}>
                {invalidReport && <Text style={s.watermark}>SIN VALIDEZ LEGAL</Text>}
                <View style={s.pageHeader}>
                    <Text style={s.pageTitle}>8. Conclusiones y Recomendaciones</Text>
                </View>

                <View style={s.sectionTitle}><Text>Conclusiones</Text></View>
                <View style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>De los {data.executiveSummary.totalWorkers} trabajadores evaluados, el {data.executiveSummary.criticalPercent}% se encuentra en zona de riesgo crítico (Alto o Muy Alto) en al menos uno de los cuestionarios aplicados.</Text>
                </View>
                {data.executiveSummary.predominantRisk && (
                    <View style={s.bullet}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>El nivel de riesgo predominante en la organización es {RISK_LABELS[data.executiveSummary.predominantRisk] || data.executiveSummary.predominantRisk}.</Text>
                    </View>
                )}
                {topCriticalDims.length > 0 && (
                    <View style={s.bullet}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>Las dimensiones que requieren intervención prioritaria son: <Text style={s.bodyBold}>{topCriticalDims.join(', ')}</Text>.</Text>
                    </View>
                )}

                <View style={s.sectionTitle}><Text>Recomendaciones</Text></View>

                {isCritical && (
                    <View style={{ backgroundColor: C.redBg, borderLeftWidth: 3, borderLeftColor: C.red, padding: 10, borderRadius: 4, marginBottom: 10 }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: C.redText, textTransform: 'uppercase', marginBottom: 3 }}>Intervención Obligatoria</Text>
                        <Text style={{ fontSize: 9, color: '#DC2626', lineHeight: 1.5 }}>De acuerdo con la Resolución 2764 de 2022, cuando más del 20% de los trabajadores se encuentran en nivel de riesgo Alto o Muy Alto, la organización debe implementar un Sistema de Vigilancia Epidemiológica (SVE) con intervención inmediata y seguimiento anual.</Text>
                    </View>
                )}

                <View style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}><Text style={s.bodyBold}>Intervención inmediata:</Text> Priorizar la atención de los trabajadores clasificados en riesgo Alto y Muy Alto, incluyendo remisión a programas de asistencia al empleado y valoración especializada.</Text>
                </View>
                <View style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}><Text style={s.bodyBold}>Actividades de prevención:</Text> Implementar programas enfocados en las dimensiones identificadas como prioritarias, incluyendo capacitaciones, talleres y ajustes organizacionales.</Text>
                </View>
                <View style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}><Text style={s.bodyBold}>Seguimiento:</Text> Realizar reevaluación de los factores de riesgo psicosocial en un plazo máximo de {vigencia}, conforme a lo establecido en la Resolución 2764 de 2022.</Text>
                </View>
                <View style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}><Text style={s.bodyBold}>Promoción:</Text> Fortalecer los factores protectores identificados (dimensiones en nivel Sin Riesgo o Bajo) mediante acciones de promoción de la salud mental y bienestar en el trabajo.</Text>
                </View>

                {/* Tabla de acciones recomendadas */}
                {data.recommendations.length > 0 && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={s.subTitle}>Matriz de Acciones Recomendadas (SVE)</Text>
                        <View style={s.table}>
                            <View style={s.tRow}>
                                <Text style={{ ...s.tHeader, width: '30%' }}>Dimensión en Riesgo</Text>
                                <Text style={{ ...s.tHeader, width: '70%' }}>Acción de Intervención Recomendada</Text>
                            </View>
                            {data.recommendations.map((rec, i) => (
                                <View key={i} style={{ ...s.tRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
                                    <Text style={s.recDim}>{rec.dimension}</Text>
                                    <Text style={s.recAction}>{rec.recommendation}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Legal footer */}
                <View style={{ marginTop: 15, backgroundColor: C.primaryBg, padding: 10, borderRadius: 4, border: `1px solid ${C.border}` }}>
                    <Text style={{ fontSize: 8, color: C.primary, lineHeight: 1.5 }}>
                        <Text style={{ fontWeight: 'bold' }}>Nota legal: </Text>
                        Este informe diagnóstico organizacional es un documento técnico que forma parte del SG-SST de la empresa, según lo dispuesto en la Resolución 2764 de 2022 y la Resolución 2646 de 2008. Los datos presentados son exclusivamente estadísticos y no permiten la identificación individual de trabajadores, en cumplimiento de la Ley 1090 de 2006 sobre confidencialidad.
                    </Text>
                </View>

                {/* Firma */}
                <View style={{ marginTop: 30, alignItems: 'center' }}>
                    <View style={{ width: 200, borderBottomWidth: 1, borderBottomColor: C.text, marginBottom: 5 }} />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.text }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={{ fontSize: 9, color: C.textMuted }}>Psicólogo(a) Especialista SST</Text>
                    <Text style={{ fontSize: 9, color: C.textMuted }}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                </View>

                <PageFooter />
            </Page>
        </Document>
    );
}
