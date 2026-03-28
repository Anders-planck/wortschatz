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

Given these German words: ${terms}

Organize them into 3-5 thematic groups.

For each group provide:
- "name": a short thematic name in German (e.g. "Essen & Trinken", "Reise", "Alltag")
- "icon": one icon from this list that best fits the theme: ${iconList}
- "words": array of the German terms that belong to this group
- "reason": a brief explanation in Italian of why these words are grouped together

Every word must appear in exactly one group. Do not skip any word.`,
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

From the following German words, select ONLY the ones that thematically fit this collection: ${terms}

Return only the matching terms as an array. If no words fit, return an empty array.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to auto-populate collection");
  }

  return result.output.words;
}
