import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { useThemeColors } from "@/features/shared/theme/theme-context";

interface SettingsSectionProps {
  title: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  footer,
  children,
}: SettingsSectionProps) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 13,
          fontWeight: "600",
          color: colors.textTertiary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          paddingHorizontal: 16,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 14,
          borderCurve: "continuous",
          boxShadow: "0 1px 3px rgba(60, 42, 20, 0.06)",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
      {footer && (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textMuted,
            paddingHorizontal: 16,
            lineHeight: 18,
          }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}
