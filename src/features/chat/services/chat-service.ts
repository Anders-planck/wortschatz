import { streamText } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import type { Scenario, ParsedAIResponse, Correction } from "../types";

export function buildSystemPrompt(scenario: Scenario): string {
  return `You are a German conversation partner in the scenario: "${scenario.title}".
Stay in character. Respond naturally in German at ${scenario.level} level.
After each user message:
1. Continue the conversation naturally in German
2. If there are grammar errors in the user's message, show corrections:
   [CORRECTION]
   wrong: "original text"
   right: "corrected text"
   tip: "explanation in Italian"
   [/CORRECTION]
3. Mark new/advanced German words with [WORD]term[/WORD]
4. At the end, suggest 2-3 follow-up phrases the user could say, formatted as:
   [SUGGESTIONS]
   - phrase 1
   - phrase 2
   - phrase 3
   [/SUGGESTIONS]`;
}

export function streamChatResponse(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  return streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages,
  });
}

export function parseAIResponse(raw: string): ParsedAIResponse {
  const corrections: Correction[] = [];
  const markedWords: string[] = [];
  const suggestions: string[] = [];

  // Extract corrections
  const correctionRegex = /\[CORRECTION\]([\s\S]*?)\[\/CORRECTION\]/g;
  let corrMatch: RegExpExecArray | null;
  while ((corrMatch = correctionRegex.exec(raw)) !== null) {
    const block = corrMatch[1];
    const wrongMatch = /wrong:\s*"([^"]*)"/.exec(block);
    const rightMatch = /right:\s*"([^"]*)"/.exec(block);
    const tipMatch = /tip:\s*"([^"]*)"/.exec(block);
    if (wrongMatch && rightMatch && tipMatch) {
      corrections.push({
        wrong: wrongMatch[1],
        right: rightMatch[1],
        tip: tipMatch[1],
      });
    }
  }

  // Extract marked words
  const wordRegex = /\[WORD\](.*?)\[\/WORD\]/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordRegex.exec(raw)) !== null) {
    markedWords.push(wordMatch[1]);
  }

  // Extract suggestions
  const suggestionsMatch = /\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/.exec(
    raw,
  );
  if (suggestionsMatch) {
    const lines = suggestionsMatch[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) {
        suggestions.push(trimmed.slice(2).trim());
      }
    }
  }

  // Clean text: remove all markers
  const text = raw
    .replace(/\[CORRECTION\][\s\S]*?\[\/CORRECTION\]/g, "")
    .replace(/\[WORD\](.*?)\[\/WORD\]/g, "$1")
    .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, "")
    .trim();

  return { text, corrections, markedWords, suggestions };
}
