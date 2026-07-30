import { useState, useCallback, useRef, useEffect } from "react";
import { AppState } from "react-native";
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
import { logStudySession } from "@/features/review/services/study-sessions-repository";
import { uuidv7 } from "uuidv7";

interface PersistedChatSessionSnapshot {
  id: number;
  messages: ChatMessage[];
  newWords: string[];
  durationSeconds: number;
}

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
  resume: (scenario: Scenario, savedSession: PersistedChatSessionSnapshot) => void;
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

function nextMsgId(): string {
  return uuidv7();
}

function deriveParsedState(
  messages: ChatMessage[],
  fallbackWords: string[],
): {
  corrections: Correction[];
  discoveredWords: string[];
  suggestions: string[];
  parsedMap: Map<string, ParsedAIResponse>;
} {
  const corrections: Correction[] = [];
  const discoveredWords = new Set<string>(fallbackWords);
  const parsedMap = new Map<string, ParsedAIResponse>();
  let suggestions: string[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") continue;

    const parsed: ParsedAIResponse = {
      text: message.content,
      corrections: message.corrections ?? [],
      markedWords: message.markedWords ?? [],
      suggestions: message.suggestions ?? [],
    };

    if (
      parsed.corrections.length === 0 &&
      parsed.markedWords.length === 0 &&
      parsed.suggestions.length === 0
    ) {
      continue;
    }

    parsedMap.set(message.id, parsed);
    corrections.push(...parsed.corrections);
    for (const word of parsed.markedWords) {
      discoveredWords.add(word);
    }
    if (parsed.suggestions.length > 0) {
      suggestions = parsed.suggestions;
    }
  }

  return {
    corrections,
    discoveredWords: [...discoveredWords],
    suggestions,
    parsedMap,
  };
}

export function useChatSession(): ChatSessionHook {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [discoveredWords, setDiscoveredWords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const correctionsRef = useRef<Correction[]>([]);
  const discoveredWordsRef = useRef<string[]>([]);
  const startTimeRef = useRef(0);
  const parsedMapRef = useRef<Map<string, ParsedAIResponse>>(new Map());
  const [parsedMap, setParsedMap] = useState<Map<string, ParsedAIResponse>>(
    () => new Map(),
  );

  const cancelledRef = useRef(false);
  const persistedSessionIdRef = useRef<number | null>(null);
  const elapsedBeforeResumeRef = useRef(0);
  const initialUserMessageCountRef = useRef(0);
  const initialCorrectionCountRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    correctionsRef.current = corrections;
  }, [corrections]);

  useEffect(() => {
    discoveredWordsRef.current = discoveredWords;
  }, [discoveredWords]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  const computeDurationSeconds = useCallback((now = Date.now()) => {
    if (startTimeRef.current === 0) {
      return elapsedBeforeResumeRef.current;
    }

    return (
      elapsedBeforeResumeRef.current +
      Math.max(0, Math.round((now - startTimeRef.current) / 1000))
    );
  }, []);

  const persistChatProgress = useCallback(
    async ({
      currentScenario = scenarioRef.current,
      currentMessages = messagesRef.current,
      currentCorrections = correctionsRef.current,
      currentDiscoveredWords = discoveredWordsRef.current,
      durationSeconds = computeDurationSeconds(),
    }: {
      currentScenario?: Scenario | null;
      currentMessages?: ChatMessage[];
      currentCorrections?: Correction[];
      currentDiscoveredWords?: string[];
      durationSeconds?: number;
    } = {}) => {
      if (!currentScenario) return persistedSessionIdRef.current;

      const userMessageCount = currentMessages.filter(
        (message) => message.role === "user",
      ).length;
      if (userMessageCount === 0) return persistedSessionIdRef.current;

      try {
        const nextId = await saveChatSession({
          id: persistedSessionIdRef.current ?? undefined,
          scenario: currentScenario.id,
          messages: currentMessages,
          correctionsCount: currentCorrections.length,
          correctCount: Math.max(userMessageCount - currentCorrections.length, 0),
          newWords: currentDiscoveredWords,
          durationSeconds,
        });

        persistedSessionIdRef.current = nextId;
        return nextId;
      } catch {
        return persistedSessionIdRef.current;
      }
    },
    [computeDurationSeconds],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        void persistChatProgress();
      }
    });

    return () => subscription.remove();
  }, [persistChatProgress]);

  useEffect(() => {
    return () => {
      void persistChatProgress();
      cancelledRef.current = true;
    };
  }, [persistChatProgress]);

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
          id: nextMsgId(),
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        };

        const pendingMessages = [...messagesRef.current, assistantMsg];
        messagesRef.current = pendingMessages;
        setMessages(pendingMessages);

        for await (const chunk of stream.textStream) {
          if (cancelledRef.current) break;
          fullText += chunk;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMsg.id
                ? { ...message, content: fullText }
                : message,
            ),
          );
        }

        if (cancelledRef.current) return;

        const parsed = parseAIResponse(fullText);
        const nextCorrections = [
          ...correctionsRef.current,
          ...parsed.corrections,
        ];
        const nextDiscoveredWords = [
          ...new Set([
            ...discoveredWordsRef.current,
            ...parsed.markedWords,
          ]),
        ];
        const finalAssistantMessage: ChatMessage = {
          ...assistantMsg,
          content: parsed.text,
          corrections: parsed.corrections,
          markedWords: parsed.markedWords,
          suggestions: parsed.suggestions,
        };
        const nextMessages = pendingMessages.map((message) =>
          message.id === assistantMsg.id ? finalAssistantMessage : message,
        );

        messagesRef.current = nextMessages;
        correctionsRef.current = nextCorrections;
        discoveredWordsRef.current = nextDiscoveredWords;
        parsedMapRef.current = new Map(parsedMapRef.current).set(
          assistantMsg.id,
          parsed,
        );

        setCorrections(nextCorrections);
        setDiscoveredWords(nextDiscoveredWords);
        setSuggestions(parsed.suggestions);
        setParsedMap(new Map(parsedMapRef.current));
        setMessages(nextMessages);

        await persistChatProgress({
          currentScenario,
          currentMessages: nextMessages,
          currentCorrections: nextCorrections,
          currentDiscoveredWords: nextDiscoveredWords,
        });
      } finally {
        if (!cancelledRef.current) {
          setIsStreaming(false);
        }
      }
    },
    [persistChatProgress],
  );

  const start = useCallback(
    async (nextScenario: Scenario) => {
      cancelledRef.current = false;
      setScenario(nextScenario);
      scenarioRef.current = nextScenario;
      setMessages([]);
      messagesRef.current = [];
      setCorrections([]);
      correctionsRef.current = [];
      setDiscoveredWords([]);
      discoveredWordsRef.current = [];
      setSuggestions([]);
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      elapsedBeforeResumeRef.current = 0;
      initialUserMessageCountRef.current = 0;
      initialCorrectionCountRef.current = 0;
      persistedSessionIdRef.current = null;
      parsedMapRef.current = new Map();
      setParsedMap(new Map());

      await streamAssistantMessage(nextScenario, [
        {
          role: "user",
          content:
            "Ciao! Iniziamo la conversazione. Presentati e avvia lo scenario.",
        },
      ]);
    },
    [streamAssistantMessage],
  );

  const resume = useCallback(
    (nextScenario: Scenario, savedSession: PersistedChatSessionSnapshot) => {
      cancelledRef.current = false;

      const restoredState = deriveParsedState(
        savedSession.messages,
        savedSession.newWords,
      );
      const now = Date.now();

      setScenario(nextScenario);
      scenarioRef.current = nextScenario;
      setMessages(savedSession.messages);
      messagesRef.current = savedSession.messages;
      setCorrections(restoredState.corrections);
      correctionsRef.current = restoredState.corrections;
      setDiscoveredWords(restoredState.discoveredWords);
      discoveredWordsRef.current = restoredState.discoveredWords;
      setSuggestions(restoredState.suggestions);
      setStartTime(now);
      startTimeRef.current = now;
      elapsedBeforeResumeRef.current = savedSession.durationSeconds;
      initialUserMessageCountRef.current = savedSession.messages.filter(
        (message) => message.role === "user",
      ).length;
      initialCorrectionCountRef.current = restoredState.corrections.length;
      persistedSessionIdRef.current = savedSession.id;
      parsedMapRef.current = restoredState.parsedMap;
      setParsedMap(new Map(restoredState.parsedMap));
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const currentScenario = scenarioRef.current;
      if (!currentScenario) return;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const currentMessages = [...messagesRef.current, userMsg];
      messagesRef.current = currentMessages;
      setMessages(currentMessages);

      void persistChatProgress({
        currentScenario,
        currentMessages,
      });

      const aiMessages = currentMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      await streamAssistantMessage(currentScenario, aiMessages);
    },
    [persistChatProgress, streamAssistantMessage],
  );

  const endSession = useCallback(async () => {
    const durationSeconds = computeDurationSeconds();
    const userMessageCount = messagesRef.current.filter(
      (message) => message.role === "user",
    ).length;
    const newUserMessageCount =
      userMessageCount - initialUserMessageCountRef.current;
    const newCorrectionsCount = Math.max(
      correctionsRef.current.length - initialCorrectionCountRef.current,
      0,
    );

    if (scenarioRef.current && userMessageCount > 0) {
      await persistChatProgress({
        currentScenario: scenarioRef.current,
        currentMessages: messagesRef.current,
        currentCorrections: correctionsRef.current,
        currentDiscoveredWords: discoveredWordsRef.current,
        durationSeconds,
      });
    }

    if (scenarioRef.current && newUserMessageCount > 0) {
      try {
        await logStudySession({
          activityType: "chat",
          label: scenarioRef.current.title,
          itemCount: newUserMessageCount,
          correctCount: Math.max(newUserMessageCount - newCorrectionsCount, 0),
          durationSeconds,
        });
      } catch {
        // Session logging should not block the summary flow
      }
    }

    return {
      messageCount: messagesRef.current.length,
      correctionsCount: correctionsRef.current.length,
      discoveredWordsCount: discoveredWordsRef.current.length,
      durationSeconds,
    };
  }, [computeDurationSeconds, persistChatProgress]);

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
    resume,
    sendMessage,
    endSession,
    cancel,
  };
}
