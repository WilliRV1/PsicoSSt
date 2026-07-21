import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';

export const darkTheme = {
  colors: {
    background: colors.primary.DEFAULT, // Dark background
    foreground: colors.primary.foreground, // Light text
    surface: colors.primary.DEFAULT,
    surfaceForeground: colors.primary.foreground,
    border: colors.primary.muted,
    primary: colors.primary.foreground,
    primaryForeground: colors.primary.DEFAULT,
    text: colors.text.inverse,
    textSecondary: colors.text.muted,
  },
  shadows: {
    card: shadows.none, // Even flatter in dark mode
    dropdown: shadows.sm,
  }
};
