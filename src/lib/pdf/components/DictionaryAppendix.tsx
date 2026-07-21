import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';

interface DictionaryAppendixProps {
  primaryColor?: string;
}

export const DictionaryAppendix = ({
  primaryColor = '#0F172A',
}: DictionaryAppendixProps) => {
  const styles = getThemeStyles(primaryColor);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.h1}>Anexo: Glosario de Dominios</Text>
      <View style={styles.divider} />
      
      <Text style={styles.body}>
        El siguiente glosario define los principales dominios evaluados por la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial del Ministerio de Trabajo de Colombia, proporcionando un marco conceptual para la correcta interpretación de este informe.
      </Text>

      <View style={[styles.section, { marginTop: 12 }]}>
        <Text style={[styles.h3, { marginBottom: 4 }]}>Demandas del Trabajo</Text>
        <Text style={styles.body}>
          Se refiere a las exigencias que el trabajo impone al individuo. Pueden ser de diversa naturaleza, como exigencias cuantitativas (cantidad de trabajo y tiempo disponible para realizarlo), cognitivas o mentales, emocionales (relacionadas con el trato con clientes o exposición a sufrimiento ajeno), de responsabilidad, o ambientales y de esfuerzo físico.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.h3, { marginBottom: 4 }]}>Control sobre el Trabajo</Text>
        <Text style={styles.body}>
          Es el margen de decisión que tiene un trabajador sobre cómo y cuándo realizar sus tareas (autonomía), la oportunidad de aplicar y desarrollar sus habilidades, su participación en la toma de decisiones relativas a su trabajo, y la claridad que tiene sobre su rol en la organización.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.h3, { marginBottom: 4 }]}>Liderazgo y Relaciones Sociales</Text>
        <Text style={styles.body}>
          Comprende la calidad de la relación con los superiores (liderazgo), el apoyo social recibido de compañeros y jefes, la cohesión del equipo de trabajo, y la retroalimentación sobre el desempeño. Un buen liderazgo y relaciones positivas actúan como amortiguadores frente a las demandas del trabajo.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.h3, { marginBottom: 4 }]}>Recompensas</Text>
        <Text style={styles.body}>
          Hace referencia al conjunto de retribuciones que el trabajador obtiene a cambio de su esfuerzo. No se limita únicamente a la compensación económica, sino que abarca el reconocimiento, las oportunidades de desarrollo, el sentimiento de orgullo, y la estabilidad y seguridad en el empleo.
        </Text>
      </View>
    </View>
  );
};
