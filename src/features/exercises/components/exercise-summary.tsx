import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatDuration } from "@/features/shared/utils/format-duration";
import type { ExerciseResult } from "@/features/exercises/types";

interface ExerciseSummaryProps {
  results: ExerciseResult[];
  correctCount: number;
  errorCount: number;
  durationSeconds: number;
  onRetryErrors: () => void;
  onClose: () => void;
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
            color: isGood ? colors.success : colors.accent,
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
          <SymbolView
            name="checkmark.circle.fill"
            size={24}
            tintColor={colors.success}
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 22,
              fontWeight: "700",
              color: colors.success,
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
          <SymbolView
            name="xmark.circle.fill"
            size={24}
            tintColor={colors.danger}
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 22,
              fontWeight: "700",
              color: colors.danger,
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
          <SymbolView
            name="clock.fill"
            size={24}
            tintColor={colors.accent}
            resizeMode="scaleAspectFit"
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
                { color: colors.onAccent, fontWeight: "600", fontSize: 15 },
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
