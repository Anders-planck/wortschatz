import {
  DefaultTheme,
  DarkTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import React from "react";
import { Appearance } from "react-native";
import { useRouter } from "expo-router";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import {
  ThemeProvider,
  ThemeContext,
} from "@/features/shared/theme/theme-context";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, resolvedScheme } = React.use(ThemeContext);
  const router = useRouter();

  useEffect(() => {
    Appearance.setColorScheme(resolvedScheme);
  }, [resolvedScheme]);

  // Navigate to review tab when tapping the notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen;
        if (typeof screen === "string") {
          router.navigate(screen as never);
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  const navTheme = useMemo(() => {
    const base = resolvedScheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.card,
        text: colors.textPrimary,
        border: colors.border,
      },
    };
  }, [colors, resolvedScheme]);

  return (
    <NavThemeProvider value={navTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit: require("../../assets/fonts/Outfit-VariableFont_wght.ttf"),
    "IBMPlexSans-Light": require("../../assets/fonts/IBMPlexSans-Light.ttf"),
    "IBMPlexSans-Regular": require("../../assets/fonts/IBMPlexSans-Regular.ttf"),
    "IBMPlexSans-Medium": require("../../assets/fonts/IBMPlexSans-Medium.ttf"),
    "UbuntuSansMono-Regular": require("../../assets/fonts/UbuntuSansMono-Regular.ttf"),
    "UbuntuSansMono-Medium": require("../../assets/fonts/UbuntuSansMono-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
