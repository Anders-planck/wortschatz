import { useState, useCallback, useRef, useEffect } from "react";
import type {
  Scenario,
  ChatMessage,
  Correction,
  ParsedAIResponse,
} from "../types";
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
  parsedMap: Map<string, ParsedAIResponse>;
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
  cancel: () => void;
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

  // Mirror of messages state for use inside async callbacks without stale closures
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Parsed results per assistant message id
  const parsedMapRef = useRef<Map<string, ParsedAIResponse>>(new Map());
  const [parsedMap, setParsedMap] = useState<Map<string, ParsedAIResponse>>(
    () => new Map(),
  );

  // Cancellation flag for streaming loops
  const cancelledRef = useRef(false);

  // Cleanup on unmount: cancel any active stream
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

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
          if (cancelledRef.current) break;
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

        // Store parsed result keyed by message id
        parsedMapRef.current = new Map(parsedMapRef.current).set(
          assistantMsg.id,
          parsed,
        );
        setParsedMap(new Map(parsedMapRef.current));

        // Update final message with clean text (Fix 2: store parsed.text, not fullText)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: parsed.text } : m,
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
      cancelledRef.current = false;
      setScenario(s);
      scenarioRef.current = s;
      setMessages([]);
      messagesRef.current = [];
      setCorrections([]);
      setDiscoveredWords([]);
      setSuggestions([]);
      setStartTime(Date.now());
      parsedMapRef.current = new Map();
      setParsedMap(new Map());

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

      // Fix 1: setState updater is pure — no async calls inside
      setMessages((prev) => [...prev, userMsg]);

      // Build aiMessages using the ref (up-to-date without waiting for re-render)
      const currentMessages = [...messagesRef.current, userMsg];
      const aiMessages = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamAssistantMessage(currentScenario, aiMessages);
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

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    messages,
    isStreaming,
    corrections,
    discoveredWords,
    suggestions,
    startTime,
    scenario,
    parsedMap,
    start,
    sendMessage,
    endSession,
    cancel,
  };
}
