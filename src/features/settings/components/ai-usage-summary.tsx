import { Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatCost, formatTokens } from "../utils/format-usage";
import type { UsageSummary } from "../services/ai-usage-repository";

interface AiUsageSummaryProps {
  summary: UsageSummary;
}

export function AiUsageSummaryRow({ summary }: AiUsageSummaryProps) {
  const { colors, textStyles } = useAppTheme();

  const stats = [
    {
      icon: "dollarsign.circle",
      label: "Costo",
      value: formatCost(summary.totalCost),
      tint: colors.accent,
    },
    {
      icon: "bolt",
      label: "Token",
      value: formatTokens(summary.totalTokens),
      tint: colors.success,
    },
    {
      icon: "arrow.triangle.2.circlepath",
      label: "Chiamate",
      value: String(summary.totalCalls),
      tint: colors.verb,
    },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 14,
            gap: 6,
          }}
        >
          <SymbolView
            name={stat.icon as SFSymbol}
            size={20}
            tintColor={stat.tint}
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: textStyles.mono.fontFamily,
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {stat.value}
          </Text>
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
