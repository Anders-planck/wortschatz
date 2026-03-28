import { generateText, Output } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import { trackAiCall } from "@/features/shared/services/ai-usage-tracker";

const AI_MODEL = "gemini-2.5-flash-lite";

import {
  WordFamilySchema,
  SynonymsAntonymsSchema,
  ReadingSchema,
  ListeningSetSchema,
  type WordFamily,
  type SynonymsAntonyms,
  type Reading,
  type ListeningExercise,
} from "../types";

export async function generateWordFamily(
  term: string,
  type: string,
): Promise<WordFamily> {
  const result = await trackAiCall("word_family", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: WordFamilySchema }),
      prompt: `You are a German etymology expert helping an Italian-speaking learner.

Given the German word "${term}" (${type}), generate its word family (Wortfamilie).

Find the root/stem and list 6-10 related words derived from the same root.
For each word provide: term, type (noun/verb/adjective/adverb/preposition), gender (der/die/das for nouns, null otherwise), Italian translation, prefix (if it has a separable/inseparable prefix, null otherwise).

Example: "fahren" → Fahrer, Fahrrad, Erfahrung, Abfahrt, erfahren, Einfahrt, mitfahren, Führerschein.

Include common, useful words a B1 learner would encounter. Order from most common to least common.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate word family");
  }
  return result.output;
}

export async function generateSynonymsAntonyms(
  term: string,
  type: string,
): Promise<SynonymsAntonyms> {
  const result = await trackAiCall("synonyms", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: SynonymsAntonymsSchema }),
      prompt: `You are a German vocabulary expert helping an Italian-speaking B1 learner.

For the German word "${term}" (${type}):

1. Synonyms: 3-5 German synonyms with Italian translation and intensity (how similar: "high" = almost identical, "medium" = similar meaning, "low" = loosely related). Order by intensity descending.

2. Antonyms: 2-3 German antonyms with Italian translation.

3. Comparative: ONLY for adjectives — provide Komparativ and Superlativ forms. For non-adjectives, return null.

All translations must be in Italian. Only include real, commonly used words.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate synonyms/antonyms");
  }
  return result.output;
}

export async function generateReading(
  vocabularyWords: string[],
  level: string,
): Promise<Reading> {
  const wordList = vocabularyWords.join(", ");
  const result = await trackAiCall("readings", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: ReadingSchema }),
      prompt: `You are a German language teacher creating graded reading material for an Italian-speaking student.

Create a short story (100-200 words) at ${level} level using these vocabulary words naturally: ${wordList}.

Requirements:
- Title in German
- Level: "${level}"
- Content: A coherent, engaging short text (100-200 words). Use the vocabulary words naturally — don't force them.
- wordTranslations: A map of EVERY unique German word in the text → its Italian translation. Include articles, prepositions, verbs in their conjugated form mapped to the infinitive meaning. This is for tap-to-translate.

Make the story interesting and relatable — daily life in Germany, a small adventure, a conversation.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate reading");
  }
  return result.output;
}

export async function generateListeningExercises(
  vocabularyWords: string[],
  level: string,
): Promise<ListeningExercise[]> {
  const wordList = vocabularyWords.join(", ");
  const result = await trackAiCall("listening", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: ListeningSetSchema }),
      prompt: `You are a German listening comprehension teacher for an Italian-speaking ${level} student.

Create 3 listening comprehension exercises using these vocabulary words: ${wordList}.

Each exercise has:
- dialogue: A short German dialogue or paragraph (2-4 sentences) that would be read aloud via TTS
- question: A comprehension question in German about the dialogue
- options: Exactly 3 answer options in German
- correctIndex: The index (0, 1, or 2) of the correct answer
- explanation: Why the correct answer is right, explained in Italian

Make dialogues realistic — ordering at a restaurant, asking for directions, a phone call, at the doctor, etc. Vary the scenarios.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate listening exercises");
  }
  return result.output.exercises;
}
