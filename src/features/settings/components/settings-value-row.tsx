import { View, Text } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { useThemeColors } from "@/features/shared/theme/theme-context";

interface SettingsValueRowProps {
  label: string;
  value: string;
}

export function SettingsValueRow({ label, value }: SettingsValueRowProps) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 14,
          fontWeight: "500",
          color: colors.textTertiary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
