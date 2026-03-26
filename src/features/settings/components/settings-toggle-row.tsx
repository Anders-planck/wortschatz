import { View, Text, Switch } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  label,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
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
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}
