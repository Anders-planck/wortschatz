export const lightColors = {
  bg: "#F0EDE6",
  card: "#FFFFFF",
  cream: "#FAF8F4",

  textPrimary: "#2C2C2C",
  textSecondary: "#5C5650",
  textTertiary: "#8A8078",
  textMuted: "#A09890",
  textHint: "#B5AFA8",
  textGhost: "#C5BFB5",

  border: "#E8E4DD",
  borderLight: "#F0EDE8",

  der: "#C4A96A",
  die: "#D4AAA0",
  das: "#8DB58A",
  verb: "#B0A8D0",
  prep: "#A8C0D0",
  accent: "#C4943A",
  accentLight: "#F5E6C8",

  akkBg: "#F0E8D8",
  akkText: "#8A7A5A",
  datBg: "#E0ECD8",
  datText: "#5A7A50",
  genBg: "#E8E0F0",
  genText: "#7A6A8A",
  nomBg: "#E0E8F0",
  nomText: "#5A6A7A",

  againText: "#8A6058",
  chipInactive: "#F5F2EC",
} as const;

export const darkColors = {
  bg: "#1A1816",
  card: "#262320",
  cream: "#201E1B",

  textPrimary: "#E8E2D8",
  textSecondary: "#B8AFA5",
  textTertiary: "#8A8078",
  textMuted: "#6A6258",
  textHint: "#5A5248",
  textGhost: "#4A4238",

  border: "#3A3530",
  borderLight: "#2E2A26",

  der: "#D4B97A",
  die: "#E0B8AE",
  das: "#9DC59A",
  verb: "#C0B8E0",
  prep: "#B8D0E0",
  accent: "#D4A44A",
  accentLight: "#3A3020",

  akkBg: "#2E2820",
  akkText: "#C4AA78",
  datBg: "#242E22",
  datText: "#8AAA70",
  genBg: "#2A2430",
  genText: "#AA98C0",
  nomBg: "#222830",
  nomText: "#8A9AB0",

  againText: "#D08878",
  chipInactive: "#2A2622",
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof lightColors]: string;
};
