import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from '../../lib/pdf/components/Theme';
import { Cover } from '../../lib/pdf/components/Cover';
import { ExecutiveSummary } from '../../lib/pdf/components/ExecutiveSummary';
import { DimensionDetails } from '../../lib/pdf/components/DimensionDetails';
import { IntegratedAnalysis } from '../../lib/pdf/components/IntegratedAnalysis';
import { DictionaryAppendix } from '../../lib/pdf/components/DictionaryAppendix';

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
}

const IndividualReportPDF = (props: IndividualReportPDFProps) => {
  const styles = getThemeStyles(props.primaryColor);

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
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Generado con PsicoSST • Software para Evaluación Psicosocial | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Executive Summary Page */}
      <Page size="LETTER" style={styles.page}>
        <ExecutiveSummary
          primaryColor={props.primaryColor}
          overallRiskCategory={props.overallRisk}
          analysisText={props.analysis}
          recommendationsAIText={props.recommendations}
        />
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Generado con PsicoSST • Software para Evaluación Psicosocial | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Dimension Details Page */}
      <Page size="LETTER" style={styles.page}>
        <DimensionDetails
          primaryColor={props.primaryColor}
          dimensions={props.dimensionScores}
        />
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Generado con PsicoSST • Software para Evaluación Psicosocial | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Integrated Analysis Page */}
      <Page size="LETTER" style={styles.page}>
        <IntegratedAnalysis
          primaryColor={props.primaryColor}
          analysisText={props.analysis}
        />
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Generado con PsicoSST • Software para Evaluación Psicosocial | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* Dictionary Appendix Page */}
      <Page size="LETTER" style={styles.page}>
        <DictionaryAppendix
          primaryColor={props.primaryColor}
        />
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Generado con PsicoSST • Software para Evaluación Psicosocial | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default IndividualReportPDF;
