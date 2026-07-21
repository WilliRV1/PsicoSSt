import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle, Rect } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff', fontWeight: 400, fontStyle: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700, fontStyle: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff', fontWeight: 400, fontStyle: 'italic' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700, fontStyle: 'italic' }
    ]
});

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Inter', backgroundColor: '#ffffff' },
    coverPage: { padding: 40, fontFamily: 'Inter', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'center' },
    coverTitle: { fontSize: 32, fontWeight: 'bold', color: '#3b82f6', marginBottom: 20 },
    coverSubtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
    coverOrg: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
    coverNit: { fontSize: 12, color: '#cbd5e1' },
    coverNote: { position: 'absolute', bottom: 50, left: 40, fontSize: 10, color: '#94a3b8' },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 15, marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 4 },
    paragraph: { fontSize: 10, color: '#334155', marginBottom: 8, lineHeight: 1.4 },
    
    table: { display: 'flex', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tableHeader: { backgroundColor: '#f8fafc', padding: 5, fontSize: 9, fontWeight: 'bold', color: '#334155' },
    tableCell: { padding: 5, fontSize: 9, color: '#475569' },
    
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
    footerText: { fontSize: 8, color: '#94a3b8', textAlign: 'center' },
    
    chartGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gaugeBox: { width: '48%', marginBottom: 15, alignItems: 'center' },
    gaugeTitle: { fontSize: 9, fontWeight: 'bold', color: '#334155', marginBottom: 5, textAlign: 'center', height: 25 },
    gaugeValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: -15 },
    
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    matrixBox: { width: '48%', padding: 10, marginBottom: 10, borderWidth: 1, borderRadius: 4, marginRight: '2%' },

    watermark: {
        position: 'absolute',
        top: 300,
        left: 50,
        transform: 'rotate(-45deg)',
        fontSize: 36,
        color: 'rgba(220, 38, 38, 0.3)', // Red transparent
        fontWeight: 'bold',
        zIndex: -1
    }
});

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
  return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
}

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

const PDFGauge = ({ value, thresholds }: { value: number, thresholds: number[] }) => {
    const cx = 100, cy = 80, r = 60, strokeWidth = 20;
    const maxVal = thresholds[4] || 100;
    
    const getAngle = (val: number) => {
        let pct = val / maxVal;
        if (pct > 1) pct = 1;
        if (pct < 0) pct = 0;
        return pct * 180; 
    };

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7F1D1D'];
    let prevAngle = 0;
    
    const needleAngle = getAngle(value);
    const needleCoords = polarToCartesian(cx, cy, r - 5, needleAngle);
    
    return (
        <Svg width="200" height="100">
            {thresholds.map((th, i) => {
                const angle = getAngle(th);
                if (i === 4) return null; 
                const arc = describeArc(cx, cy, r, prevAngle, angle);
                const color = colors[i];
                prevAngle = angle;
                return <Path key={i} d={arc} fill="none" stroke={color} strokeWidth={strokeWidth} />;
            })}
            <Path d={describeArc(cx, cy, r, prevAngle, 180)} fill="none" stroke={colors[4]} strokeWidth={strokeWidth} />
            <Circle cx={cx} cy={cy} r={5} fill="#1e293b" />
            <Path d={`M ${cx} ${cy} L ${needleCoords.x} ${needleCoords.y}`} stroke="#1e293b" strokeWidth={3} />
        </Svg>
    );
};

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
        criticalPercent: number;
        predominantRisk: string | null;
        priorityMatrix: {
            group1D: number;
            vulnerables: number;
            adaptados: number;
            sanos: number;
        };
    };
    domainsFormaA: { key: string, name: string, average: number, thresholds: number[] }[];
    domainsFormaB: { key: string, name: string, average: number, thresholds: number[] }[];
    areaPyramid: { area: string, totalEvaluated: number, criticalPercent: number }[];
    recommendations?: string;
}

export default function OrganizationalReportPDF({ data }: { data: OrganizationalReportData }) {
    const isCritical = data.executiveSummary.criticalPercent > 30;
    const vigencia = isCritical ? "1 AÑO" : "2 AÑOS";
    const invalidReport = !data.orgInfo.psychologistLicenseDate;

    // Comparativo Side-by-Side (Matching common domains)
    const sideBySide = data.domainsFormaA.map(a => {
        const b = data.domainsFormaB.find(d => d.key === a.key);
        return {
            name: a.name,
            scoreA: a.average,
            scoreB: b ? b.average : null,
            gap: b ? (a.average - b.average).toFixed(1) : '-'
        };
    }).filter(s => s.scoreB !== null);

    return (
        <Document>
            {/* PORTADA */}
            <Page size="LETTER" style={styles.coverPage}>
                <Text style={styles.coverTitle}>Diagnóstico Psicosocial Organizacional</Text>
                <Text style={styles.coverSubtitle}>Sistema de Vigilancia Epidemiológica (SVE) - Batería BRP</Text>
                
                <View style={{ marginTop: 60 }}>
                    <Text style={styles.coverOrg}>{data.orgInfo.organizationName}</Text>
                    <Text style={styles.coverNit}>NIT: {data.orgInfo.organizationNit}</Text>
                    <Text style={{ ...styles.coverNit, marginTop: 10 }}>Población Evaluada: {data.executiveSummary.totalWorkers} trabajadores</Text>
                    <Text style={styles.coverNit}>Fecha de Emisión: {data.orgInfo.reportDate}</Text>
                </View>

                <View style={{ marginTop: 60 }}>
                    <Text style={styles.coverNit}>Preparado por:</Text>
                    <Text style={{ ...styles.coverOrg, fontSize: 16 }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={styles.coverNit}>Licencia SST: {data.orgInfo.psychologistLicense}</Text>
                </View>

                {invalidReport && (
                    <View style={{ marginTop: 30, backgroundColor: '#fee2e2', border: '2 solid #dc2626', padding: 15, borderRadius: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b91c1c', textAlign: 'center' }}>
                            INFORME SIN VALIDEZ LEGAL
                        </Text>
                        <Text style={{ fontSize: 10, color: '#991b1b', textAlign: 'center', marginTop: 8 }}>
                            Carencia de Licencia SST del Evaluador (Falta Fecha de Expedición).
                        </Text>
                    </View>
                )}

                <Text style={styles.coverNote}>
                    * Según la Resolución 2764 de 2022, este diagnóstico tiene una vigencia legal de {vigencia}, debido a que el riesgo global hallado requiere evaluación con esta periodicidad.
                </Text>
            </Page>

            {/* DOMINIOS Y COMPARATIVO */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                <View style={styles.header}><Text style={styles.headerTitle}>Riesgo por Dominios Intralaborales</Text></View>
                
                <View style={styles.sectionTitle}><Text>Forma A - Jefaturas y Profesionales</Text></View>
                <View style={styles.chartGrid}>
                    {data.domainsFormaA.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ ...styles.sectionTitle, marginTop: 15 }}><Text>Forma B - Auxiliares y Operativos</Text></View>
                <View style={styles.chartGrid}>
                    {data.domainsFormaB.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                </View>
            </Page>

            {/* SIDE BY SIDE Y PIRÁMIDE */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                <View style={styles.header}><Text style={styles.headerTitle}>Análisis Estratégico</Text></View>

                <View style={styles.sectionTitle}><Text>Análisis Comparativo Side-by-Side</Text></View>
                <Text style={styles.paragraph}>Comparación directa de puntajes entre Jefaturas (Forma A) y Operativos (Forma B) para identificar brechas de percepción.</Text>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableHeader, width: '40%' }}>Dominio Evaluado</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Puntaje Jefes</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Puntaje Operativos</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Brecha (A - B)</Text>
                    </View>
                    {sideBySide.map((s, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, width: '40%', fontWeight: 'bold' }}>{s.name}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{s.scoreA}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{s.scoreB}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center', color: parseFloat(s.gap) > 10 ? '#dc2626' : '#334155', fontWeight: parseFloat(s.gap) > 10 ? 'bold' : 'normal' }}>
                                {s.gap}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={{ ...styles.sectionTitle, marginTop: 20 }}><Text>Pirámide de Riesgo por Áreas</Text></View>
                <Text style={styles.paragraph}>Identificación de los departamentos más críticos para focalizar el plan de intervención.</Text>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableHeader, width: '60%' }}>Departamento / Área</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Total Evaluados</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>% Población en Riesgo Alto</Text>
                    </View>
                    {data.areaPyramid.map((area, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, width: '60%', fontWeight: 'bold' }}>{area.area}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{area.totalEvaluated}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center', color: area.criticalPercent > 30 ? '#dc2626' : '#334155', fontWeight: area.criticalPercent > 30 ? 'bold' : 'normal' }}>
                                {area.criticalPercent}%
                            </Text>
                        </View>
                    ))}
                </View>
            </Page>

            {/* MATRIZ Y PLAN */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                
                <View style={styles.header}><Text style={styles.headerTitle}>Matriz de Priorización y Cierre Ejecutivo</Text></View>
                <View style={styles.sectionTitle}><Text>Vigilancia Epidemiológica</Text></View>
                <Text style={styles.paragraph}>Cruce individual entre Riesgo Intralaboral y Nivel de Estrés de la población evaluada.</Text>
                
                <View style={styles.matrixGrid}>
                    <View style={{ ...styles.matrixBox, borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#b91c1c' }}>{data.executiveSummary.priorityMatrix.group1D}</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#7f1d1d' }}>Prioridad 1D</Text>
                        <Text style={{ fontSize: 8, color: '#991b1b' }}>Intralaboral Alto + Estrés Alto</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#fde047', backgroundColor: '#fefce8' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#a16207' }}>{data.executiveSummary.priorityMatrix.vulnerables}</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#713f12' }}>Vulnerables</Text>
                        <Text style={{ fontSize: 8, color: '#854d0e' }}>Intralaboral Bajo + Estrés Alto</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#fdba74', backgroundColor: '#fff7ed' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#c2410c' }}>{data.executiveSummary.priorityMatrix.adaptados}</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#7c2d12' }}>Adaptados</Text>
                        <Text style={{ fontSize: 8, color: '#9a3412' }}>Intralaboral Alto + Estrés Bajo</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#86efac', backgroundColor: '#f0fdf4' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#15803d' }}>{data.executiveSummary.priorityMatrix.sanos}</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#14532d' }}>Sanos</Text>
                        <Text style={{ fontSize: 8, color: '#166534' }}>Intralaboral Bajo + Estrés Bajo</Text>
                    </View>
                </View>

                <View style={{ ...styles.sectionTitle, marginTop: 20 }}><Text>Plan de Intervención</Text></View>
                {data.recommendations ? (
                    <Text style={{ ...styles.paragraph, color: '#1e293b' }}>
                        {data.recommendations}
                    </Text>
                ) : (
                    <Text style={styles.paragraph}>El plan de intervención está en proceso de redacción o pendiente de aprobación.</Text>
                )}

                <View style={{ marginTop: 60, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Psicólogo(a) Especialista SST</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 (Secreto Profesional) y Resolución 2346/2007 (Custodia Historia Clínica 20 años) | Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
}
