export const fonts = {
  display: "Outfit",
  body: "IBM Plex Sans",
  mono: "Ubuntu Sans Mono",
} as const;

export const textStyles = {
  word: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: "700" as const,
    color: "#2C2C2C",
    letterSpacing: -1,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#2C2C2C",
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: "400" as const,
    color: "#5C5650",
  },
  bodyLight: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "300" as const,
    color: "#8A8078",
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#B5AFA8",
  },
  monoLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: "600" as const,
    color: "#C5BFB5",
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
} as const;
