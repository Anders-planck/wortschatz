import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useThemeColors } from "@/features/shared/theme/theme-context";

export function useThemedStackOptions(): NativeStackNavigationOptions {
  const colors = useThemeColors();

  return {
    headerBackButtonDisplayMode: "minimal",
    headerTransparent: true,
    headerTintColor: colors.textPrimary,
    headerLargeTitleStyle: { color: colors.textPrimary },
    headerTitleStyle: { color: colors.textPrimary },
    headerStyle: { backgroundColor: "transparent" },
  };
}
