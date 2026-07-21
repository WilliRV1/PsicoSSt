

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { getCollectiveThemeStyles } from '@/lib/pdf/components/Theme';

// Standardized colors
const colors = {
    info: '#3B82F6', 
    adequate: '#10B981', 
    attention: '#EAB308', 
    priority: '#F97316', 
    critical: '#EF4444', 
    neutral: '#64748B', 
};

interface PDFReportProps {
    organization: { name: string; nit: string; city: string | null };
    psychologist: { fullName: string; licenseNumber: string; professionalCard: string };
    settings?: any;
    metrics: any;
    generatedAt: string;
}

export const TechnicalReportPDF: React.FC<PDFReportProps> = ({
    organization,
    psychologist,
    settings,
    metrics,
    generatedAt
}) => {
    const primaryColor = settings?.primaryColor || '#0F172A';
    const styles = getCollectiveThemeStyles(primaryColor);
    const documentId = `TECH-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const renderTableRows = (dataRecord: Record<string, any>) => {
        return Object.entries(dataRecord).map(([name, counts], idx) => {
            const total = counts.total || 1; // Prevent division by zero
            return (
                <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.td, { width: '35%', fontWeight: 600 }]}>{name}</Text>
                    <Text style={[styles.td, { width: '13%', textAlign: 'center' }]}>{counts.sinRiesgo} ({Math.round(counts.sinRiesgo/total*100)}%)</Text>
                    <Text style={[styles.td, { width: '13%', textAlign: 'center' }]}>{counts.bajo} ({Math.round(counts.bajo/total*100)}%)</Text>
                    <Text style={[styles.td, { width: '13%', textAlign: 'center' }]}>{counts.medio} ({Math.round(counts.medio/total*100)}%)</Text>
                    <Text style={[styles.td, { width: '13%', textAlign: 'center' }]}>{counts.alto} ({Math.round(counts.alto/total*100)}%)</Text>
                    <Text style={[styles.td, { width: '13%', textAlign: 'center', color: colors.critical, fontWeight: 700 }]}>{counts.muyAlto} ({Math.round(counts.muyAlto/total*100)}%)</Text>
                </View>
            );
        });
    };

    return (
        <Document>
            {/* PORTADA - WHITE LABEL */}
            <Page size="LETTER" style={[styles.page, { justifyContent: 'center' }]}>
                {settings?.logoUrl && (
                    <Image src={settings.logoUrl} style={{ width: 120, marginBottom: 40, alignSelf: 'center' }} />
                )}
                <View style={{ alignItems: 'center', marginBottom: 60 }}>
                    <Text style={[styles.h1, { fontSize: 32, textAlign: 'center' }]}>Informe Técnico de Riesgo Psicosocial</Text>
                    <Text style={{ fontSize: 14, color: '#64748B', marginTop: 10 }}>Resultados Detallados, Dominios y Dimensiones</Text>
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
                        <Text style={[styles.th, { width: '40%' }]}>Trabajadores Evaluados</Text>
                        <Text style={[styles.td, { width: '60%' }]}>{metrics.totalEvaluated}</Text>
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
                        <Text style={{ fontSize: 8, color: '#94A3B8' }}>Uso Exclusivo: PSICOLOGÍA SST</Text>
                        <Text style={{ fontSize: 8, color: '#94A3B8' }}>ID Documento: {documentId}</Text>
                    </View>
                    <View>
                        {settings?.consultingRoomName && (
                            <Text style={{ fontSize: 8, color: primaryColor, textAlign: 'right', fontWeight: 600, marginTop: 2 }}>{settings.consultingRoomName}</Text>
                        )}
                    </View>
                </View>
            </Page>

            {/* DOMINIOS - TABLA DE ALTA DENSIDAD */}
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.headerText}>ID: {documentId} • {organization.name}</Text>
                
                <Text style={styles.h1}>Resultados por Dominio</Text>
                <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />

                <Text style={styles.body}>La siguiente tabla de contingencia presenta la distribución poblacional (frecuencia y porcentaje) para cada uno de los dominios evaluados, clasificando a los trabajadores en los cinco niveles de riesgo establecidos por el manual del Ministerio del Trabajo.</Text>

                <View style={[styles.table, { marginTop: 20 }]}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { width: '35%' }]}>Dominio Evaluado</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center', color: colors.adequate }]}>Sin Riesgo</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center', color: colors.adequate }]}>Bajo</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center', color: colors.attention }]}>Medio</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center', color: colors.priority }]}>Alto</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center', color: colors.critical }]}>Muy Alto</Text>
                    </View>
                    
                    {renderTableRows(metrics.rawDomains)}
                </View>

                <Text style={styles.footerText}>Página 2 • Informe Técnico Confidencial</Text>
            </Page>

            {/* DIMENSIONES - TABLA DE ALTA DENSIDAD */}
            <Page size="LETTER" style={styles.page}>
                <Text style={styles.headerText}>ID: {documentId} • {organization.name}</Text>
                
                <Text style={styles.h1}>Resultados por Dimensión</Text>
                <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />

                <Text style={styles.body}>Desglose pormenorizado de todas las dimensiones intralaborales y extralaborales. Las dimensiones constituyen la unidad de análisis más específica para orientar las acciones de intervención clínica e institucional.</Text>

                <View style={[styles.table, { marginTop: 20 }]}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { width: '35%' }]}>Dimensión Evaluada</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center' }]}>Sin Riesgo</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center' }]}>Bajo</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center' }]}>Medio</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center' }]}>Alto</Text>
                        <Text style={[styles.th, { width: '13%', textAlign: 'center' }]}>Muy Alto</Text>
                    </View>
                    
                    {renderTableRows(metrics.rawDimensions)}
                </View>

                {/* FIRMA TÉCNICA */}
                <View style={{ marginTop: 60, alignItems: 'flex-end', paddingRight: 40 }}>
                    {settings?.signatureUrl && (
                        <Image src={settings.signatureUrl} style={{ height: 60, marginBottom: 5 }} />
                    )}
                    <View style={{ width: 200, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
                    <Text style={{ fontSize: 10, fontWeight: 700, color: '#334155', textAlign: 'right' }}>{psychologist.fullName}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B', textAlign: 'right' }}>Psicólogo(a) Especialista en SST</Text>
                    <Text style={{ fontSize: 9, color: '#64748B', textAlign: 'right' }}>Licencia: {psychologist.licenseNumber}</Text>
                </View>

                <Text style={styles.footerText}>Página 3 • Informe Técnico Confidencial</Text>
            </Page>
        </Document>
    );
};
