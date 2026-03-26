import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
  onValueChange: (value: number) => void;
}

export function SettingsSliderRow({
  label,
  value,
  min,
  max,
  step,
  formatValue = (v) => `${v.toFixed(1)}x`,
  onValueChange,
}: SettingsSliderRowProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
        <View
          style={{
            backgroundColor: colors.accentLight,
            borderRadius: 6,
            borderCurve: "continuous",
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            {formatValue(value)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: "500",
            color: colors.textMuted,
            minWidth: 28,
            textAlign: "center",
          }}
        >
          {formatValue(min)}
        </Text>
        <View style={{ flex: 1 }}>
          <Slider
            value={value}
            minimumValue={min}
            maximumValue={max}
            step={step}
            onValueChange={onValueChange}
            minimumTrackTintColor={colors.accent}
          />
        </View>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: "500",
            color: colors.textMuted,
            minWidth: 28,
            textAlign: "center",
          }}
        >
          {formatValue(max)}
        </Text>
      </View>
    </View>
  );
}
