import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ExerciseResult } from "@/features/exercises/types";

interface ExerciseSummaryProps {
  results: ExerciseResult[];
  correctCount: number;
  errorCount: number;
  durationSeconds: number;
  onRetryErrors: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function ExerciseSummary({
  results,
  correctCount,
  errorCount,
  durationSeconds,
  onRetryErrors,
  onClose,
}: ExerciseSummaryProps) {
  const { colors, textStyles } = useAppTheme();

  const total = results.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isGood = percentage >= 70;

  const errorWords = Array.from(
    new Set(
      results.filter((r) => !r.isCorrect).map((r) => r.exercise.wordTerm),
    ),
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={{ alignItems: "center", gap: 8 }}
      >
        <Text
          style={{
            fontFamily: textStyles.heading.fontFamily,
            fontSize: 56,
            fontWeight: "700",
            color: isGood ? "#4A9A4A" : colors.accent,
            letterSpacing: -2,
          }}
        >
          {percentage}%
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>
          {correctCount} corrette su {total}
        </Text>
      </Animated.View>

      {/* Stat cards */}
      <Animated.View
        entering={FadeInUp.delay(80).duration(400)}
        style={{ flexDirection: "row", gap: 10 }}
      >
        {/* Corrette */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 14,
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Image
            source="sf:checkmark.circle.fill"
            style={{ width: 24, height: 24 }}
            tintColor="#4A9A4A"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 22,
              fontWeight: "700",
              color: "#4A9A4A",
              letterSpacing: -0.5,
            }}
          >
            {correctCount}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Corrette
          </Text>
        </View>

        {/* Errori */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 14,
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Image
            source="sf:xmark.circle.fill"
            style={{ width: 24, height: 24 }}
            tintColor="#C05050"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 22,
              fontWeight: "700",
              color: "#C05050",
              letterSpacing: -0.5,
            }}
          >
            {errorCount}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Errori
          </Text>
        </View>

        {/* Tempo */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 14,
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Image
            source="sf:clock.fill"
            style={{ width: 24, height: 24 }}
            tintColor={colors.accent}
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 22,
              fontWeight: "700",
              color: colors.accent,
              letterSpacing: -0.5,
            }}
          >
            {formatDuration(durationSeconds)}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Tempo
          </Text>
        </View>
      </Animated.View>

      {/* Da ripassare */}
      {errorWords.length > 0 && (
        <Animated.View
          entering={FadeInUp.delay(160).duration(400)}
          style={{ gap: 12 }}
        >
          <Text
            style={[
              textStyles.heading,
              { fontSize: 15, color: colors.textSecondary },
            ]}
          >
            Da ripassare
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {errorWords.map((word) => (
              <View
                key={word}
                style={{
                  backgroundColor: colors.accentLight,
                  borderRadius: 20,
                  borderCurve: "continuous",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={[
                    textStyles.body,
                    { color: colors.accent, fontWeight: "500", fontSize: 13 },
                  ]}
                >
                  {word}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Buttons */}
      <Animated.View
        entering={FadeInUp.delay(240).duration(400)}
        style={{ gap: 10, paddingTop: 4 }}
      >
        {errorCount > 0 && (
          <Pressable
            onPress={onRetryErrors}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={[
                textStyles.body,
                { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
              ]}
            >
              Ripeti gli errori
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={[
              textStyles.body,
              { color: colors.textSecondary, fontWeight: "500", fontSize: 15 },
            ]}
          >
            Torna al ripasso
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
