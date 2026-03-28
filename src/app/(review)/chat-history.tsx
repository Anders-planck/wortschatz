import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import {
  getChatSessionsByScenario,
  deleteChatSession,
  type SavedChatSession,
} from "@/features/chat/services/chat-repository";
import { formatDuration } from "@/features/shared/utils/format-duration";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} · ${hours}:${mins}`;
}

export default function ChatHistoryScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  useFocusEffect(
    useCallback(() => {
      if (scenarioId) {
        getChatSessionsByScenario(scenarioId).then(setSessions);
      }
    }, [scenarioId]),
  );

  const handleDelete = async (id: number) => {
    await deleteChatSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Scenario header card */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 20,
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor: colors.accentLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SymbolView
                name={scenario.icon as SFSymbol}
                size={28}
                tintColor={colors.accent}
                resizeMode="scaleAspectFit"
              />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[textStyles.heading, { fontSize: 18 }]}>
                {scenario.title}
              </Text>
              <Text
                style={[
                  textStyles.bodyLight,
                  {
                    fontSize: 13,
                    color: colors.textMuted,
                    textAlign: "center",
                  },
                ]}
              >
                {scenario.description}
              </Text>
              <View
                style={{
                  backgroundColor: colors.accentLight,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.accent,
                  }}
                >
                  {scenario.level}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* New conversation button */}
        <Animated.View entering={FadeInUp.delay(60).duration(300)}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(review)/chat-session",
                params: { scenarioId: scenario.id },
              })
            }
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 14,
              borderCurve: "continuous",
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <SymbolView
              name="plus.bubble"
              size={18}
              tintColor="#FFFFFF"
              resizeMode="scaleAspectFit"
            />
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Nuova conversazione
            </Text>
          </Pressable>
        </Animated.View>

        {/* Past conversations */}
        {sessions.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                color: colors.textGhost,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Conversazioni precedenti
            </Text>

            {sessions.map((session, index) => (
              <Animated.View
                key={session.id}
                entering={FadeInUp.delay((index + 2) * 50).duration(300)}
              >
                <Swipeable
                  renderRightActions={() => (
                    <Pressable
                      onPress={() => handleDelete(session.id)}
                      style={{
                        backgroundColor: "#C05050",
                        borderRadius: 14,
                        borderCurve: "continuous",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        marginLeft: 8,
                      }}
                    >
                      <SymbolView
                        name="trash"
                        size={20}
                        tintColor="#FFFFFF"
                        resizeMode="scaleAspectFit"
                      />
                    </Pressable>
                  )}
                  overshootRight={false}
                >
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/(review)/chat-session",
                        params: {
                          scenarioId: scenario.id,
                          sessionId: String(session.id),
                        },
                      })
                    }
                    style={({ pressed }) => ({
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      borderCurve: "continuous",
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <SymbolView
                      name="bubble.left.and.bubble.right"
                      size={20}
                      tintColor={colors.textMuted}
                      resizeMode="scaleAspectFit"
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: textStyles.mono.fontFamily,
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDate(session.createdAt)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: textStyles.mono.fontFamily,
                          fontSize: 11,
                          color: colors.textHint,
                        }}
                      >
                        {session.messagesCount} messaggi ·{" "}
                        {formatDuration(session.durationSeconds)}
                      </Text>
                    </View>
                    {session.correctionsCount > 0 && (
                      <View
                        style={{
                          backgroundColor: colors.accentLight,
                          borderRadius: 6,
                          borderCurve: "continuous",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: textStyles.mono.fontFamily,
                            fontSize: 10,
                            color: colors.accent,
                          }}
                        >
                          {session.correctionsCount} corr.
                        </Text>
                      </View>
                    )}
                    <SymbolView
                      name="chevron.right"
                      size={12}
                      tintColor={colors.textGhost}
                      resizeMode="scaleAspectFit"
                    />
                  </Pressable>
                </Swipeable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: scenario.title }} />
    </>
  );
}
