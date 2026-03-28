import { View } from "react-native";
import { useThemeColors } from "@/features/shared/theme/theme-context";

export function Divider() {
  const colors = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.6,
        marginVertical: 14,
      }}
    />
  );
}
