import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface VerbBadgeProps {
  label: string;
  variant: "warning" | "info";
}

export const VerbBadge = React.memo(function VerbBadge({
  label,
  variant,
}: VerbBadgeProps) {
  const { colors, textStyles } = useAppTheme();

  const variantStyles = {
    warning: { bg: colors.genBg, text: colors.genText },
    info: { bg: colors.nomBg, text: colors.nomText },
  } as const;

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
