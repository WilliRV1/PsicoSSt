import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { RiskCategory } from '@/generated/prisma';

// Register a professional font if needed, or use defaults
// Font.register({ family: 'Helvetica', src: ... });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#0051BA',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0051BA',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    backgroundColor: '#F0F4F8',
    padding: 5,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0051BA',
    borderLeft: 4,
    borderLeftColor: '#0051BA',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridItem: {
    width: '50%',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    color: '#000',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '60%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#1E88E5',
    color: '#fff',
    padding: 5,
  },
  tableColHeaderSmall: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#1E88E5',
    color: '#fff',
    padding: 5,
    textAlign: 'center',
  },
  tableCol: {
    width: '60%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColSmall: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    textAlign: 'center',
  },
  riskBadge: {
    padding: '2 6',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  MUY_ALTO: { backgroundColor: '#FFEBEE', color: '#C62828' },
  ALTO: { backgroundColor: '#FFF3E0', color: '#E65100' },
  MEDIO: { backgroundColor: '#FFFDE7', color: '#F57F17' },
  BAJO: { backgroundColor: '#E8F5E9', color: '#1B5E20' },
  SIN_RIESGO: { backgroundColor: '#E0F2F1', color: '#004D40' },
  
  signatureContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBlock: {
    width: 200,
    textAlign: 'center',
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 5,
    alignSelf: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  }
});

interface IndividualReportPDFProps {
  workerName: string;
  workerId: string;
  age?: string;
  gender?: string;
  jobTitle?: string;
  department?: string;
  orgName: string;
  psychologistName: string;
  licenseNumber: string;
  professionalCard: string;
  sstCredential: string;
  sstLicenseDate?: string;
  overallRisk: RiskCategory;
  dimensionScores: any[];
  analysis?: string;
  recommendations?: string;
  signatureImage?: string;
  assessmentDate: string;
  reportDate?: string;
}

const IndividualReportPDF: React.FC<IndividualReportPDFProps> = ({
  workerName,
  workerId,
  age,
  gender,
  jobTitle,
  department,
  orgName,
  psychologistName,
  licenseNumber,
  professionalCard,
  sstCredential,
  sstLicenseDate,
  overallRisk,
  dimensionScores,
  analysis,
  recommendations,
  signatureImage,
  assessmentDate,
  reportDate,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.title}>Informe Individual de Factores de Riesgo</Text>
            <Text style={styles.subtitle}>Batería de Instrumentos Oficial (Resolución 2764 de 2022)</Text>
          </View>
          <View style={{ textAlign: 'right', fontSize: 9, color: '#666' }}>
            <Text>Fecha de Aplicación: {assessmentDate}</Text>
            {reportDate && <Text>Fecha de Elaboración: {reportDate}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. DATOS DEMOGRÁFICOS Y OCUPACIONALES</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Trabajador: </Text><Text style={styles.value}>{workerName}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Identificación: </Text><Text style={styles.value}>{workerId}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Edad: </Text><Text style={styles.value}>{age || 'N/A'}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Sexo: </Text><Text style={styles.value}>{gender || 'N/A'}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Cargo: </Text><Text style={styles.value}>{jobTitle || 'N/A'}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Departamento/Área: </Text><Text style={styles.value}>{department || 'N/A'}</Text></Text>
          </View>
          <View style={styles.gridItem}>
            <Text><Text style={styles.label}>Empresa: </Text><Text style={styles.value}>{orgName}</Text></Text>
          </View>
        </View>
      </View>

      {/* Overall Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. RESULTADO GLOBAL DE RIESGO</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.label}>Nivel de Riesgo General:</Text>
          <View style={[styles.riskBadge, styles[overallRisk]]}>
            <Text>{overallRisk.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Dimension Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. DETALLE POR DIMENSIONES</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text>Dimensión Evaluada</Text></View>
            <View style={styles.tableColHeaderSmall}><Text>Puntaje</Text></View>
            <View style={styles.tableColHeaderSmall}><Text>Nivel</Text></View>
          </View>
          {dimensionScores.map((dim, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}><Text>{dim.name}</Text></View>
              <View style={styles.tableColSmall}><Text>{dim.score.toFixed(1)}</Text></View>
              <View style={[styles.tableColSmall, styles[dim.level as RiskCategory]]}>
                <Text style={{ fontSize: 8 }}>{dim.level.replace('_', ' ')}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Clinical Analysis */}
      {analysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ANÁLISIS CLÍNICO</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{analysis}</Text>
        </View>
      )}

      {/* Recommendations */}
      {recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. RECOMENDACIONES TÉCNICAS</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{recommendations}</Text>
        </View>
      )}

      {/* Signature */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBlock}>
          {signatureImage ? (
            <Image src={signatureImage} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60 }} />
          )}
          <View style={styles.signatureLine} />
          <Text style={{ fontWeight: 'bold' }}>{psychologistName}</Text>
          <Text>T.P.: {professionalCard || 'N/A'}</Text>
          <Text>Licencia SST: {sstCredential || licenseNumber}</Text>
          {sstLicenseDate && <Text>Fecha Exp: {new Date(sstLicenseDate).toLocaleDateString('es-CO')}</Text>}
        </View>
      </View>

      {/* Footer with Mandatory Attribution */}
      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Batería de Riesgo Psicosocial © Ministerio de la Protección Social - Pontificia Universidad Javeriana\nPsicoSST - Documento Confidencial - Página ${pageNumber} de ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);

export default IndividualReportPDF;
