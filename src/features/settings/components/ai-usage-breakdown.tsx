import { Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatCost, formatTokens } from "../utils/format-usage";
import type { FeatureUsage } from "../services/ai-usage-repository";

import type { ThemeColors } from "@/features/shared/theme/colors";

type FeatureConfigEntry = {
  label: string;
  icon: string;
  colorKey: keyof ThemeColors;
};

const FEATURE_CONFIG: Record<string, FeatureConfigEntry> = {
  chat: { label: "Chat", icon: "text.bubble", colorKey: "accent" },
  exercises: {
    label: "Esercizi",
    icon: "pencil.and.list.clipboard",
    colorKey: "der",
  },
  readings: { label: "Lettura", icon: "book", colorKey: "das" },
  listening: { label: "Ascolto", icon: "ear", colorKey: "prep" },
  enrichment: {
    label: "Vocabolario",
    icon: "character.book.closed",
    colorKey: "verb",
  },
  synonyms: {
    label: "Sinonimi",
    icon: "arrow.left.arrow.right",
    colorKey: "verb",
  },
  word_family: { label: "Wortfamilie", icon: "leaf", colorKey: "verb" },
  collections: { label: "Collezioni", icon: "folder", colorKey: "die" },
};

interface AiUsageBreakdownProps {
  features: FeatureUsage[];
}

export function AiUsageBreakdown({ features }: AiUsageBreakdownProps) {
  const { colors, textStyles } = useAppTheme();

  if (features.length === 0) return null;

  const maxCost = Math.max(...features.map((f) => f.cost), 0.01);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderCurve: "continuous",
        padding: 18,
        gap: 14,
      }}
    >
      <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
        Per feature
      </Text>
      {features.map((f) => {
        const config = FEATURE_CONFIG[f.feature];
        const featureColor = config
          ? colors[config.colorKey]
          : colors.textMuted;
        const featureIcon = config?.icon ?? "questionmark.circle";
        const featureLabel = config?.label ?? f.feature;
        const barWidth = (f.cost / maxCost) * 100;
        return (
          <View
            key={f.feature}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <SymbolView
              name={featureIcon as SFSymbol}
              size={22}
              tintColor={featureColor}
              resizeMode="scaleAspectFit"
            />
            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text style={[textStyles.heading, { fontSize: 14 }]}>
                  {featureLabel}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.accent,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatCost(f.cost)}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  backgroundColor: colors.cream,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${barWidth}%`,
                    borderRadius: 2,
                    backgroundColor: featureColor,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text
                  style={[
                    textStyles.mono,
                    {
                      fontSize: 10,
                      color: colors.textGhost,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {formatTokens(f.tokens)} token
                </Text>
                <Text
                  style={[
                    textStyles.mono,
                    {
                      fontSize: 10,
                      color: colors.textGhost,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {f.calls} chiamate
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
