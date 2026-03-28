import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useReadings } from "@/features/immersion/hooks/use-readings";
import { SCENARIO_LEVELS } from "@/features/chat/types";

export default function ReadingsScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { readings, isLoading, isGenerating, load, generate } = useReadings();
  const [selectedLevel, setSelectedLevel] = useState("B1");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    try {
      const id = await generate(selectedLevel);
      if (id) {
        router.push({
          pathname: "/(review)/reading/[id]",
          params: { id: String(id) },
        });
      }
    } catch {
      // Error handled in hook
    }
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Generate new reading */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={[textStyles.heading, { fontSize: 17 }]}>
                Genera un testo
              </Text>
              <Text style={[textStyles.bodyLight, { color: colors.textMuted }]}>
                Testo breve basato sul tuo vocabolario
              </Text>
            </View>

            {/* Level picker */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {SCENARIO_LEVELS.filter((l) => l !== "Adaptive").map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setSelectedLevel(l)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    alignItems: "center",
                    backgroundColor:
                      l === selectedLevel ? colors.accentLight : colors.cream,
                    borderWidth: l === selectedLevel ? 1.5 : 0,
                    borderColor: colors.accent,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: textStyles.mono.fontFamily,
                      fontSize: 14,
                      fontWeight: "600",
                      color:
                        l === selectedLevel
                          ? colors.accent
                          : colors.textSecondary,
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating}
              style={({ pressed }) => ({
                backgroundColor: colors.accent,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed || isGenerating ? 0.7 : 1,
              })}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <SymbolView
                  name="sparkles"
                  size={18}
                  tintColor={colors.onAccent}
                  resizeMode="scaleAspectFit"
                />
              )}
              <Text
                style={{
                  fontFamily: textStyles.heading.fontFamily,
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.onAccent,
                }}
              >
                {isGenerating ? "Generazione..." : "Genera testo"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Reading list */}
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={colors.accent}
            style={{ marginTop: 20 }}
          />
        )}

        {!isLoading && readings.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
              I tuoi testi
            </Text>
            {readings.map((reading, index) => (
              <Animated.View
                key={reading.id}
                entering={FadeInUp.delay(index * 50).duration(300)}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(review)/reading/[id]",
                      params: { id: String(reading.id) },
                    })
                  }
                  style={({ pressed }) => ({
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    borderCurve: "continuous",
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <SymbolView
                    name="book"
                    size={22}
                    tintColor={colors.accent}
                    resizeMode="scaleAspectFit"
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[textStyles.heading, { fontSize: 15 }]}>
                      {reading.title}
                    </Text>
                    <Text
                      style={[
                        textStyles.mono,
                        { fontSize: 11, color: colors.textHint },
                      ]}
                    >
                      {reading.wordCount} parole · {reading.level}
                    </Text>
                  </View>
                  <SymbolView
                    name="chevron.right"
                    size={12}
                    tintColor={colors.textGhost}
                    resizeMode="scaleAspectFit"
                  />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {!isLoading && readings.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
            <SymbolView
              name="book.closed"
              size={36}
              tintColor={colors.textGhost}
              resizeMode="scaleAspectFit"
            />
            <Text style={[textStyles.body, { color: colors.textMuted }]}>
              Nessun testo ancora. Genera il primo!
            </Text>
          </View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: "Lettura" }} />
    </>
  );
}
