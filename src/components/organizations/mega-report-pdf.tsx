import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { getCollectiveThemeStyles } from '@/lib/pdf/components/Theme';

interface MegaReportPDFProps {
    organization: { name: string; nit: string };
    psychologist: { fullName: string; licenseNumber: string };
    settings?: any;
    workers: any[];
    generatedAt: string;
}

export const MegaReportPDF: React.FC<MegaReportPDFProps> = ({
    organization,
    psychologist,
    settings,
    workers,
    generatedAt,
}) => {
    const primaryColor = settings?.primaryColor || '#0F172A';
    // Use the existing theme but adjust for landscape if needed
    const styles = getCollectiveThemeStyles(primaryColor);

    const getRiskColor = (risk: string) => {
        if (!risk) return '#64748B';
        const upper = risk.toUpperCase();
        if (upper === 'MUY_ALTO' || upper === 'CRÍTICO') return '#EF4444';
        if (upper === 'ALTO') return '#F97316';
        if (upper === 'MEDIO') return '#EAB308';
        if (upper === 'BAJO' || upper === 'SIN_RIESGO') return '#10B981';
        return '#64748B';
    };

    return (
        <Document>
            <Page size="LETTER" orientation="landscape" style={[styles.page, { padding: 30 }]}>
                {/* HEADER */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: primaryColor, paddingBottom: 10, marginBottom: 20 }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: 700, color: primaryColor }}>Mega-Informe Organizacional Consolidado</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{organization.name} (NIT: {organization.nit})</Text>
                    </View>
                    {settings?.logoUrl && (
                        <Image src={settings.logoUrl} style={{ height: 40 }} />
                    )}
                </View>

                {/* INFO PANEL */}
                <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 4 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>Fecha de Generación</Text>
                        <Text style={{ fontSize: 11, fontWeight: 700 }}>{new Date(generatedAt).toLocaleDateString('es-CO')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>Total Evaluados</Text>
                        <Text style={{ fontSize: 11, fontWeight: 700 }}>{workers.length}</Text>
                    </View>
                    <View style={{ flex: 2 }}>
                        <Text style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>Profesional Responsable</Text>
                        <Text style={{ fontSize: 11, fontWeight: 700 }}>{psychologist.fullName} (Lic: {psychologist.licenseNumber})</Text>
                    </View>
                </View>

                <Text style={styles.body}>Esta matriz consolida la información sociodemográfica y los resultados cuantitativos de riesgo de toda la población evaluada, permitiendo un análisis cruzado de vulnerabilidades.</Text>

                {/* TABLA MEGA */}
                <View style={[styles.table, { marginTop: 15 }]}>
                    <View style={[styles.tableHeader, { backgroundColor: primaryColor }]}>
                        <Text style={[styles.th, { width: '15%', color: '#FFF' }]}>Identificación</Text>
                        <Text style={[styles.th, { width: '15%', color: '#FFF' }]}>Cargo</Text>
                        <Text style={[styles.th, { width: '15%', color: '#FFF' }]}>Área</Text>
                        <Text style={[styles.th, { width: '10%', color: '#FFF' }]}>Edad/Género</Text>
                        <Text style={[styles.th, { width: '15%', color: '#FFF', textAlign: 'center' }]}>Forma (A/B)</Text>
                        <Text style={[styles.th, { width: '15%', color: '#FFF', textAlign: 'center' }]}>Riesgo Global</Text>
                        <Text style={[styles.th, { width: '15%', color: '#FFF', textAlign: 'center' }]}>Niv. Estrés</Text>
                    </View>
                    
                    {workers.slice(0, 25).map((w, i) => {
                        let age = 'N/D';
                        if (w.birthYear) age = (new Date().getFullYear() - w.birthYear).toString();
                        
                        // Extract risks
                        let overallRisk = 'N/D';
                        let stressRisk = 'N/D';
                        let form = 'N/D';
                        
                        w.assessments?.forEach((a: any) => {
                            if (a.questionnaireType === 'STRESS') {
                                stressRisk = a.scoredResult?.overallRiskCategory || 'N/D';
                            } else {
                                overallRisk = a.scoredResult?.overallRiskCategory || 'N/D';
                                form = a.formType;
                            }
                        });

                        return (
                            <View key={i} style={styles.tableRow} wrap={false}>
                                <Text style={[styles.td, { width: '15%', fontWeight: 600, fontSize: 8 }]}>***{w.documentId.slice(-4)}</Text>
                                <Text style={[styles.td, { width: '15%', fontSize: 8 }]}>{w.jobTitle || 'N/D'}</Text>
                                <Text style={[styles.td, { width: '15%', fontSize: 8 }]}>{w.departmentArea || 'N/D'}</Text>
                                <Text style={[styles.td, { width: '10%', fontSize: 8 }]}>{age} - {w.gender ? w.gender.charAt(0).toUpperCase() : 'N/D'}</Text>
                                <Text style={[styles.td, { width: '15%', textAlign: 'center', fontSize: 8 }]}>{form}</Text>
                                <View style={{ width: '15%', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{ backgroundColor: getRiskColor(overallRisk) + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 700, color: getRiskColor(overallRisk) }}>{overallRisk.replace(/_/g, ' ')}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '15%', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{ backgroundColor: getRiskColor(stressRisk) + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 700, color: getRiskColor(stressRisk) }}>{stressRisk.replace(/_/g, ' ')}</Text>
                                    </View>
                                </View>
                            </View>
                        )
                    })}
                </View>
                
                {workers.length > 25 && (
                    <Text style={{ fontSize: 8, color: '#64748B', marginTop: 10, fontStyle: 'italic', textAlign: 'center' }}>
                        Mostrando los primeros 25 registros en el reporte preliminar. La descarga completa incluirá todos los registros.
                    </Text>
                )}

                <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                    `Documento médico-legal sujeto a reserva profesional (Ley 1090/06, Res 2346/07). | Página ${pageNumber} de ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};
