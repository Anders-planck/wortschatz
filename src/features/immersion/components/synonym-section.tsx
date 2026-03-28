import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SectionTitle } from "@/features/shared/components/section-title";
import type { Synonym, Antonym, Comparative } from "../types";

interface SynonymSectionProps {
  synonyms: Synonym[];
  antonyms: Antonym[];
  comparative: Comparative | null;
  onWordPress?: (word: string, meaning: string) => void;
}

export function SynonymSection({
  synonyms,
  antonyms,
  comparative,
  onWordPress,
}: SynonymSectionProps) {
  const { colors, textStyles } = useAppTheme();

  const intensityColors: Record<string, string> = {
    high: colors.success,
    medium: colors.accent,
    low: colors.textMuted,
  };

  if (synonyms.length === 0 && antonyms.length === 0 && !comparative) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{ marginTop: 16, gap: 12 }}
    >
      {/* Synonyms */}
      {synonyms.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Sinonimi</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {synonyms.map((s) => (
              <Pressable
                key={s.term}
                onPress={() => onWordPress?.(s.term, s.translation)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: colors.cream,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: intensityColors[s.intensity],
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                >
                  {s.term}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.body.fontFamily,
                    fontSize: 12,
                    color: colors.textMuted,
                  }}
                >
                  {s.translation}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Antonyms */}
      {antonyms.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Contrari</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {antonyms.map((a) => (
              <Pressable
                key={a.term}
                onPress={() => onWordPress?.(a.term, a.translation)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: colors.dangerBg,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <SymbolView
                  name="arrow.left.arrow.right"
                  size={10}
                  tintColor={colors.danger}
                  resizeMode="scaleAspectFit"
                />
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                >
                  {a.term}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.body.fontFamily,
                    fontSize: 12,
                    color: colors.textMuted,
                  }}
                >
                  {a.translation}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Comparative (adjectives only) */}
      {comparative && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Comparazione</SectionTitle>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.cream,
              borderRadius: 10,
              borderCurve: "continuous",
              padding: 12,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={[
                  textStyles.mono,
                  { fontSize: 10, color: colors.textGhost },
                ]}
              >
                Positiv
              </Text>
              <Text style={[textStyles.heading, { fontSize: 14 }]}>—</Text>
            </View>
            <SymbolView
              name="chevron.right"
              size={10}
              tintColor={colors.textGhost}
              resizeMode="scaleAspectFit"
            />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={[
                  textStyles.mono,
                  { fontSize: 10, color: colors.textGhost },
                ]}
              >
                Komparativ
              </Text>
              <Text style={[textStyles.heading, { fontSize: 14 }]}>
                {comparative.komparativ}
              </Text>
            </View>
            <SymbolView
              name="chevron.right"
              size={10}
              tintColor={colors.textGhost}
              resizeMode="scaleAspectFit"
            />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={[
                  textStyles.mono,
                  { fontSize: 10, color: colors.textGhost },
                ]}
              >
                Superlativ
              </Text>
              <Text style={[textStyles.heading, { fontSize: 14 }]}>
                {comparative.superlativ}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}
