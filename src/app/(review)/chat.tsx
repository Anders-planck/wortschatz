import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import { ScenarioCard } from "@/features/chat/components/scenario-card";
import {
  getRecentChatSessions,
  deleteChatSession,
  type SavedChatSession,
} from "@/features/chat/services/chat-repository";
import { formatDuration } from "@/features/shared/utils/format-duration";

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Adesso";
  if (diffMin < 60) return `${diffMin}m fa`;
  if (diffHr < 24) return `${diffHr}h fa`;
  if (diffDay === 1) return "Ieri";
  return `${diffDay}g fa`;
}

export default function ChatScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentChatSessions(10).then(setSessions);
    }, []),
  );

  const handleDelete = (id: number) => {
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
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        {SCENARIOS.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            featured={index === 0}
            onPress={() =>
              router.push({
                pathname: "/(review)/chat-session",
                params: { scenarioId: scenario.id },
              })
            }
          />
        ))}

        {sessions.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                color: colors.textGhost,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Conversazioni recenti
            </Text>

            {sessions.map((session) => {
              const scenario = SCENARIOS.find((s) => s.id === session.scenario);
              return (
                <Pressable
                  key={session.id}
                  onLongPress={() => handleDelete(session.id)}
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
                    name={
                      (scenario?.icon ??
                        "text.bubble") as import("expo-symbols").SFSymbol
                    }
                    size={20}
                    tintColor={colors.accent}
                    resizeMode="scaleAspectFit"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[textStyles.heading, { fontSize: 14 }]}
                      numberOfLines={1}
                    >
                      {scenario?.title ?? session.scenario}
                    </Text>
                    <Text
                      style={{
                        fontFamily: textStyles.mono.fontFamily,
                        fontSize: 11,
                        color: colors.textHint,
                      }}
                    >
                      {session.messagesCount} messaggi ·{" "}
                      {formatDuration(session.durationSeconds)} ·{" "}
                      {relativeDate(session.createdAt)}
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
                        {session.correctionsCount} err.
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: "Conversazione" }} />
    </>
  );
}
