import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle } from '@react-pdf/renderer';

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
    page: { padding: 40, fontFamily: 'Inter', backgroundColor: '#F8FAFC' },
    coverPage: { padding: 50, fontFamily: 'Inter', backgroundColor: '#0B1120', color: '#ffffff', display: 'flex', justifyContent: 'center' },
    coverTitle: { fontSize: 38, fontWeight: 'bold', color: '#3B82F6', marginBottom: 15, letterSpacing: -1 },
    coverSubtitle: { fontSize: 18, color: '#94A3B8', marginBottom: 50, letterSpacing: -0.5 },
    coverBox: { backgroundColor: '#1E293B', padding: 25, borderRadius: 8, borderLeft: '4px solid #3B82F6', marginBottom: 30 },
    coverOrg: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
    coverNit: { fontSize: 12, color: '#CBD5E1', marginBottom: 4 },
    coverNote: { position: 'absolute', bottom: 40, left: 50, right: 50, fontSize: 10, color: '#64748B', lineHeight: 1.5 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#3B82F6', paddingBottom: 10, marginBottom: 25 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', letterSpacing: -0.5 },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, paddingBottom: 5, borderBottom: '1px solid #E2E8F0' },
    paragraph: { fontSize: 10, color: '#475569', marginBottom: 15, lineHeight: 1.5 },
    
    table: { display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 20, backgroundColor: '#FFFFFF' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #E2E8F0' },
    tableHeader: { backgroundColor: '#F1F5F9', padding: 10, fontSize: 10, fontWeight: 'bold', color: '#1E293B' },
    tableCell: { padding: 10, fontSize: 10, color: '#475569', display: 'flex', justifyContent: 'center' },
    
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
    footerText: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },
    
    chartGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gaugeBox: { width: '48%', backgroundColor: '#FFFFFF', padding: 20, marginBottom: 15, borderRadius: 8, border: '1px solid #E2E8F0', alignItems: 'center' },
    gaugeTitle: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', marginBottom: 15, textAlign: 'center', height: 28 },
    gaugeValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: -15 },
    
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, justifyContent: 'space-between' },
    matrixBox: { width: '48%', padding: 20, marginBottom: 15, borderWidth: 1, borderRadius: 8, alignItems: 'center' },

    watermark: {
        position: 'absolute',
        top: 350,
        left: 30,
        transform: 'rotate(-45deg)',
        fontSize: 45,
        color: 'rgba(220, 38, 38, 0.1)',
        fontWeight: 'bold',
        zIndex: -1,
        letterSpacing: 2
    },

    bulletPoint: { flexDirection: 'row', marginBottom: 8, paddingRight: 20 },
    bulletIcon: { width: 15, fontSize: 12, color: '#3B82F6', fontWeight: 'bold' },
    bulletText: { flex: 1, fontSize: 10, color: '#334155', lineHeight: 1.5 }
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
    const cx = 100, cy = 80, r = 60, strokeWidth = 18;
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
            <Circle cx={cx} cy={cy} r={6} fill="#1E293B" />
            <Path d={`M ${cx} ${cy} L ${needleCoords.x} ${needleCoords.y}`} stroke="#1E293B" strokeWidth={3} />
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

    const sideBySide = data.domainsFormaA.map(a => {
        const b = data.domainsFormaB.find(d => d.key === a.key);
        return {
            name: a.name,
            scoreA: a.average,
            scoreB: b ? b.average : null,
            gap: b ? (a.average - b.average).toFixed(1) : '-'
        };
    }).filter(s => s.scoreB !== null);

    const recommendationList = data.recommendations 
        ? data.recommendations.split('\n').filter(r => r.trim() !== '') 
        : [];

    return (
        <Document>
            {/* PORTADA */}
            <Page size="LETTER" style={styles.coverPage}>
                <Text style={styles.coverTitle}>Diagnóstico Psicosocial</Text>
                <Text style={styles.coverSubtitle}>Inteligencia Estratégica Organizacional (SVE - Batería BRP)</Text>
                
                <View style={styles.coverBox}>
                    <Text style={styles.coverOrg}>{data.orgInfo.organizationName}</Text>
                    <Text style={styles.coverNit}>NIT: {data.orgInfo.organizationNit}</Text>
                    <Text style={styles.coverNit}>Población Evaluada: {data.executiveSummary.totalWorkers} trabajadores</Text>
                    <Text style={styles.coverNit}>Fecha de Emisión: {data.orgInfo.reportDate}</Text>
                </View>

                <View style={{ ...styles.coverBox, borderLeftColor: '#10B981', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>Validación Profesional:</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={styles.coverNit}>Psicólogo(a) Especialista en SST</Text>
                    <Text style={styles.coverNit}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                    {data.orgInfo.psychologistLicenseDate && (
                        <Text style={styles.coverNit}>Expedición: {data.orgInfo.psychologistLicenseDate}</Text>
                    )}
                </View>

                {invalidReport && (
                    <View style={{ marginTop: 20, backgroundColor: '#7F1D1D', padding: 20, borderRadius: 8, border: '1px solid #EF4444' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FECACA', textAlign: 'center', marginBottom: 5 }}>
                            ⚠ INFORME SIN VALIDEZ LEGAL
                        </Text>
                        <Text style={{ fontSize: 11, color: '#FCA5A5', textAlign: 'center', lineHeight: 1.4 }}>
                            Carencia de Fecha de Expedición de Licencia SST según manual técnico. Todo informe que carezca de estos datos no será válido ante el Ministerio del Trabajo.
                        </Text>
                    </View>
                )}

                <Text style={styles.coverNote}>
                    * Según la Resolución 2764 de 2022 del Ministerio del Trabajo de Colombia, este diagnóstico tiene una vigencia legal de {vigencia}, debido a que el riesgo global hallado requiere evaluación con esta periodicidad.
                </Text>
            </Page>

            {/* DOMINIOS FORMA A */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                <View style={styles.header}><Text style={styles.headerTitle}>Inteligencia Epidemiológica: Jefaturas y Profesionales</Text></View>
                
                <Text style={styles.paragraph}>
                    Resultados consolidados de la Forma A. Los velocímetros indican el promedio poblacional frente a los umbrales de riesgo establecidos en la resolución nacional.
                </Text>

                <View style={styles.chartGrid}>
                    {data.domainsFormaA.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                    {data.domainsFormaA.length === 0 && (
                        <Text style={styles.paragraph}>No hay evaluaciones de Forma A en la muestra poblacional.</Text>
                    )}
                </View>
                
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 (Secreto Profesional) y Res. 2346/2007 (Custodia H.C.) | Pág. ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>

            {/* DOMINIOS FORMA B */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                <View style={styles.header}><Text style={styles.headerTitle}>Inteligencia Epidemiológica: Auxiliares y Operativos</Text></View>
                
                <Text style={styles.paragraph}>
                    Resultados consolidados de la Forma B. Este segmento poblacional requiere particular atención en las dimensiones vinculadas a la carga física y ritmo de trabajo.
                </Text>

                <View style={styles.chartGrid}>
                    {data.domainsFormaB.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                    {data.domainsFormaB.length === 0 && (
                        <Text style={styles.paragraph}>No hay evaluaciones de Forma B en la muestra poblacional.</Text>
                    )}
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 (Secreto Profesional) y Res. 2346/2007 (Custodia H.C.) | Pág. ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>

            {/* SIDE BY SIDE Y PIRÁMIDE */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                <View style={styles.header}><Text style={styles.headerTitle}>Análisis Estratégico y Brechas</Text></View>

                <View style={styles.sectionTitle}><Text>Comparativo Side-by-Side (Percepción Jefes vs. Operativos)</Text></View>
                <Text style={styles.paragraph}>Identificación de brechas de percepción entre el liderazgo (A) y la operación (B). Una brecha superior a 10 puntos sugiere desconexión organizacional crítica.</Text>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableHeader, width: '40%' }}>Dominio Evaluado</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Jefes (A)</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Operativos (B)</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Brecha</Text>
                    </View>
                    {sideBySide.map((s, i) => {
                        const gapVal = parseFloat(s.gap);
                        const isCriticalGap = !isNaN(gapVal) && Math.abs(gapVal) >= 10;
                        return (
                            <View key={i} style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell, width: '40%', fontWeight: 'bold' }}>{s.name}</Text>
                                <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{s.scoreA}</Text>
                                <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{s.scoreB}</Text>
                                <View style={{ width: '20%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ 
                                        fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4,
                                        backgroundColor: isCriticalGap ? '#FEE2E2' : '#F1F5F9',
                                        color: isCriticalGap ? '#DC2626' : '#475569'
                                    }}>
                                        {s.gap}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View style={{ ...styles.sectionTitle, marginTop: 10 }}><Text>Pirámide de Riesgo por Áreas</Text></View>
                <Text style={styles.paragraph}>Focalización del plan de intervención hacia los departamentos más críticos de la organización.</Text>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableHeader, width: '60%' }}>Departamento / Área</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Volumen Evaluado</Text>
                        <Text style={{ ...styles.tableHeader, width: '20%', textAlign: 'center' }}>Población Crítica</Text>
                    </View>
                    {data.areaPyramid.map((area, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, width: '60%', fontWeight: 'bold' }}>{area.area}</Text>
                            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'center' }}>{area.totalEvaluated} func.</Text>
                            <View style={{ width: '20%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ 
                                    fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4,
                                    backgroundColor: area.criticalPercent >= 30 ? '#FEE2E2' : '#F1F5F9',
                                    color: area.criticalPercent >= 30 ? '#DC2626' : '#475569'
                                }}>
                                    {area.criticalPercent}%
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 (Secreto Profesional) y Res. 2346/2007 (Custodia H.C.) | Pág. ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>

            {/* MATRIZ Y PLAN */}
            <Page size="LETTER" style={styles.page}>
                {invalidReport && <Text style={styles.watermark}>INFORME SIN VALIDEZ LEGAL</Text>}
                
                <View style={styles.header}><Text style={styles.headerTitle}>Matriz de Priorización y Cierre Ejecutivo</Text></View>
                <View style={styles.sectionTitle}><Text>Vigilancia Epidemiológica</Text></View>
                <Text style={styles.paragraph}>Distribución técnica basada en el cruce individual entre las condiciones de Riesgo Intralaboral y el Nivel de Estrés detectado.</Text>
                
                <View style={styles.matrixGrid}>
                    <View style={{ ...styles.matrixBox, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#DC2626', marginBottom: 5 }}>{data.executiveSummary.priorityMatrix.group1D}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#991B1B' }}>Prioridad 1D</Text>
                        <Text style={{ fontSize: 9, color: '#B91C1C', marginTop: 5 }}>Intralaboral Alto + Estrés Alto</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#FDE047', backgroundColor: '#FEFCE8' }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#D97706', marginBottom: 5 }}>{data.executiveSummary.priorityMatrix.vulnerables}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#B45309' }}>Vulnerables</Text>
                        <Text style={{ fontSize: 9, color: '#D97706', marginTop: 5 }}>Intralaboral Bajo + Estrés Alto</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#FDBA74', backgroundColor: '#FFF7ED' }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#EA580C', marginBottom: 5 }}>{data.executiveSummary.priorityMatrix.adaptados}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C2410C' }}>Adaptados</Text>
                        <Text style={{ fontSize: 9, color: '#EA580C', marginTop: 5 }}>Intralaboral Alto + Estrés Bajo</Text>
                    </View>
                    <View style={{ ...styles.matrixBox, borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#16A34A', marginBottom: 5 }}>{data.executiveSummary.priorityMatrix.sanos}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803D' }}>Sanos</Text>
                        <Text style={{ fontSize: 9, color: '#16A34A', marginTop: 5 }}>Intralaboral Bajo + Estrés Bajo</Text>
                    </View>
                </View>

                <View style={{ ...styles.sectionTitle, marginTop: 15 }}><Text>Plan de Intervención Recomendado (SVE)</Text></View>
                {recommendationList.length > 0 ? (
                    <View style={{ marginTop: 10 }}>
                        {recommendationList.map((rec, i) => (
                            <View key={i} style={styles.bulletPoint}>
                                <Text style={styles.bulletIcon}>•</Text>
                                <Text style={styles.bulletText}>{rec.replace(/^[-\*•]\s*/, '')}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.paragraph}>El plan de intervención está en proceso de redacción o pendiente de validación.</Text>
                )}

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 (Secreto Profesional) y Res. 2346/2007 (Custodia H.C.) | Pág. ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
}
