import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useWordFamily } from "@/features/immersion/hooks/use-word-family";
import { FamilyBranchCard } from "@/features/immersion/components/family-branch-card";

export default function WordFamilyScreen() {
  const { colors, textStyles } = useAppTheme();
  const { term, type } = useLocalSearchParams<{
    term: string;
    type?: string;
  }>();

  const { family, isLoading, error } = useWordFamily(
    term ?? "",
    type ?? "noun",
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        {isLoading && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
              gap: 12,
            }}
          >
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[textStyles.body, { color: colors.textSecondary }]}>
              Ricerca Wortfamilie...
            </Text>
          </View>
        )}

        {error && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
              gap: 8,
            }}
          >
            <SymbolView
              name="exclamationmark.triangle"
              size={32}
              tintColor={colors.textMuted}
              resizeMode="scaleAspectFit"
            />
            <Text style={[textStyles.body, { color: colors.textMuted }]}>
              {error}
            </Text>
          </View>
        )}

        {family && (
          <>
            {/* Root header */}
            <Animated.View entering={FadeInUp.duration(300)}>
              <View
                style={{
                  backgroundColor: colors.accentLight,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <SymbolView
                  name="leaf"
                  size={24}
                  tintColor={colors.accent}
                  resizeMode="scaleAspectFit"
                />
                <View style={{ gap: 2 }}>
                  <Text
                    style={[
                      textStyles.mono,
                      { fontSize: 10, color: colors.textGhost },
                    ]}
                  >
                    Radice
                  </Text>
                  <Text style={[textStyles.heading, { fontSize: 20 }]}>
                    {family.root}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text
                  style={[
                    textStyles.mono,
                    { fontSize: 12, color: colors.textMuted },
                  ]}
                >
                  {family.words.length} parole
                </Text>
              </View>
            </Animated.View>

            {/* Family words */}
            {family.words.map((word, index) => (
              <Animated.View
                key={word.term}
                entering={FadeInUp.delay(index * 60).duration(300)}
              >
                <FamilyBranchCard word={word} />
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: `Wortfamilie · ${term ?? ""}` }} />
    </>
  );
}
