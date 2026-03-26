import React from "react";
import { ThemeContext } from "./theme-context";

export function useAppTheme() {
  const { colors, textStyles } = React.use(ThemeContext);
  return { colors, textStyles };
}
