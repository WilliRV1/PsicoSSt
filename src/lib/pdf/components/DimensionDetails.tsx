import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';
import { getClinicalConcept } from '../../clinical/v1/index';

interface DimensionScore {
  name: string;
  score: number;
  level: string;
}

interface DimensionDetailsProps {
  primaryColor?: string;
  dimensions: DimensionScore[];
}

export const DimensionDetails = ({
  primaryColor = '#0F172A',
  dimensions,
}: DimensionDetailsProps) => {
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

  // Sort dimensions by risk level (highest first)
  const sortedDimensions = [...dimensions].sort((a, b) => {
    const riskOrder: Record<string, number> = {
      'MUY_ALTO': 5,
      'ALTO': 4,
      'MEDIO': 3,
      'BAJO': 2,
      'SIN_RIESGO': 1
    };
    return (riskOrder[b.level] || 0) - (riskOrder[a.level] || 0);
  });

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.h1}>Resultados por Dimensión</Text>
      <View style={styles.divider} />
      <Text style={styles.body}>
        A continuación se detallan los resultados obtenidos en cada una de las dimensiones evaluadas, ordenadas por su nivel de riesgo.
      </Text>

      {sortedDimensions.map((dim, idx) => {
        const dictionaryEntry = getClinicalConcept('dimension', dim.name.toLowerCase().replace(/ /g, '_'), dim.level as any);
        const riskLabel = dim.level.replace(/_/g, ' ');
        const isHighRisk = dim.level === 'ALTO' || dim.level === 'MUY_ALTO';

        return (
          <View key={idx} style={styles.section} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderLeftWidth: 3, borderLeftColor: getRiskColor(dim.level) }}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{dim.name}</Text>
              <Text style={{ fontSize: 10, fontWeight: 700, color: getRiskColor(dim.level) }}>{riskLabel} ({dim.score.toFixed(1)})</Text>
            </View>

            {dictionaryEntry ? (
              <View style={{ marginTop: 8, paddingLeft: 10 }}>
                <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>
                  <Text style={{ fontWeight: 600 }}>Interpretación: </Text>{dictionaryEntry.interpretation}
                </Text>
                <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>
                  <Text style={{ fontWeight: 600 }}>Evidencia: </Text>{dictionaryEntry.evidence}
                </Text>

                {isHighRisk && dictionaryEntry.recommendations && dictionaryEntry.recommendations.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 600, color: primaryColor, marginBottom: 4 }}>Recomendaciones Sugeridas:</Text>
                    {dictionaryEntry.recommendations.map((rec, rIdx) => (
                      <View key={rIdx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, color: '#475569', marginRight: 4 }}>•</Text>
                        <Text style={{ fontSize: 10, color: '#475569', flex: 1 }}>{rec.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ marginTop: 8, paddingLeft: 10 }}>
                <Text style={[styles.body]}>No hay información clínica registrada para este nivel de riesgo.</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
