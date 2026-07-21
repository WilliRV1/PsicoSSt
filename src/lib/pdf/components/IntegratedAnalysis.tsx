import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';

interface IntegratedAnalysisProps {
  primaryColor?: string;
  analysisText?: string;
}

export const IntegratedAnalysis = ({
  primaryColor = '#0F172A',
  analysisText,
}: IntegratedAnalysisProps) => {
  const styles = getThemeStyles(primaryColor);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.h1}>Análisis Integrado</Text>
      <View style={styles.divider} />
      
      <Text style={styles.body}>
        El siguiente análisis integrado consolida los hallazgos cuantitativos y cualitativos, ofreciendo una perspectiva holística de la situación psicosocial del trabajador, en correlación con las demandas intralaborales y extralaborales identificadas.
      </Text>

      {analysisText ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.body}>{analysisText}</Text>
        </View>
      ) : (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={[styles.body, { fontStyle: 'italic', color: '#94A3B8' }]}>
            El evaluador no ha redactado un análisis integrado para esta evaluación.
          </Text>
        </View>
      )}
    </View>
  );
};
