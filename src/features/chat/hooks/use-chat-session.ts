import { useState, useCallback, useRef } from "react";
import type { Scenario, ChatMessage, Correction } from "../types";
import {
  buildSystemPrompt,
  streamChatResponse,
  parseAIResponse,
} from "../services/chat-service";
import { saveChatSession } from "../services/chat-repository";

interface ChatSessionState {
  messages: ChatMessage[];
  isStreaming: boolean;
  corrections: Correction[];
  discoveredWords: string[];
  suggestions: string[];
  startTime: number;
  scenario: Scenario | null;
}

interface ChatSessionActions {
  start: (scenario: Scenario) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endSession: () => Promise<{
    messageCount: number;
    correctionsCount: number;
    discoveredWordsCount: number;
    durationSeconds: number;
  }>;
}

export type ChatSessionHook = ChatSessionState & ChatSessionActions;

export function useChatSession(): ChatSessionHook {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [discoveredWords, setDiscoveredWords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);

  const streamAssistantMessage = useCallback(
    async (
      currentScenario: Scenario,
      chatMessages: { role: "user" | "assistant"; content: string }[],
    ) => {
      setIsStreaming(true);

      try {
        const systemPrompt = buildSystemPrompt(currentScenario);
        const stream = streamChatResponse(systemPrompt, chatMessages);

        let fullText = "";
        const assistantMsg: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        for await (const chunk of stream.textStream) {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: fullText } : m,
            ),
          );
        }

        // Parse complete response
        const parsed = parseAIResponse(fullText);
        setCorrections((prev) => [...prev, ...parsed.corrections]);
        setDiscoveredWords((prev) => [
          ...new Set([...prev, ...parsed.markedWords]),
        ]);
        setSuggestions(parsed.suggestions);

        // Update final message with cleaned text
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullText } : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  const start = useCallback(
    async (s: Scenario) => {
      setScenario(s);
      scenarioRef.current = s;
      setMessages([]);
      setCorrections([]);
      setDiscoveredWords([]);
      setSuggestions([]);
      setStartTime(Date.now());

      // Send initial empty message to get AI greeting
      await streamAssistantMessage(s, [
        {
          role: "user",
          content:
            "Ciao! Iniziamo la conversazione. Presentati e avvia lo scenario.",
        },
      ]);
    },
    [streamAssistantMessage],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const currentScenario = scenarioRef.current;
      if (!currentScenario) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];

        // Build message list for the API (use functional update to capture latest)
        const aiMessages = updated.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Stream the response
        streamAssistantMessage(currentScenario, aiMessages);

        return updated;
      });
    },
    [streamAssistantMessage],
  );

  const endSession = useCallback(async () => {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const userMessageCount = messages.filter((m) => m.role === "user").length;

    if (scenario) {
      try {
        await saveChatSession({
          scenario: scenario.id,
          messages,
          correctionsCount: corrections.length,
          correctCount: userMessageCount - corrections.length,
          newWords: discoveredWords,
          durationSeconds,
        });
      } catch {
        // Session save failed silently — stats may be lost but UX continues
      }
    }

    return {
      messageCount: messages.length,
      correctionsCount: corrections.length,
      discoveredWordsCount: discoveredWords.length,
      durationSeconds,
    };
  }, [startTime, messages, corrections, discoveredWords, scenario]);

  return {
    messages,
    isStreaming,
    corrections,
    discoveredWords,
    suggestions,
    startTime,
    scenario,
    start,
    sendMessage,
    endSession,
  };
}
