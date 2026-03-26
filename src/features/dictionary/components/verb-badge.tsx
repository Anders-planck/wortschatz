import React from "react";
import { View, Text } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

const variantStyles = {
  warning: { bg: colors.genBg, text: colors.genText },
  info: { bg: colors.nomBg, text: colors.nomText },
} as const;

interface VerbBadgeProps {
  label: string;
  variant: "warning" | "info";
}

export const VerbBadge = React.memo(function VerbBadge({
  label,
  variant,
}: VerbBadgeProps) {
  const style = variantStyles[variant];

  return (
    <View
      style={{
        backgroundColor: style.bg,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        borderCurve: "continuous",
      }}
    >
      <Text style={[textStyles.mono, { color: style.text, fontSize: 12 }]}>
        {label}
      </Text>
    </View>
  );
});
