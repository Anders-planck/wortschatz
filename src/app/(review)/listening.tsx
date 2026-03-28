import { useEffect } from "react";
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
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import { useListening } from "@/features/immersion/hooks/use-listening";

export default function ListeningScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const listening = useListening();

  useEffect(() => {
    listening.start("B1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (listening.phase === "loading") {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            Preparazione esercizi...
          </Text>
        </ScrollView>
        <Stack.Screen options={{ title: "Ascolto" }} />
      </>
    );
  }

  if (listening.phase === "summary") {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: 24,
            gap: 24,
            alignItems: "center",
            paddingTop: 60,
          }}
          style={{ backgroundColor: colors.bg }}
        >
          <SymbolView
            name="ear"
            size={48}
            tintColor={colors.accent}
            resizeMode="scaleAspectFit"
          />
          <Text style={[textStyles.heading, { fontSize: 24 }]}>Risultati</Text>
          <Text
            style={[textStyles.body, { fontSize: 40, color: colors.accent }]}
          >
            {listening.correctCount}/{listening.total}
          </Text>
          <Text style={[textStyles.bodyLight, { color: colors.textMuted }]}>
            risposte corrette
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 14,
              borderCurve: "continuous",
              paddingVertical: 16,
              paddingHorizontal: 40,
              opacity: pressed ? 0.85 : 1,
              marginTop: 20,
            })}
          >
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 16,
                fontWeight: "600",
                color: colors.onAccent,
              }}
            >
              Chiudi
            </Text>
          </Pressable>
        </ScrollView>
        <Stack.Screen options={{ title: "Risultati" }} />
      </>
    );
  }

  const exercise = listening.currentExercise;
  if (!exercise) return null;

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 20 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Progress */}
        <Text
          style={[
            textStyles.mono,
            {
              fontSize: 12,
              color: colors.textMuted,
              textAlign: "center",
            },
          ]}
        >
          {listening.currentIndex + 1} / {listening.total}
        </Text>

        {/* Dialogue card */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 20,
              gap: 16,
              alignItems: "center",
            }}
          >
            <SymbolView
              name="ear"
              size={32}
              tintColor={colors.accent}
              resizeMode="scaleAspectFit"
            />

            <Text
              style={[
                textStyles.body,
                { textAlign: "center", color: colors.textSecondary },
              ]}
            >
              Ascolta e rispondi
            </Text>

            {/* Play buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <SpeakerButton text={exercise.dialogue} size="md" />
            </View>

            {/* Show transcript toggle */}
            {listening.phase === "result" && (
              <Pressable
                onPress={listening.toggleTranscript}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <SymbolView
                  name={listening.showTranscript ? "eye.slash" : "eye"}
                  size={16}
                  tintColor={colors.accent}
                  resizeMode="scaleAspectFit"
                />
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 13,
                    color: colors.accent,
                  }}
                >
                  {listening.showTranscript
                    ? "Nascondi trascrizione"
                    : "Mostra trascrizione"}
                </Text>
              </Pressable>
            )}

            {listening.showTranscript && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <Text
                  selectable
                  style={[
                    textStyles.body,
                    {
                      fontSize: 15,
                      color: colors.textPrimary,
                      lineHeight: 24,
                      backgroundColor: colors.cream,
                      padding: 12,
                      borderRadius: 10,
                      borderCurve: "continuous",
                      overflow: "hidden",
                    },
                  ]}
                >
                  {exercise.dialogue}
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Question */}
        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <Text
            style={[textStyles.heading, { fontSize: 17, textAlign: "center" }]}
          >
            {exercise.question}
          </Text>
        </Animated.View>

        {/* Options */}
        {exercise.options.map((option, i) => {
          const isSelected = listening.selectedAnswer === i;
          const isCorrect = i === exercise.correctIndex;
          const showResult = listening.phase === "result";

          let bgColor = colors.card;
          let borderColor = "transparent";
          let textColor = colors.textPrimary;

          if (showResult && isCorrect) {
            bgColor = colors.successBg;
            borderColor = colors.success;
            textColor = colors.success;
          } else if (showResult && isSelected && !isCorrect) {
            bgColor = colors.dangerBg;
            borderColor = colors.danger;
            textColor = colors.danger;
          }

          return (
            <Animated.View
              key={i}
              entering={FadeInUp.delay((i + 2) * 60).duration(300)}
            >
              <Pressable
                onPress={() => listening.answer(i)}
                disabled={listening.phase === "result"}
                style={({ pressed }) => ({
                  backgroundColor: bgColor,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  padding: 16,
                  borderWidth: showResult && (isCorrect || isSelected) ? 2 : 0,
                  borderColor,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: textStyles.body.fontFamily,
                    fontSize: 15,
                    color: textColor,
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Explanation + next */}
        {listening.phase === "result" && (
          <Animated.View entering={FadeInUp.duration(200)} style={{ gap: 16 }}>
            <View
              style={{
                backgroundColor: colors.cream,
                borderRadius: 12,
                borderCurve: "continuous",
                padding: 14,
              }}
            >
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 14, color: colors.textSecondary },
                ]}
              >
                {exercise.explanation}
              </Text>
            </View>

            <Pressable
              onPress={listening.next}
              style={({ pressed }) => ({
                backgroundColor: colors.accent,
                borderRadius: 14,
                borderCurve: "continuous",
                paddingVertical: 16,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: textStyles.heading.fontFamily,
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.onAccent,
                }}
              >
                {listening.currentIndex + 1 < listening.total
                  ? "Prossimo"
                  : "Risultati"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: "Ascolto" }} />
    </>
  );
}
