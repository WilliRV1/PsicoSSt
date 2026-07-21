import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';

interface CoverProps {
  primaryColor?: string;
  consultingRoomName?: string;
  logoUrl?: string;
  workerName: string;
  organizationName: string;
  assessmentDate: string;
  psychologistName: string;
}

export const Cover = ({
  primaryColor = '#0F172A',
  consultingRoomName = 'Consultorio Especializado',
  logoUrl,
  workerName,
  organizationName,
  assessmentDate,
  psychologistName,
}: CoverProps) => {
  const styles = getThemeStyles(primaryColor);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }}>
      {/* Top section: Branding */}
      <View style={{ position: 'absolute', top: 60, left: 50, right: 50, alignItems: 'center' }}>
        {logoUrl ? (
          <Image src={logoUrl} style={{ width: 120, height: 'auto', marginBottom: 20 }} />
        ) : null}
        <Text style={{ fontSize: 16, fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: 1 }}>
          {consultingRoomName}
        </Text>
      </View>

      {/* Center section: Title and details */}
      <View style={{ width: '100%', alignItems: 'flex-start', marginTop: 100 }}>
        <View style={{ width: 40, height: 4, backgroundColor: primaryColor, marginBottom: 20 }} />
        <Text style={{ fontSize: 32, fontWeight: 700, color: primaryColor, marginBottom: 8, lineHeight: 1.2 }}>
          Evaluación de
        </Text>
        <Text style={{ fontSize: 32, fontWeight: 700, color: primaryColor, marginBottom: 40, lineHeight: 1.2 }}>
          Riesgo Psicosocial
        </Text>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.label}>Trabajador Evaluado</Text>
          <Text style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{workerName}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.label}>Organización</Text>
          <Text style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{organizationName}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.label}>Fecha de Aplicación</Text>
          <Text style={{ fontSize: 12, color: '#475569' }}>{assessmentDate}</Text>
        </View>
      </View>

      {/* Bottom section: Professional */}
      <View style={{ position: 'absolute', bottom: 100, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20 }}>
        <Text style={styles.label}>Profesional Responsable</Text>
        <Text style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{psychologistName}</Text>
      </View>
    </View>
  );
};
