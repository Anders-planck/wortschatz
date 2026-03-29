import { z } from "zod";
import { generateText, Output } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import { trackAiCall } from "@/features/shared/services/ai-usage-tracker";
import type { Word } from "@/features/dictionary/types";
import { COLLECTION_ICONS } from "@/features/collections/types";

const TriageGroupSchema = z.object({
  name: z.string(),
  icon: z.string(),
  words: z.array(z.string()),
  reason: z.string(),
});

const TriageResultSchema = z.object({
  groups: z.array(TriageGroupSchema),
});

export type TriageGroup = z.infer<typeof TriageGroupSchema>;

const AutoPopulateSchema = z.object({
  words: z.array(z.string()),
});

const iconList = COLLECTION_ICONS.join(", ");

export async function triageWords(words: Word[]): Promise<TriageGroup[]> {
  if (words.length === 0) return [];

  const terms = words.map((w) => w.term).join(", ");

  const result = await trackAiCall("collections", () =>
    generateText({
      model: google("gemini-2.5-flash-lite"),
      output: Output.object({
        schema: TriageResultSchema,
      }),
      prompt: `You are a German vocabulary organizer for an Italian-speaking student.

WORDS TO ORGANIZE (use ONLY these, do NOT invent new words): ${terms}

RULES:
- Organize into 3-5 thematic groups.
- Every word from the list MUST appear in exactly one group. Do NOT skip any word.
- Do NOT add words that are not in the list above.
- "name": short thematic name IN GERMAN (e.g. "Essen & Trinken", "Reise", "Alltag").
- "icon": MUST be one of these: ${iconList}. Pick the closest match.
- "words": array of German terms from the list above. Copy-paste exactly as written.
- "reason": brief explanation IN ITALIAN of why these words are grouped together.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate vocabulary triage");
  }

  return result.output.groups;
}

export async function autoPopulateCollection(
  collectionName: string,
  allWords: Word[],
): Promise<string[]> {
  if (allWords.length === 0) return [];

  const terms = allWords.map((w) => w.term).join(", ");

  const result = await trackAiCall("collections", () =>
    generateText({
      model: google("gemini-2.5-flash-lite"),
      output: Output.object({
        schema: AutoPopulateSchema,
      }),
      prompt: `You are a German vocabulary organizer for an Italian-speaking student.

The user has a collection named "${collectionName}".

AVAILABLE WORDS (select ONLY from this list): ${terms}

RULES:
- Return ONLY words from the list above that thematically fit the collection "${collectionName}".
- Do NOT invent or add words that are not in the list.
- Copy-paste the terms EXACTLY as written (preserve capitalization).
- If no words fit, return an empty array.
- Be strict: only include words with a clear thematic connection.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to auto-populate collection");
  }

  return result.output.words;
}
