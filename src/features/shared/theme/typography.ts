import type { ThemeColors } from "./colors";
import { lightColors } from "./colors";

export const fonts = {
  display: "Outfit",
  body: "IBM Plex Sans",
  mono: "Ubuntu Sans Mono",
} as const;

export function getTextStyles(colors: ThemeColors) {
  return {
    word: {
      fontFamily: fonts.display,
      fontSize: 34,
      fontWeight: "700" as const,
      color: colors.textPrimary,
      letterSpacing: -1,
    },
    heading: {
      fontFamily: fonts.display,
      fontSize: 22,
      fontWeight: "600" as const,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      fontWeight: "400" as const,
      color: colors.textSecondary,
    },
    bodyLight: {
      fontFamily: fonts.body,
      fontSize: 13,
      fontWeight: "300" as const,
      color: colors.textTertiary,
    },
    mono: {
      fontFamily: fonts.mono,
      fontSize: 11,
      fontWeight: "500" as const,
      color: colors.textHint,
    },
    monoLabel: {
      fontFamily: fonts.mono,
      fontSize: 9,
      fontWeight: "600" as const,
      color: colors.textGhost,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
    },
  } as const;
}

// Static fallback for non-component contexts
export const textStyles = getTextStyles(lightColors);
