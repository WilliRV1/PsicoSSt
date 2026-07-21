

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { getCollectiveThemeStyles } from '@/lib/pdf/components/Theme';

// Standardized colors
const colors = {
    info: '#3B82F6', // Blue
    adequate: '#10B981', // Green
    attention: '#EAB308', // Yellow
    priority: '#F97316', // Orange
    critical: '#EF4444', // Red
    neutral: '#64748B', // Gray
};

interface PDFReportProps {
    organization: { name: string; nit: string; city: string | null };
    psychologist: { fullName: string; licenseNumber: string; professionalCard: string };
    settings?: any;
    metrics: any;
    generatedAt: string;
    aiRecommendations?: string;
    aiProjectMatrix?: any[];
}

export const ExecutiveReportPDF: React.FC<PDFReportProps> = ({
    organization,
    psychologist,
    settings,
    metrics,
    generatedAt,
    aiRecommendations,
    aiProjectMatrix
}) => {
    const primaryColor = settings?.primaryColor || '#0F172A';
    const styles = getCollectiveThemeStyles(primaryColor);
    const documentId = `DOC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Helper for risk colors
    const getRiskColor = (risk: string) => {
        if (risk === "Crítico" || risk === "MUY_ALTO") return colors.critical;
        if (risk === "Alto" || risk === "ALTO") return colors.priority;
        if (risk === "Medio" || risk === "MEDIO") return colors.attention;
        if (risk === "Fortaleza" || risk === "Bajo" || risk === "SIN_RIESGO" || risk === "BAJO") return colors.adequate;
        return colors.neutral;
    };

    return (
        <Document>
            {/* PORTADA - WHITE LABEL */}
            <Page size="LETTER" style={[styles.page, { justifyContent: 'center' }]}>
                {settings?.logoUrl && (
                    <Image src={settings.logoUrl} style={{ width: 120, marginBottom: 40, alignSelf: 'center' }} />
                )}
                <View style={{ alignItems: 'center', marginBottom: 60 }}>
                    <Text style={[styles.h1, { fontSize: 32, textAlign: 'center' }]}>Informe Ejecutivo de Riesgo Psicosocial</Text>
                    <Text style={{ fontSize: 14, color: '#64748B', marginTop: 10 }}>Resumen Gerencial y Plan de Acción Estratégico</Text>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 30, width: '80%', alignSelf: 'center' }}>
                    <View style={styles.tableRow}>
                        <Text style={[styles.th, { width: '40%' }]}>Organización</Text>
                        <Text style={[styles.td, { width: '60%', fontWeight: 600, fontSize: 12 }]}>{organization.name}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.th, { width: '40%' }]}>NIT</Text>
                        <Text style={[styles.td, { width: '60%' }]}>{organization.nit}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.th, { width: '40%' }]}>Fecha de Generación</Text>
                        <Text style={[styles.td, { width: '60%' }]}>{new Date(generatedAt).toLocaleDateString('es-CO')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.th, { width: '40%' }]}>Profesional Responsable</Text>
                        <Text style={[styles.td, { width: '60%' }]}>{psychologist.fullName}</Text>
                    </View>
                </View>

                <View style={{ position: 'absolute', bottom: 50, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ fontSize: 8, color: '#94A3B8' }}>Confidencialidad: ALTA</Text>
                        <Text style={{ fontSize: 8, color: '#94A3B8' }}>ID Documento: {documentId}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 8, color: '#94A3B8', textAlign: 'right' }}>Tiempo est. de lectura: 3 min</Text>
                        {settings?.consultingRoomName && (
                            <Text style={{ fontSize: 8, color: primaryColor, textAlign: 'right', fontWeight: 600, marginTop: 2 }}>{settings.consultingRoomName}</Text>
                        )}
                    </View>
                </View>
            </Page>

            {/* RESUMEN PARA GERENCIA */}
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.headerText}>ID: {documentId} • {organization.name}</Text>
                
                <Text style={styles.h1}>Resumen para Gerencia</Text>
                <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />

                <View style={[styles.insightBox, { padding: 20, marginBottom: 20, borderLeftWidth: 4 }]}>
                    <Text style={styles.h3}>Evaluación de Intervención</Text>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>¿Requiere Intervención?</Text>
                            <Text style={[styles.value, { fontSize: 16, color: metrics.healthScore < 80 ? colors.critical : colors.adequate }]}>
                                {metrics.healthScore < 80 ? 'SÍ, INMEDIATA' : 'SÍ, PREVENTIVA'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Nivel de Urgencia</Text>
                            <Text style={[styles.value, { fontSize: 16 }]}>{metrics.healthScore < 80 ? 'ALTA' : 'MODERADA'}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.h2}>Top 3 Prioridades Estratégicas</Text>
                {metrics.topFindings.slice(0, 3).map((finding: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={{ width: '10%', justifyContent: 'center' }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{i + 1}</Text>
                            </View>
                        </View>
                        <View style={{ width: '60%', justifyContent: 'center' }}>
                            <Text style={[styles.td, { fontWeight: 600, fontSize: 11 }]}>{finding.name}</Text>
                        </View>
                        <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, color: getRiskColor(finding.risk), fontWeight: 700 }}>{finding.risk.toUpperCase()}</Text>
                        </View>
                    </View>
                ))}

                <Text style={styles.h2}>Análisis Consultivo</Text>
                <Text style={[styles.body, { fontSize: 11, lineHeight: 1.6 }]}>{aiRecommendations}</Text>

                <Text style={styles.footerText}>Página 2 de 4 • Documento Confidencial</Text>
            </Page>

            {/* EXECUTIVE DASHBOARD */}
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.headerText}>ID: {documentId} • {organization.name}</Text>
                
                <Text style={styles.h1}>Executive Dashboard</Text>
                <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ width: '48%', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={styles.label}>Health Score Organizacional</Text>
                        <Text style={{ fontSize: 48, fontWeight: 700, color: metrics.healthScore >= 80 ? colors.adequate : (metrics.healthScore >= 60 ? colors.attention : colors.critical) }}>
                            {metrics.healthScore}<Text style={{ fontSize: 16, color: '#94A3B8' }}>/100</Text>
                        </Text>
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                            {metrics.healthScore >= 80 ? 'Estable' : 'Requiere Atención'}
                        </Text>
                    </View>
                    <View style={{ width: '48%', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 8, justifyContent: 'center' }}>
                        <Text style={styles.label}>Cobertura de Evaluación</Text>
                        <Text style={{ fontSize: 24, fontWeight: 700, color: primaryColor }}>{metrics.totalEvaluated}</Text>
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Trabajadores evaluados</Text>
                    </View>
                </View>

                {metrics.protectiveFactors.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.h3}>Principales Fortalezas (Factores Protectores)</Text>
                        {metrics.protectiveFactors.map((f: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.td, { width: '80%', fontWeight: 600 }]}>{f.name}</Text>
                                <Text style={{ width: '20%', fontSize: 9, color: colors.adequate, textAlign: 'right', fontWeight: 600 }}>ADECUADO</Text>
                            </View>
                        ))}
                    </View>
                )}

                {metrics.criticalAreas && metrics.criticalAreas.length > 0 && (
                    <View style={styles.insightBox}>
                        <Text style={styles.insightTitle}>Alerta de Segmentación</Text>
                        <Text style={styles.body}>
                            El área de <Text style={{ fontWeight: 700, color: primaryColor }}>{metrics.criticalAreas[0].name}</Text> concentra la mayor densidad de riesgo, con un {metrics.criticalAreas[0].highRiskPercentage}% de su personal en niveles prioritarios.
                        </Text>
                    </View>
                )}

                <Text style={styles.footerText}>Página 3 de 4 • Documento Confidencial</Text>
            </Page>

            {/* MATRIZ DE PROYECTO (PLAN DE ACCION) */}
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.headerText}>ID: {documentId} • {organization.name}</Text>
                
                <Text style={styles.h1}>Matriz de Intervención Estratégica</Text>
                <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />

                <Text style={styles.body}>Las siguientes acciones son sugeridas con base en el análisis de las dimensiones más críticas. Deben ser validadas y ajustadas por el equipo de Talento Humano y SST.</Text>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { width: '15%' }]}>Prioridad</Text>
                        <Text style={[styles.th, { width: '40%' }]}>Acción Recomendada</Text>
                        <Text style={[styles.th, { width: '20%' }]}>Responsable</Text>
                        <Text style={[styles.th, { width: '15%' }]}>Tiempo</Text>
                        <Text style={[styles.th, { width: '10%' }]}>Impacto</Text>
                    </View>
                    
                    {aiProjectMatrix && aiProjectMatrix.map((item, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <View style={{ width: '15%' }}>
                                <Text style={{ 
                                    fontSize: 8, 
                                    fontWeight: 700,
                                    color: item.priority === 'Alta' ? colors.critical : (item.priority === 'Media' ? colors.attention : colors.adequate) 
                                }}>
                                    {item.priority ? item.priority.toUpperCase() : 'MEDIA'}
                                </Text>
                            </View>
                            <Text style={[styles.td, { width: '40%', paddingRight: 10, lineHeight: 1.3 }]}>{item.action}</Text>
                            <Text style={[styles.td, { width: '20%' }]}>{item.responsible || 'SST'}</Text>
                            <Text style={[styles.td, { width: '15%' }]}>{item.time || '30 días'}</Text>
                            <Text style={[styles.td, { width: '10%', fontWeight: 600 }]}>{item.impact || 'Alto'}</Text>
                        </View>
                    ))}
                </View>

                {/* FIRMA */}
                <View style={{ marginTop: 60, alignItems: 'center' }}>
                    {settings?.signatureUrl && (
                        <Image src={settings.signatureUrl} style={{ height: 60, marginBottom: 5 }} />
                    )}
                    <View style={{ width: 200, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
                    <Text style={{ fontSize: 10, fontWeight: 700, color: '#334155' }}>{psychologist.fullName}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B' }}>Psicólogo(a) Especialista en SST</Text>
                    <Text style={{ fontSize: 9, color: '#64748B' }}>Licencia: {psychologist.licenseNumber}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B' }}>T.P.: {psychologist.professionalCard}</Text>
                </View>

                <Text style={styles.footerText}>Página 4 de 4 • Documento Confidencial</Text>
            </Page>
        </Document>
    );
};
