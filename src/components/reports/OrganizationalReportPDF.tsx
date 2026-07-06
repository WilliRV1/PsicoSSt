import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle, Rect } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Inter', backgroundColor: '#ffffff' },
    coverPage: { padding: 40, fontFamily: 'Inter', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'center' },
    coverTitle: { fontSize: 32, fontWeight: 'bold', color: '#3b82f6', marginBottom: 20 },
    coverSubtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
    coverOrg: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
    coverNit: { fontSize: 12, color: '#cbd5e1' },
    coverNote: { position: 'absolute', bottom: 50, left: 40, fontSize: 10, color: '#64748b', fontStyle: 'italic' },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 15, marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 10, color: '#64748b' },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 4 },
    paragraph: { fontSize: 10, color: '#334155', marginBottom: 8, lineHeight: 1.4 },
    
    row: { flexDirection: 'row', marginBottom: 6 },
    label: { width: 150, fontSize: 10, fontWeight: 'bold', color: '#475569' },
    value: { flex: 1, fontSize: 10, color: '#0f172a' },
    
    table: { display: 'flex', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tableHeader: { backgroundColor: '#f8fafc', padding: 5, fontSize: 9, fontWeight: 'bold', color: '#334155' },
    tableCell: { padding: 5, fontSize: 9, color: '#475569' },
    
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
    footerText: { fontSize: 8, color: '#94a3b8', textAlign: 'center' },
    
    // Gauge & Charts
    chartGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gaugeBox: { width: '48%', marginBottom: 15, alignItems: 'center' },
    gaugeTitle: { fontSize: 9, fontWeight: 'bold', color: '#334155', marginBottom: 5, textAlign: 'center', height: 25 },
    gaugeValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: -15 },
    
    // Matrix
    matrixGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    matrixBox: { width: '48%', padding: 10, marginBottom: 10, borderWidth: 1, borderRadius: 4, marginRight: '2%' },
});

// Helper for drawing an arc in SVG
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

const PDFGauge = ({ value, thresholds }: { value: number, thresholds: number[] }) => {
    const cx = 100, cy = 80, r = 60, strokeWidth = 20;
    // Thresholds: [sinRiesgo, bajo, medio, alto, muyAlto_max]
    const maxVal = thresholds[4] || 100;
    
    const getAngle = (val: number) => {
        let pct = val / maxVal;
        if (pct > 1) pct = 1;
        if (pct < 0) pct = 0;
        return pct * 180; // 0 to 180 degrees
    };

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7F1D1D'];
    let prevAngle = 0;
    
    // Draw needle
    const needleAngle = getAngle(value);
    const needleCoords = polarToCartesian(cx, cy, r - 5, needleAngle);
    
    return (
        <Svg width="200" height="100">
            {thresholds.map((th, i) => {
                const angle = getAngle(th);
                if (i === 4) return null; // last threshold is max
                const arc = describeArc(cx, cy, r, prevAngle, angle);
                const color = colors[i];
                prevAngle = angle;
                return <Path key={i} d={arc} fill="none" stroke={color} strokeWidth={strokeWidth} />;
            })}
            <Path d={describeArc(cx, cy, r, prevAngle, 180)} fill="none" stroke={colors[4]} strokeWidth={strokeWidth} />
            
            {/* Needle */}
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
    domainsFormaA: { name: string, average: number, thresholds: number[] }[];
    domainsFormaB: { name: string, average: number, thresholds: number[] }[];
    recommendations: { dimension: string, recommendation: string }[];
}

export default function OrganizationalReportPDF({ data }: { data: OrganizationalReportData }) {
    const isCritical = data.executiveSummary.criticalPercent > 30;
    const vigencia = isCritical ? "1 AÑO" : "2 AÑOS";

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

                <Text style={styles.coverNote}>
                    * Según la Resolución 2764 de 2022 del Ministerio del Trabajo de Colombia, este diagnóstico tiene una vigencia legal de {vigencia}, debido a que el riesgo global hallado requiere evaluación con esta periodicidad.
                </Text>
            </Page>

            {/* METODOLOGÍA */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Metodología y Contexto</Text>
                </View>
                
                <View style={styles.sectionTitle}><Text>Objetivos del Diagnóstico</Text></View>
                <Text style={styles.paragraph}>
                    El presente informe tiene como objetivo identificar, evaluar y analizar los factores de riesgo psicosocial intralaboral, extralaboral y de estrés de la población trabajadora, con el fin de establecer un Sistema de Vigilancia Epidemiológica (SVE) y definir planes de acción y mejora continua para el bienestar del talento humano.
                </Text>

                <View style={styles.sectionTitle}><Text>Flujograma del Proceso</Text></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 20 }}>
                    <View style={{ width: '22%', border: '1 solid #cbd5e1', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>1. Consentimiento</Text>
                        <Text style={{ fontSize: 7, color: '#475569', textAlign: 'center', marginTop: 4 }}>Firma legal de participación voluntaria y confidencialidad.</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>➔</Text>
                    <View style={{ width: '22%', border: '1 solid #cbd5e1', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>2. Aplicación</Text>
                        <Text style={{ fontSize: 7, color: '#475569', textAlign: 'center', marginTop: 4 }}>Cuestionarios de Batería BRP (Intra, Extra, Estrés).</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>➔</Text>
                    <View style={{ width: '22%', border: '1 solid #cbd5e1', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }}>3. Tabulación</Text>
                        <Text style={{ fontSize: 7, color: '#475569', textAlign: 'center', marginTop: 4 }}>Motor de cálculo PsicoSST aplicando baremación nacional.</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>➔</Text>
                    <View style={{ width: '22%', border: '1 solid #cbd5e1', padding: 8, borderRadius: 4, backgroundColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#2563eb', textAlign: 'center' }}>4. Diagnóstico</Text>
                        <Text style={{ fontSize: 7, color: '#475569', textAlign: 'center', marginTop: 4 }}>Generación de este informe e intervención SVE.</Text>
                    </View>
                </View>

                <View style={styles.sectionTitle}><Text>Glosario de Dominios Intralaborales</Text></View>
                <Text style={styles.paragraph}><Text style={{ fontWeight: 'bold' }}>• Liderazgo y Relaciones Sociales:</Text> Características de la jefatura, clima de relaciones con los compañeros y trabajo en equipo.</Text>
                <Text style={styles.paragraph}><Text style={{ fontWeight: 'bold' }}>• Control sobre el Trabajo:</Text> Margen de autonomía del trabajador sobre sus tareas, pausas, y participación en el cambio.</Text>
                <Text style={styles.paragraph}><Text style={{ fontWeight: 'bold' }}>• Demandas del Trabajo:</Text> Exigencias ambientales, cuantitativas (carga laboral), emocionales y jornadas extendidas.</Text>
                <Text style={styles.paragraph}><Text style={{ fontWeight: 'bold' }}>• Recompensas:</Text> Retribución financiera, reconocimiento, estabilidad y sentido de pertenencia.</Text>
            </Page>

            {/* DOMINIOS (GAUGES) */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}><Text style={styles.headerTitle}>Riesgo por Dominios Intralaborales (Jefaturas - Forma A)</Text></View>
                <View style={styles.chartGrid}>
                    {data.domainsFormaA.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                </View>
                {data.domainsFormaA.length === 0 && <Text style={styles.paragraph}>No hay evaluaciones de Forma A en la muestra.</Text>}

                <View style={{ ...styles.header, marginTop: 30 }}><Text style={styles.headerTitle}>Riesgo por Dominios Intralaborales (Auxiliares - Forma B)</Text></View>
                <View style={styles.chartGrid}>
                    {data.domainsFormaB.map((d, i) => (
                        <View key={i} style={styles.gaugeBox}>
                            <Text style={styles.gaugeTitle}>{d.name}</Text>
                            <PDFGauge value={d.average} thresholds={d.thresholds} />
                            <Text style={styles.gaugeValue}>{d.average}</Text>
                        </View>
                    ))}
                </View>
                {data.domainsFormaB.length === 0 && <Text style={styles.paragraph}>No hay evaluaciones de Forma B en la muestra.</Text>}
            </Page>

            {/* PLAN DE INTERVENCIÓN AUTOMATIZADO */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}><Text style={styles.headerTitle}>Plan de Intervención Recomendado</Text></View>
                <Text style={styles.paragraph}>Las siguientes recomendaciones son generadas automáticamente por el sistema basándose en las dimensiones y dominios que presentaron niveles de Riesgo Alto o Muy Alto en la evaluación organizacional.</Text>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableHeader, width: '35%' }}>Dimensión Crítica</Text>
                        <Text style={{ ...styles.tableHeader, width: '65%' }}>Acción de Intervención (SVE)</Text>
                    </View>
                    {data.recommendations.map((rec, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, width: '35%', fontWeight: 'bold' }}>{rec.dimension}</Text>
                            <Text style={{ ...styles.tableCell, width: '65%' }}>{rec.recommendation}</Text>
                        </View>
                    ))}
                    {data.recommendations.length === 0 && (
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, width: '100%', textAlign: 'center' }}>No se encontraron dimensiones en riesgo crítico.</Text>
                        </View>
                    )}
                </View>
            </Page>

            {/* MATRIZ Y CIERRE */}
            <Page size="LETTER" style={styles.page}>
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

                <View style={{ marginTop: 60, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Psicólogo(a) Especialista SST</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Este informe fue procesado automáticamente por PsicoSST con base en los resultados ingresados. Custodia médica 20 años (Resolución 2346/2007) | Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
}
