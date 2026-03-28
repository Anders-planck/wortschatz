import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import { useChatSession } from "@/features/chat/hooks/use-chat-session";
import { ChatBubble } from "@/features/chat/components/chat-bubble";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import { QuickReplyChips } from "@/features/chat/components/quick-reply-chips";
import { ChatInputBar } from "@/features/chat/components/chat-input-bar";
import { ChatSummary } from "@/features/chat/components/chat-summary";
import { parseAIResponse } from "@/features/chat/services/chat-service";

export default function ChatSessionScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const [showSummary, setShowSummary] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    messageCount: number;
    durationSeconds: number;
  } | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const session = useChatSession();

  useEffect(() => {
    session.start(scenario);
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

  const handleWordTap = (_word: string) => {
    // Could navigate to dictionary or show word details
  };

  // Build per-message corrections map: only show corrections for the latest AI message
  // that produced them (corrections are accumulated, so we parse each AI message individually)
  const messageCorrectionMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof parseAIResponse>>();
    for (const msg of session.messages) {
      if (msg.role === "assistant" && msg.content.length > 0) {
        map.set(msg.id, parseAIResponse(msg.content));
      }
    }
    return map;
  }, [session.messages]);

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
            onClose={() => router.back()}
          />
        </View>
        <Stack.Screen options={{ title: "Riepilogo" }} />
      </>
    );
  }

  // Messages in reverse for inverted FlatList
  const reversedMessages = [...session.messages].reverse();

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const parsed = messageCorrectionMap.get(item.id);
            return (
              <ChatBubble
                message={item}
                corrections={parsed?.corrections ?? []}
                markedWords={parsed?.markedWords ?? []}
                onWordTap={handleWordTap}
              />
            );
          }}
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
          headerRight: () => (
            <Pressable onPress={handleEndSession}>
              <Image
                source="sf:ellipsis.circle"
                style={{ width: 22, height: 22 }}
                tintColor={colors.accent}
              />
            </Pressable>
          ),
        }}
      />
    </>
  );
}
