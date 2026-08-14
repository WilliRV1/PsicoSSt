import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { getThemeStyles } from './Theme';

interface ProfessionalSignatureProps {
  primaryColor?: string;
  psychologistName: string;
  licenseNumber: string;
  professionalCard?: string;
  sstCredential?: string;
  sstLicenseDate?: string;
  signatureImage?: string;
}

export const ProfessionalSignature = ({
  primaryColor = '#0F172A',
  psychologistName,
  licenseNumber,
  professionalCard,
  sstCredential,
  sstLicenseDate,
  signatureImage,
}: ProfessionalSignatureProps) => {
  const styles = getThemeStyles(primaryColor);

  return (
    <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20, width: 300 }}>
      {signatureImage ? (
        <Image src={signatureImage} style={{ width: 150, height: 'auto', marginBottom: 10 }} />
      ) : (
        <View style={{ height: 60, justifyContent: 'flex-end', marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>Firmado electrónicamente</Text>
        </View>
      )}
      
      <Text style={{ fontSize: 12, fontWeight: 700, color: primaryColor, marginBottom: 4 }}>
        {psychologistName}
      </Text>
      
      <Text style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>
        <Text style={{ fontWeight: 600 }}>C.C. / Doc. Id.:</Text> {licenseNumber}
      </Text>
      
      {professionalCard && (
        <Text style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>
          <Text style={{ fontWeight: 600 }}>Tarjeta Profesional:</Text> {professionalCard}
        </Text>
      )}
      
      {sstCredential && (
        <Text style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>
          <Text style={{ fontWeight: 600 }}>Licencia SST:</Text> {sstCredential}
        </Text>
      )}
      
      {sstLicenseDate ? (
        <Text style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>
          <Text style={{ fontWeight: 600 }}>Fecha Expedición Licencia:</Text> {new Date(sstLicenseDate).toLocaleDateString('es-CO')}
        </Text>
      ) : (
        <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginBottom: 2 }}>
          Fecha Expedición Licencia: NO REGISTRADA
        </Text>
      )}
    </View>
  );
};
