import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from '../../lib/pdf/components/Theme';
import { Cover } from '../../lib/pdf/components/Cover';
import { ExecutiveSummary } from '../../lib/pdf/components/ExecutiveSummary';
import { DimensionDetails } from '../../lib/pdf/components/DimensionDetails';
import { IntegratedAnalysis } from '../../lib/pdf/components/IntegratedAnalysis';
import { DictionaryAppendix } from '../../lib/pdf/components/DictionaryAppendix';
import { ProfessionalSignature } from '../../lib/pdf/components/ProfessionalSignature';

interface IndividualReportPDFProps {
  primaryColor?: string;
  consultingRoomName?: string;
  logoUrl?: string;

  workerName: string;
  workerId: string;
  age?: string;
  gender?: string;
  jobTitle?: string;
  department?: string;
  tenure?: string;
  educationLevel?: string;

  orgName: string;

  psychologistName: string;
  licenseNumber: string;
  professionalCard?: string;
  sstCredential?: string;
  sstLicenseDate?: string;
  signatureImage?: string;

  overallRisk: string;
  dimensionScores: Array<{ name: string; score: number; level: string }>;
  analysis?: string;
  recommendations?: string;

  assessmentDate: string;
  reportDate: string;
  submittedTime: string;

  isAnonymous?: boolean;
  questionnaireType?: string;
}

const IndividualReportPDF = (props: IndividualReportPDFProps) => {
  const styles = getThemeStyles(props.primaryColor);
  const isInvalid = !props.sstLicenseDate;
  const legalFooter = "Documento médico-legal sujeto a reserva profesional según la Ley 1090 de 2006. Debe reposar en custodia de la historia clínica ocupacional por un periodo mínimo de 20 años (Resolución 2346 de 2007)";

  const renderInvalidBanner = () => {
    if (!isInvalid) return null;
    return (
      <View style={{ position: 'absolute', top: 50, left: -50, width: 600, transform: 'rotate(-45deg)', backgroundColor: '#EF4444', padding: 10, zIndex: 100 }} fixed>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4 }}>
          INFORME INVÁLIDO - FALTA FECHA DE EXPEDICIÓN DE LICENCIA
        </Text>
      </View>
    );
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={styles.page}>
        <Cover
          primaryColor={props.primaryColor}
          consultingRoomName={props.consultingRoomName}
          logoUrl={props.logoUrl}
          workerName={props.isAnonymous ? "TRABAJADOR ANÓNIMO" : props.workerName}
          organizationName={props.orgName}
          assessmentDate={props.assessmentDate}
          psychologistName={props.psychologistName}
        />
        {renderInvalidBanner()}
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${legalFooter} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Executive Summary Page */}
      <Page size="LETTER" style={styles.page}>
        <ExecutiveSummary
          primaryColor={props.primaryColor}
          overallRiskCategory={props.overallRisk}
          analysisText={props.analysis}
          recommendationsAIText={props.recommendations}
          questionnaireType={props.questionnaireType}
        />
        {renderInvalidBanner()}
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${legalFooter} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Dimension Details Page */}
      <Page size="LETTER" style={styles.page}>
        <DimensionDetails
          primaryColor={props.primaryColor}
          dimensions={props.dimensionScores}
          questionnaireType={props.questionnaireType}
        />
        {renderInvalidBanner()}
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${legalFooter} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Integrated Analysis Page */}
      <Page size="LETTER" style={styles.page}>
        <IntegratedAnalysis
          primaryColor={props.primaryColor}
          analysisText={props.analysis}
        />
        <ProfessionalSignature 
          primaryColor={props.primaryColor}
          psychologistName={props.psychologistName}
          licenseNumber={props.licenseNumber}
          professionalCard={props.professionalCard}
          sstCredential={props.sstCredential}
          sstLicenseDate={props.sstLicenseDate}
          signatureImage={props.signatureImage}
        />
        {renderInvalidBanner()}
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${legalFooter} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Dictionary Appendix Page */}
      <Page size="LETTER" style={styles.page}>
        <DictionaryAppendix
          primaryColor={props.primaryColor}
        />
        {renderInvalidBanner()}
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `${legalFooter} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default IndividualReportPDF;
