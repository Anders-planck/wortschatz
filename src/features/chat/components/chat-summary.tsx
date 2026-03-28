import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { Correction } from "../types";

interface ChatSummaryProps {
  corrections: Correction[];
  discoveredWords: string[];
  messageCount: number;
  durationSeconds: number;
  onSaveWords: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function ChatSummary({
  corrections,
  discoveredWords,
  messageCount,
  durationSeconds,
  onSaveWords,
  onClose,
}: ChatSummaryProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={{ alignItems: "center", gap: 4 }}
      >
        <Text
          style={[textStyles.heading, { fontSize: 24, letterSpacing: -0.5 }]}
        >
          Riepilogo
        </Text>
      </Animated.View>

      {/* Stats row */}
      <Animated.View
        entering={FadeInUp.delay(80).duration(400)}
        style={{ flexDirection: "row", gap: 10 }}
      >
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
            source="sf:bubble.left.and.bubble.right.fill"
            style={{ width: 22, height: 22 }}
            tintColor={colors.accent}
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 20,
              fontWeight: "700",
              color: colors.accent,
              letterSpacing: -0.5,
            }}
          >
            {messageCount}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Messaggi
          </Text>
        </View>

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
            source="sf:pencil.circle.fill"
            style={{ width: 22, height: 22 }}
            tintColor="#C05050"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 20,
              fontWeight: "700",
              color: "#C05050",
              letterSpacing: -0.5,
            }}
          >
            {corrections.length}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Correzioni
          </Text>
        </View>

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
            source="sf:book.fill"
            style={{ width: 22, height: 22 }}
            tintColor="#4A9A4A"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 20,
              fontWeight: "700",
              color: "#4A9A4A",
              letterSpacing: -0.5,
            }}
          >
            {discoveredWords.length}
          </Text>
          <Text style={[textStyles.mono, { color: colors.textMuted }]}>
            Parole
          </Text>
        </View>

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
            style={{ width: 22, height: 22 }}
            tintColor={colors.textMuted}
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 20,
              fontWeight: "700",
              color: colors.textPrimary,
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

      {/* Corrections list */}
      {corrections.length > 0 && (
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
            Correzioni
          </Text>
          <View style={{ gap: 8 }}>
            {corrections.map((c, i) => (
              <View
                key={`${c.wrong}-${i}`}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  borderCurve: "continuous",
                  padding: 12,
                  gap: 4,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    style={[
                      textStyles.body,
                      {
                        color: "#C05050",
                        textDecorationLine: "line-through",
                        fontSize: 14,
                      },
                    ]}
                  >
                    {c.wrong}
                  </Text>
                  <Text
                    style={[
                      textStyles.body,
                      { color: colors.textMuted, fontSize: 14 },
                    ]}
                  >
                    →
                  </Text>
                  <Text
                    style={[
                      textStyles.body,
                      {
                        color: "#4A9A4A",
                        fontWeight: "600",
                        fontSize: 14,
                      },
                    ]}
                  >
                    {c.right}
                  </Text>
                </View>
                {c.tip.length > 0 && (
                  <Text
                    style={[
                      textStyles.bodyLight,
                      { fontStyle: "italic", fontSize: 12 },
                    ]}
                  >
                    {c.tip}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Discovered words */}
      {discoveredWords.length > 0 && (
        <Animated.View
          entering={FadeInUp.delay(240).duration(400)}
          style={{ gap: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={[
                textStyles.heading,
                { fontSize: 15, color: colors.textSecondary },
              ]}
            >
              Parole scoperte
            </Text>
            <Pressable
              onPress={onSaveWords}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={[
                  textStyles.body,
                  { color: colors.accent, fontWeight: "600", fontSize: 13 },
                ]}
              >
                Salva tutto
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {discoveredWords.map((word) => (
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
                    {
                      color: colors.accent,
                      fontWeight: "500",
                      fontSize: 13,
                    },
                  ]}
                >
                  {word}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Close button */}
      <Animated.View
        entering={FadeInUp.delay(320).duration(400)}
        style={{ gap: 10, paddingTop: 4 }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            backgroundColor: colors.textPrimary,
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
              { color: colors.card, fontWeight: "600", fontSize: 15 },
            ]}
          >
            Torna al ripasso
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
