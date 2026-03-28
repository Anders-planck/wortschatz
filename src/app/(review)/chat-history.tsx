import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import {
  getChatSessionsByScenario,
  deleteChatSession,
  deleteChatSessions,
  type SavedChatSession,
} from "@/features/chat/services/chat-repository";
import { formatDuration } from "@/features/shared/utils/format-duration";
import { Toast } from "@/features/shared/components/toast";

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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  useFocusEffect(
    useCallback(() => {
      if (scenarioId) {
        getChatSessionsByScenario(scenarioId).then(setSessions);
      }
    }, [scenarioId]),
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleDeleteSingle = (id: number) => {
    Alert.alert(
      "Elimina conversazione",
      "Vuoi eliminare questa conversazione?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteChatSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            showToast("Conversazione eliminata");
          },
        },
      ],
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    Alert.alert(
      "Elimina conversazioni",
      `Vuoi eliminare ${count} ${count === 1 ? "conversazione" : "conversazioni"}?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteChatSessions([...selectedIds]);
            setSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
            setSelectedIds(new Set());
            setIsSelecting(false);
            showToast(
              `${count} ${count === 1 ? "conversazione eliminata" : "conversazioni eliminate"}`,
            );
          },
        },
      ],
    );
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
          {!isSelecting && (
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
                  tintColor={colors.onAccent}
                  resizeMode="scaleAspectFit"
                />
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.onAccent,
                  }}
                >
                  Nuova conversazione
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Batch delete bar */}
          {isSelecting && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
              }}
            >
              <Pressable
                onPress={cancelSelection}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    textStyles.heading,
                    { fontSize: 14, color: colors.textSecondary },
                  ]}
                >
                  Annulla
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor:
                    selectedIds.size > 0 ? colors.danger : colors.borderLight,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <SymbolView
                  name="trash"
                  size={14}
                  tintColor={
                    selectedIds.size > 0 ? colors.onAccent : colors.textMuted
                  }
                  resizeMode="scaleAspectFit"
                />
                <Text
                  style={[
                    textStyles.heading,
                    {
                      fontSize: 14,
                      color:
                        selectedIds.size > 0
                          ? colors.onAccent
                          : colors.textMuted,
                    },
                  ]}
                >
                  Elimina ({selectedIds.size})
                </Text>
              </Pressable>
            </View>
          )}

          {/* Past conversations */}
          {sessions.length > 0 && (
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[textStyles.monoLabel, { color: colors.textGhost }]}
                >
                  Conversazioni precedenti
                </Text>
                {!isSelecting && sessions.length > 1 && (
                  <Pressable onPress={() => setIsSelecting(true)}>
                    <Text
                      style={{
                        fontFamily: textStyles.heading.fontFamily,
                        fontSize: 13,
                        color: colors.accent,
                        fontWeight: "600",
                      }}
                    >
                      Seleziona
                    </Text>
                  </Pressable>
                )}
              </View>

              {sessions.map((session, index) => (
                <Animated.View
                  key={session.id}
                  entering={FadeInUp.delay((index + 2) * 50).duration(300)}
                  exiting={FadeOutLeft.duration(200)}
                >
                  {isSelecting ? (
                    <Pressable
                      onPress={() => toggleSelect(session.id)}
                      style={({ pressed }) => ({
                        backgroundColor: colors.card,
                        borderRadius: 14,
                        borderCurve: "continuous",
                        padding: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        opacity: pressed ? 0.9 : 1,
                        borderWidth: selectedIds.has(session.id) ? 2 : 0,
                        borderColor: colors.accent,
                      })}
                    >
                      <SymbolView
                        name={
                          selectedIds.has(session.id)
                            ? "checkmark.circle.fill"
                            : "circle"
                        }
                        size={22}
                        tintColor={
                          selectedIds.has(session.id)
                            ? colors.accent
                            : colors.textGhost
                        }
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
                    </Pressable>
                  ) : (
                    <ReanimatedSwipeable
                      renderRightActions={() => (
                        <Pressable
                          onPress={() => handleDeleteSingle(session.id)}
                          style={{
                            backgroundColor: colors.danger,
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
                            tintColor={colors.onAccent}
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
                    </ReanimatedSwipeable>
                  )}
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>

        <Toast
          message={toastMessage}
          visible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          icon="trash.circle.fill"
        />
      </GestureHandlerRootView>
      <Stack.Screen options={{ title: scenario.title }} />
    </>
  );
}
