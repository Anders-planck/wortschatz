import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import { useChatSession } from "@/features/chat/hooks/use-chat-session";
import { getChatSessionMessages } from "@/features/chat/services/chat-repository";
import { ChatBubble } from "@/features/chat/components/chat-bubble";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import { QuickReplyChips } from "@/features/chat/components/quick-reply-chips";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { ChatSummary } from "@/features/chat/components/chat-summary";

export default function ChatSessionScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { scenarioId, sessionId } = useLocalSearchParams<{
    scenarioId: string;
    sessionId?: string;
  }>();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    messageCount: number;
    durationSeconds: number;
  } | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const session = useChatSession();

  useEffect(() => {
    if (sessionId) {
      getChatSessionMessages(Number(sessionId)).then((messages) => {
        session.resume(scenario, messages);
      });
    } else {
      session.start(scenario);
    }
  }, []);

  const handleEndSession = async () => {
    const stats = await session.endSession();
    setSummaryStats({
      messageCount: stats.messageCount,
      durationSeconds: stats.durationSeconds,
    });
    setShowSummary(true);
  };

  const handleSendMessage = (text: string) => {
    session.sendMessage(text);
  };

  const handleWordTap = useCallback((_word: string) => {
    // Could navigate to dictionary or show word details
  }, []);

  if (showSummary) {
    return (
      <>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ChatSummary
            corrections={session.corrections}
            discoveredWords={session.discoveredWords}
            messageCount={summaryStats?.messageCount ?? session.messages.length}
            durationSeconds={
              summaryStats?.durationSeconds ??
              Math.round((Date.now() - session.startTime) / 1000)
            }
            onSaveWords={() => {
              // TODO: save discovered words to dictionary
            }}
          />
        </View>
        <Stack.Screen
          options={{
            title: "Riepilogo",
            headerLeft: () => (
              <Pressable onPress={() => setShowSummary(false)} hitSlop={8}>
                <SymbolView
                  name="chevron.left.circle.fill"
                  size={28}
                  tintColor={colors.accent}
                  resizeMode="scaleAspectFit"
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <SymbolView
                  name="xmark.circle.fill"
                  size={28}
                  tintColor={colors.textMuted}
                  resizeMode="scaleAspectFit"
                />
              </Pressable>
            ),
          }}
        />
      </>
    );
  }

  // Messages in reverse for inverted FlatList
  const reversedMessages = useMemo(
    () => [...session.messages].reverse(),
    [session.messages],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof session.messages)[number] }) => {
      const parsed = session.parsedMap.get(item.id);
      return (
        <ChatBubble
          message={item}
          corrections={parsed?.corrections ?? []}
          markedWords={parsed?.markedWords ?? []}
          onWordTap={handleWordTap}
        />
      );
    },
    [session.parsedMap, handleWordTap],
  );

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={reversedMessages}
          inverted
          contentInsetAdjustmentBehavior="automatic"
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          ListHeaderComponent={session.isStreaming ? <TypingIndicator /> : null}
        />

        <QuickReplyChips
          suggestions={session.suggestions}
          onSelect={handleSendMessage}
        />
        <ChatInputBar
          onSend={handleSendMessage}
          disabled={session.isStreaming}
        />
      </KeyboardAvoidingView>

      <Stack.Screen
        options={{
          title: scenario.title,
          headerLeft: () => null,
          headerRight: () => (
            <Pressable onPress={handleEndSession}>
              <SymbolView
                name="ellipsis.circle"
                size={22}
                tintColor={colors.accent}
                resizeMode="scaleAspectFit"
              />
            </Pressable>
          ),
        }}
      />
    </>
  );
}
