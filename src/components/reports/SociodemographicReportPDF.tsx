import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { SociodemographicData } from './SociodemographicReport';

// Define the data interface that extends SociodemographicData with Org info
export interface SociodemographicPDFData extends SociodemographicData {
    orgInfo: {
        organizationName: string;
        organizationNit: string;
        psychologistName: string;
        psychologistLicense: string;
        reportDate: string;
    }
}

// Register fonts
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400, fontStyle: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700, fontStyle: 'normal' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400, fontStyle: 'italic' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700, fontStyle: 'italic' }
    ]
});

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Inter', backgroundColor: '#ffffff' },
    coverPage: { padding: 60, fontFamily: 'Inter', backgroundColor: '#f8fafc', justifyContent: 'center' },
    coverTitle: { fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
    coverSubtitle: { fontSize: 16, color: '#475569', marginBottom: 40 },
    coverOrg: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    coverNit: { fontSize: 12, color: '#64748b', marginTop: 5 },
    coverNote: { fontSize: 10, color: '#94a3b8', position: 'absolute', bottom: 60, left: 60, right: 60 },
    invalidBlock: { marginTop: 30, backgroundColor: '#fee2e2', border: '2 solid #dc2626', padding: 15, borderRadius: 8 },
    invalidTitle: { fontSize: 14, fontWeight: 'bold', color: '#b91c1c', textAlign: 'center' },
    invalidDesc: { fontSize: 10, color: '#991b1b', textAlign: 'center', marginTop: 8 },
    invalidSub: { fontSize: 8, color: '#7f1d1d', textAlign: 'center', marginTop: 4 },
    header: { borderBottom: '1 solid #e2e8f0', paddingBottom: 10, marginBottom: 20 },
    headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, marginTop: 20 },
    paragraph: { fontSize: 10, color: '#475569', lineHeight: 1.5, marginBottom: 15 },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#94a3b8', textAlign: 'center', borderTop: '1 solid #f1f5f9', paddingTop: 10 },
    table: { display: 'flex', flexDirection: 'column', width: '100%', borderTop: '1 solid #e2e8f0', borderLeft: '1 solid #e2e8f0' },
    tableRow: { display: 'flex', flexDirection: 'row', borderBottom: '1 solid #e2e8f0' },
    tableHeader: { backgroundColor: '#f1f5f9', padding: 5, fontSize: 10, fontWeight: 'bold', color: '#334155', borderRight: '1 solid #e2e8f0' },
    tableCell: { padding: 5, fontSize: 10, color: '#475569', borderRight: '1 solid #e2e8f0' },
    colName: { width: '70%' },
    colValue: { width: '30%', textAlign: 'center' },
    grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { width: '48%', marginBottom: 15 }
});

const DataList = ({ title, data }: { title: string, data: { name: string, value: number }[] }) => {
    // Only show top 5 items + "Otros" if there are many, or just show all if short
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const displayData = sorted.slice(0, 7);
    
    return (
        <View style={styles.gridItem}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 5 }}>{title}</Text>
            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <Text style={[styles.tableHeader, styles.colName]}>Categoría</Text>
                    <Text style={[styles.tableHeader, styles.colValue]}>Cantidad</Text>
                </View>
                {displayData.map((item, i) => (
                    <View style={styles.tableRow} key={i}>
                        <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
                        <Text style={[styles.tableCell, styles.colValue]}>{item.value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function SociodemographicReportPDF({ data }: { data: SociodemographicPDFData }) {
    const isInvalid = !data.orgInfo.psychologistLicense || data.orgInfo.psychologistLicense.trim() === '';

    return (
        <Document>
            {/* PORTADA */}
            <Page size="LETTER" style={styles.coverPage}>
                <Text style={styles.coverTitle}>Informe Sociodemográfico y Ocupacional</Text>
                <Text style={styles.coverSubtitle}>Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)</Text>
                
                <View style={{ marginTop: 60 }}>
                    <Text style={styles.coverOrg}>{data.orgInfo.organizationName}</Text>
                    <Text style={styles.coverNit}>NIT: {data.orgInfo.organizationNit}</Text>
                    <Text style={{ ...styles.coverNit, marginTop: 10 }}>Población Evaluada: {data.totalWorkers} trabajadores</Text>
                    <Text style={styles.coverNit}>Fecha de Emisión: {data.orgInfo.reportDate}</Text>
                </View>

                <View style={{ marginTop: 60 }}>
                    <Text style={styles.coverNit}>Preparado por:</Text>
                    <Text style={{ ...styles.coverOrg, fontSize: 16 }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={styles.coverNit}>Licencia SST: {data.orgInfo.psychologistLicense}</Text>
                </View>

                {isInvalid && (
                    <View style={styles.invalidBlock}>
                        <Text style={styles.invalidTitle}>INFORME INVÁLIDO</Text>
                        <Text style={styles.invalidDesc}>Carencia de Fecha de Expedición de Licencia SST según manual técnico.</Text>
                        <Text style={styles.invalidSub}>Todo informe que carezca de estos datos no será válido.</Text>
                    </View>
                )}

                <Text style={styles.coverNote}>
                    Este informe constituye la línea base poblacional (fase "Hacer" del ciclo PHVA) para el diseño de programas de bienestar y riesgo psicosocial.
                </Text>
            </Page>

            {/* SECCION 1: SOCIODEMOGRAFICO */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}><Text style={styles.headerTitle}>1. Perfil Sociodemográfico</Text></View>
                
                <Text style={styles.paragraph}>
                    El siguiente apartado detalla la conformación sociodemográfica de la población laboral evaluada ({data.totalWorkers} trabajadores). Esta información es fundamental para diseñar metodologías de intervención con enfoque diferencial (por ejemplo, andragogía para niveles educativos básicos) y para comprender las vulnerabilidades extralaborales que afectan a la organización.
                </Text>

                <View style={styles.grid}>
                    <DataList title="Distribución por Sexo" data={data.sociodemographic.gender} />
                    <DataList title="Rangos de Edad" data={data.sociodemographic.age} />
                    <DataList title="Nivel Educativo" data={data.sociodemographic.education} />
                    <DataList title="Estado Civil" data={data.sociodemographic.maritalStatus} />
                    <DataList title="Personas a Cargo" data={data.sociodemographic.dependents} />
                    <DataList title="Tipo de Vivienda" data={data.sociodemographic.housing} />
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 de 2006 (Secreto Profesional) y Resolución 2346/2007 (Custodia Historia Clínica 20 años) | Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>

            {/* SECCION 2: OCUPACIONAL */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}><Text style={styles.headerTitle}>2. Perfil Ocupacional e Indicadores de Riesgo</Text></View>
                
                <Text style={styles.paragraph}>
                    El perfil ocupacional expone la exposición técnica al riesgo intralaboral. Se analizan tiempos de exposición (antigüedad) y variables estructurales del trabajo (jornada, tipo de contrato y nivel jerárquico).
                </Text>

                <View style={styles.grid}>
                    <DataList title="Antigüedad en la Empresa" data={data.occupational.seniorityCompany} />
                    <DataList title="Antigüedad en el Cargo Actual" data={data.occupational.seniorityRole} />
                    <DataList title="Nivel del Cargo" data={data.occupational.roleLevel} />
                    <DataList title="Tipo de Contrato" data={data.occupational.contractType} />
                    <DataList title="Horas Diarias (Jornada)" data={data.occupational.hoursPerDay} />
                    <DataList title="Modalidad de Pago" data={data.occupational.paymentModality} />
                </View>

                {(data.alerts.fatigueRisk || data.alerts.highTurnoverRisk) && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#dc2626', marginBottom: 5 }}>Alertas de Tendencia Crítica detectadas:</Text>
                        
                        {data.alerts.fatigueRisk && (
                            <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 5, marginBottom: 5 }}>
                                <Text style={{ fontSize: 10, color: '#991b1b', fontWeight: 'bold' }}>Riesgo de Fatiga Laboral:</Text>
                                <Text style={{ fontSize: 9, color: '#b91c1c' }}>Más del 30% de la población reporta jornadas superiores a 8 horas diarias. Se sugiere revisar la distribución de la carga cuantitativa.</Text>
                            </View>
                        )}

                        {data.alerts.highTurnoverRisk && (
                            <View style={{ backgroundColor: '#fff7ed', padding: 10, borderRadius: 5 }}>
                                <Text style={{ fontSize: 10, color: '#9a3412', fontWeight: 'bold' }}>Riesgo de Curva de Aprendizaje:</Text>
                                <Text style={{ fontSize: 9, color: '#c2410c' }}>Más del 40% de la población tiene menos de 6 meses en su cargo actual, incrementando la vulnerabilidad por falta de experiencia en el rol.</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>{data.orgInfo.psychologistName}</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Psicólogo(a) Especialista SST</Text>
                    <Text style={{ fontSize: 10, color: '#475569' }}>Licencia: {data.orgInfo.psychologistLicense}</Text>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Ley 1090 de 2006 (Secreto Profesional) y Resolución 2346/2007 (Custodia Historia Clínica 20 años) | Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
}
