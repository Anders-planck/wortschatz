import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import { lightColors, darkColors, type ThemeColors } from "./colors";
import { getTextStyles } from "./typography";
import {
  getSetting,
  setSetting,
} from "@/features/settings/services/settings-repository";

export type ThemeMode = "light" | "dark" | "system";

type TextStyles = ReturnType<typeof getTextStyles>;

interface ThemeContextValue {
  colors: ThemeColors;
  textStyles: TextStyles;
  mode: ThemeMode;
  resolvedScheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  textStyles: getTextStyles(lightColors),
  mode: "system",
  resolvedScheme: "light",
  setMode: () => {},
});

const STORAGE_KEY = "themeMode";
const VALID_MODES = new Set<ThemeMode>(["light", "dark", "system"]);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">(() =>
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );
  const [loaded, setLoaded] = useState(false);

  // Listen to system theme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    getSetting(STORAGE_KEY).then((raw) => {
      if (raw && VALID_MODES.has(raw as ThemeMode)) {
        setModeState(raw as ThemeMode);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setSetting(STORAGE_KEY, next);
  }, []);

  const resolvedScheme: "light" | "dark" =
    mode === "system" ? systemScheme : mode;

  const colors = resolvedScheme === "dark" ? darkColors : lightColors;
  const textStyles = useMemo(() => getTextStyles(colors), [colors]);

  const value = useMemo(
    () => ({ colors, textStyles, mode, resolvedScheme, setMode }),
    [colors, textStyles, mode, resolvedScheme, setMode],
  );

  if (!loaded) return null;

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export { ThemeContext };

export function useThemeColors(): ThemeColors {
  return React.use(ThemeContext).colors;
}

export function useThemeMode() {
  const ctx = React.use(ThemeContext);
  return {
    mode: ctx.mode,
    setMode: ctx.setMode,
    resolvedScheme: ctx.resolvedScheme,
  };
}
