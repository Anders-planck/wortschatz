import { streamText } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import { trackAiStream } from "@/features/shared/services/ai-usage-tracker";
import type { Scenario, ParsedAIResponse, Correction } from "../types";

export function buildSystemPrompt(scenario: Scenario): string {
  return `You are a German conversation partner in the scenario: "${scenario.title}".
Stay in character. Respond naturally IN GERMAN at ${scenario.level} level.

RULES:
- Your response text MUST be in German. Stay within ${scenario.level} grammar and vocabulary.
- Keep responses concise: 2-4 sentences max. This is a conversation, not a lecture.
- Only correct CLEAR grammar mistakes (wrong case, wrong gender, wrong conjugation). Do NOT correct style preferences or minor word order variations.
- If the user's German is correct, do NOT include any [CORRECTION] block.
- Suggestions MUST be IN GERMAN — phrases the user could say next.

After each user message:
1. Continue the conversation naturally IN GERMAN.
2. If there are CLEAR grammar errors, show corrections (skip if none):
   [CORRECTION]
   wrong: "original text in German"
   right: "corrected text in German"
   tip: "brief explanation IN ITALIAN"
   [/CORRECTION]
3. Mark 1-3 new/advanced German words the user might not know with [WORD]term[/WORD].
4. At the end, suggest 2-3 follow-up phrases IN GERMAN:
   [SUGGESTIONS]
   - German phrase 1
   - German phrase 2
   - German phrase 3
   [/SUGGESTIONS]`;
}

export function streamChatResponse(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  return trackAiStream(
    "chat",
    streamText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt,
      messages,
    }),
  );
}

export function parseAIResponse(raw: string): ParsedAIResponse {
  const corrections: Correction[] = [];
  const markedWords: string[] = [];
  const suggestions: string[] = [];

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

  const wordRegex = /\[WORD\](.*?)\[\/WORD\]/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordRegex.exec(raw)) !== null) {
    markedWords.push(wordMatch[1]);
  }

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

  const text = raw
    .replace(/\[CORRECTION\][\s\S]*?\[\/CORRECTION\]/g, "")
    .replace(/\[WORD\](.*?)\[\/WORD\]/g, "$1")
    .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, "")
    .trim();

  return { text, corrections, markedWords, suggestions };
}
