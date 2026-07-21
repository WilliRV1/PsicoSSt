import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

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
    page: {
        padding: 40,
        fontFamily: 'Inter',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 15,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 10,
        backgroundColor: '#f1f5f9',
        padding: 6,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    label: {
        width: 150,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    value: {
        flex: 1,
        fontSize: 10,
        color: '#0f172a',
    },
    chartContainer: {
        marginVertical: 15,
        alignItems: 'center',
    },
    chartImage: {
        width: '100%',
        maxWidth: 500,
        maxHeight: 300,
        objectFit: 'contain',
    },
    chartCaption: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
        textAlign: 'center',
    }
});

export interface CollectiveReportPDFProps {
    organizationName: string;
    organizationNit: string;
    organizationCity: string;
    psychologistName: string;
    psychologistLicense: string;
    totalWorkers: number;
    reportDate: string;
    chartImages: {
        generalRisk?: string;
        riskByArea?: string;
        riskByJob?: string;
    };
}

export default function CollectiveReportPDF({
    organizationName,
    organizationNit,
    organizationCity,
    psychologistName,
    psychologistLicense,
    totalWorkers,
    reportDate,
    chartImages
}: CollectiveReportPDFProps) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Diagnóstico Psicosocial Grupal</Text>
                        <Text style={styles.headerSubtitle}>Informe Ejecutivo - Batería Riesgo Psicosocial</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>PsicoSST</Text>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{reportDate}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Información de la Empresa</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Razón Social:</Text>
                        <Text style={styles.value}>{organizationName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>NIT:</Text>
                        <Text style={styles.value}>{organizationNit}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ciudad / Departamento:</Text>
                        <Text style={styles.value}>{organizationCity || "No registrada"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trabajadores Evaluados:</Text>
                        <Text style={styles.value}>{totalWorkers}</Text>
                    </View>
                </View>

                {chartImages.generalRisk && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Distribución de Riesgo General</Text>
                        <View style={styles.chartContainer}>
                            <Image src={chartImages.generalRisk} style={styles.chartImage} />
                            <Text style={styles.chartCaption}>Proporción de trabajadores según nivel de riesgo global.</Text>
                        </View>
                    </View>
                )}

                {(chartImages.riskByArea || chartImages.riskByJob) && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>3. Segmentación del Riesgo</Text>
                        
                        {chartImages.riskByArea && (
                            <View style={styles.chartContainer}>
                                <Image src={chartImages.riskByArea} style={styles.chartImage} />
                                <Text style={styles.chartCaption}>Prevalencia de riesgo muy alto/alto por área o departamento.</Text>
                            </View>
                        )}

                        {chartImages.riskByJob && (
                            <View style={styles.chartContainer}>
                                <Image src={chartImages.riskByJob} style={styles.chartImage} />
                                <Text style={styles.chartCaption}>Prevalencia de riesgo muy alto/alto por cargo.</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Responsable Técnico</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Psicólogo(a) Especialista:</Text>
                        <Text style={styles.value}>{psychologistName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Licencia SST:</Text>
                        <Text style={styles.value}>{psychologistLicense || "No especificada"}</Text>
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        Este informe ha sido generado automáticamente por el sistema PsicoSST con base en los resultados procesados de los trabajadores. 
                        Los datos aquí presentados deben ser interpretados estrictamente por el especialista en Seguridad y Salud en el Trabajo.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
