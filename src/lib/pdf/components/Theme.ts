import { Font, StyleSheet } from '@react-pdf/renderer';

// Register Inter as the default premium font
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', fontWeight: 400 }, // Regular
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 600 }, // SemiBold
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 }, // Bold
  ],
});

export const getThemeStyles = (primaryColor: string = '#0F172A') => {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 50,
      fontFamily: 'Inter',
      fontSize: 10,
      color: '#334155', // Slate 700 for better readability (not pure black)
      backgroundColor: '#FFFFFF',
    },
    // Typography
    h1: {
      fontSize: 24,
      fontWeight: 700,
      color: primaryColor,
      marginBottom: 16,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 18,
      fontWeight: 600,
      color: primaryColor,
      marginTop: 20,
      marginBottom: 12,
    },
    h3: {
      fontSize: 14,
      fontWeight: 600,
      color: primaryColor,
      marginTop: 16,
      marginBottom: 8,
    },
    body: {
      fontSize: 10,
      lineHeight: 1.5,
      marginBottom: 10,
      color: '#475569',
    },
    label: {
      fontSize: 8,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: '#64748B',
      marginBottom: 4,
    },
    value: {
      fontSize: 11,
      fontWeight: 600,
      color: '#0F172A',
    },
    // Layout
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    col: {
      flexDirection: 'column',
    },
    grid2: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    grid2Item: {
      width: '48%',
      marginBottom: 12,
    },
    // Utils
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginVertical: 16,
    },
    section: {
      marginBottom: 24,
    },
    // Boxes
    card: {
      backgroundColor: '#F8FAFC', // Slate 50
      borderRadius: 4,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      marginBottom: 12,
    },
    // Footer & Header Global
    headerText: {
      fontSize: 8,
      color: '#94A3B8',
      textAlign: 'right',
    },
    footerText: {
      position: 'absolute',
      bottom: 30,
      left: 50,
      right: 50,
      fontSize: 8,
      color: '#94A3B8',
      textAlign: 'center',
      borderTopColor: '#F1F5F9',
      paddingTop: 8,
    }
  });
};

export const getCollectiveThemeStyles = (primaryColor: string = '#0F172A') => {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 50,
      fontFamily: 'Inter',
      fontSize: 10,
      color: '#334155',
      backgroundColor: '#FFFFFF', // 95% white
    },
    h1: {
      fontSize: 24,
      fontWeight: 700,
      color: primaryColor,
      marginBottom: 16,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 16,
      fontWeight: 600,
      color: primaryColor,
      marginTop: 20,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9', // Subtle gray
      paddingBottom: 4,
    },
    h3: {
      fontSize: 12,
      fontWeight: 600,
      color: '#475569',
      marginTop: 12,
      marginBottom: 6,
    },
    body: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#475569',
      marginBottom: 8,
    },
    insightBox: {
      backgroundColor: '#F8FAFC', // 4% gray
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      marginVertical: 10,
    },
    insightTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: '#64748B',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    // Metrics 
    metricCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      padding: 12,
      borderRadius: 6,
      marginBottom: 10,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 700,
      color: primaryColor,
    },
    metricLabel: {
      fontSize: 10,
      color: '#64748B',
      marginLeft: 10,
    },
    // Tables (high density)
    table: {
      width: '100%',
      marginTop: 10,
      marginBottom: 10,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      alignItems: 'center',
      minHeight: 24,
      paddingVertical: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: '#E2E8F0',
      paddingBottom: 6,
      marginBottom: 4,
    },
    th: {
      fontSize: 8,
      fontWeight: 700,
      color: '#64748B',
      textTransform: 'uppercase',
    },
    td: {
      fontSize: 9,
      color: '#334155',
    },
    // Footer & Header Global
    headerText: {
      fontSize: 8,
      color: '#94A3B8',
      textAlign: 'right',
    },
    footerText: {
      position: 'absolute',
      bottom: 30,
      left: 50,
      right: 50,
      fontSize: 8,
      color: '#94A3B8',
      textAlign: 'center',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      paddingTop: 8,
    }
  });
};
