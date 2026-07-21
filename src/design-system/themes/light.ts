import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';

export const lightTheme = {
  colors: {
    background: colors.background,
    foreground: colors.foreground,
    surface: colors.surface.DEFAULT,
    surfaceForeground: colors.surface.foreground,
    border: colors.border.DEFAULT,
    primary: colors.primary.DEFAULT,
    primaryForeground: colors.primary.foreground,
    text: colors.text.DEFAULT,
    textSecondary: colors.text.secondary,
    // Add mapping specifically for Tailwind variables
  },
  shadows: {
    card: shadows.sm,
    dropdown: shadows.md,
  }
};
