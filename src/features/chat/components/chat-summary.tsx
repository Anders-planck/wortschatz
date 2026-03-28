import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatDuration } from "@/features/shared/utils/format-duration";
import type { Correction } from "../types";

interface ChatSummaryProps {
  corrections: Correction[];
  discoveredWords: string[];
  messageCount: number;
  durationSeconds: number;
  onSaveWords: () => void;
}

export function ChatSummary({
  corrections,
  discoveredWords,
  messageCount,
  durationSeconds,
  onSaveWords,
}: ChatSummaryProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 28 }}
      showsVerticalScrollIndicator={false}
    >
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
          <SymbolView
            name="bubble.left.and.bubble.right.fill"
            size={22}
            tintColor={colors.accent}
            resizeMode="scaleAspectFit"
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
          <Text
            numberOfLines={1}
            style={[textStyles.mono, { color: colors.textMuted, fontSize: 9 }]}
          >
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
          <SymbolView
            name="pencil.circle.fill"
            size={22}
            tintColor="#C05050"
            resizeMode="scaleAspectFit"
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
          <Text
            numberOfLines={1}
            style={[textStyles.mono, { color: colors.textMuted, fontSize: 9 }]}
          >
            Errori
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
          <SymbolView
            name="book.fill"
            size={22}
            tintColor="#4A9A4A"
            resizeMode="scaleAspectFit"
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
          <Text
            numberOfLines={1}
            style={[textStyles.mono, { color: colors.textMuted, fontSize: 9 }]}
          >
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
          <SymbolView
            name="clock.fill"
            size={22}
            tintColor={colors.textMuted}
            resizeMode="scaleAspectFit"
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
          <Text
            numberOfLines={1}
            style={[textStyles.mono, { color: colors.textMuted, fontSize: 9 }]}
          >
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
    </ScrollView>
  );
}
