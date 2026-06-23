"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderColor: '#1e3a8a',
        paddingBottom: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 5,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginTop: 15,
        marginBottom: 10,
        borderBottom: 1,
        borderColor: '#e2e8f0',
        paddingBottom: 5,
    },
    paragraph: {
        fontSize: 12,
        lineHeight: 1.5,
        color: '#334155',
        marginBottom: 10,
    },
    dataRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    dataLabel: {
        width: 150,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    dataValue: {
        flex: 1,
        fontSize: 12,
        color: '#0f172a',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
        borderTop: 1,
        borderColor: '#e2e8f0',
        paddingTop: 10,
    },
    signatureContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    signatureLine: {
        width: 200,
        borderBottom: 1,
        borderColor: '#000',
        marginBottom: 5,
    },
    signatureText: {
        fontSize: 12,
        color: '#334155',
    }
});

interface PDFReportProps {
    organization: { name: string; nit: string; city: string | null };
    psychologist: { fullName: string; licenseNumber: string; professionalCard: string };
    totalWorkers: number;
    generatedAt: string;
    aiRecommendations?: string;
    // Add more props for charts and detailed stats later
}

export const CollectiveDiagnosticPDF: React.FC<PDFReportProps> = ({
    organization,
    psychologist,
    totalWorkers,
    generatedAt,
    aiRecommendations
}) => {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>INFORME DE DIAGNÓSTICO COLECTIVO</Text>
                    <Text style={styles.subtitle}>Factores de Riesgo Psicosocial</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Información General</Text>
                    
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Empresa:</Text>
                        <Text style={styles.dataValue}>{organization.name}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>NIT:</Text>
                        <Text style={styles.dataValue}>{organization.nit}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Ciudad:</Text>
                        <Text style={styles.dataValue}>{organization.city || 'No especificada'}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Trabajadores Evaluados:</Text>
                        <Text style={styles.dataValue}>{totalWorkers}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Fecha de Generación:</Text>
                        <Text style={styles.dataValue}>{new Date(generatedAt).toLocaleDateString('es-CO')}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Marco Legal y Cumplimiento</Text>
                    <Text style={styles.paragraph}>
                        El presente informe da cumplimiento a lo establecido en la Resolución 2646 de 2008 y la Resolución 2764 de 2022 del Ministerio del Trabajo de Colombia, las cuales dictan disposiciones y definen responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial en el trabajo.
                    </Text>
                    <Text style={styles.paragraph}>
                        La custodia de estos instrumentos y de la información sensible aquí consolidada se rige bajo el estricto cumplimiento de la Ley 1090 de 2006 (Código Deontológico y Bioético del Psicólogo) y la Ley Estatutaria 1581 de 2012 (Protección de Datos Personales).
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Plan de Acción y Recomendaciones</Text>
                    {aiRecommendations ? (
                        <Text style={styles.paragraph}>{aiRecommendations}</Text>
                    ) : (
                        <Text style={styles.paragraph}>Las recomendaciones específicas se generarán con base en los hallazgos críticos de la evaluación.</Text>
                    )}
                </View>

                <View style={styles.signatureContainer}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureText}>{psychologist.fullName}</Text>
                    <Text style={styles.signatureText}>Psicólogo(a) Especialista en SST</Text>
                    <Text style={styles.signatureText}>Licencia: {psychologist.licenseNumber}</Text>
                    <Text style={styles.signatureText}>T.P.: {psychologist.professionalCard}</Text>
                </View>

                <Text style={styles.footer} fixed>
                    Este documento es estrictamente confidencial. Generado automáticamente por PsicoSST.
                </Text>
            </Page>
        </Document>
    );
};
