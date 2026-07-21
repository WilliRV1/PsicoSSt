import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';

interface ExecutiveSummaryProps {
  primaryColor?: string;
  overallRiskCategory: string;
  analysisText?: string;
  recommendationsAIText?: string;
}

export const ExecutiveSummary = ({
  primaryColor = '#0F172A',
  overallRiskCategory,
  analysisText,
  recommendationsAIText,
}: ExecutiveSummaryProps) => {
  const styles = getThemeStyles(primaryColor);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'MUY_ALTO': return '#C62828';
      case 'ALTO': return '#D84315';
      case 'MEDIO': return '#F57F17';
      case 'BAJO': return '#1B5E20';
      case 'SIN_RIESGO': return '#2E7D32';
      default: return '#64748B';
    }
  };

  const getRiskBackground = (level: string) => {
    switch (level) {
      case 'MUY_ALTO': return '#FFEBEE';
      case 'ALTO': return '#FBE9E7';
      case 'MEDIO': return '#FFF8E1';
      case 'BAJO': return '#E8F5E9';
      case 'SIN_RIESGO': return '#E8F5E9';
      default: return '#F1F5F9';
    }
  };

  const riskLabel = overallRiskCategory.replace(/_/g, ' ');

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.h1}>Resumen Ejecutivo</Text>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.h3}>Nivel de Riesgo Global</Text>
        <View style={{ 
          backgroundColor: getRiskBackground(overallRiskCategory), 
          padding: 16, 
          borderRadius: 4, 
          marginTop: 8,
          borderLeftWidth: 4,
          borderLeftColor: getRiskColor(overallRiskCategory)
        }}>
          <Text style={{ fontSize: 18, fontWeight: 700, color: getRiskColor(overallRiskCategory), textTransform: 'uppercase' }}>
            {riskLabel}
          </Text>
          <Text style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>
            Este nivel indica la exposición general del trabajador a factores de riesgo psicosocial intra y extralaboral.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h3}>Análisis del Evaluador</Text>
        {analysisText ? (
          <Text style={styles.body}>{analysisText}</Text>
        ) : (
          <Text style={[styles.body, { fontStyle: 'italic', color: '#94A3B8' }]}>
            No se ha proporcionado un análisis cualitativo para esta evaluación.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.h3}>Recomendaciones Principales (Asistidas por IA)</Text>
        {recommendationsAIText ? (
          <View style={styles.card}>
            <Text style={styles.body}>{recommendationsAIText}</Text>
          </View>
        ) : (
          <Text style={[styles.body, { fontStyle: 'italic', color: '#94A3B8' }]}>
            Las recomendaciones se detallarán en las secciones correspondientes de cada dimensión.
          </Text>
        )}
      </View>
    </View>
  );
};
