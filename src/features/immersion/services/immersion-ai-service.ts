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
      prompt: `You are a German etymology expert helping an Italian-speaking B1 learner.

Given the German word "${term}" (${type}), generate its word family (Wortfamilie).

RULES:
- Find the root/stem and list 6-10 REAL German words derived from the same root.
- Only include words that ACTUALLY EXIST in German. Do NOT invent words.
- For each word: term, type (noun/verb/adjective/adverb/preposition), gender (der/die/das for nouns ONLY, null for all other types), translation IN ITALIAN, prefix (separable/inseparable prefix if applicable, null otherwise).
- Order from most common to least common. Focus on B1-level vocabulary.
- If the word has no obvious family (e.g. simple root words), return fewer words rather than inventing connections.

Example: "fahren" → Fahrer, Fahrrad, Erfahrung, Abfahrt, erfahren, Einfahrt, mitfahren.`,
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

RULES:
- synonyms: 3-5 REAL German synonyms. Each with ITALIAN translation and intensity ("high" = nearly identical meaning, "medium" = similar concept, "low" = loosely related). Order by intensity descending. Only include words that ACTUALLY EXIST and are commonly used.
- antonyms: 2-3 REAL German antonyms with ITALIAN translation. If no natural antonym exists for this word, return an empty array.
- comparative: ONLY for adjectives — provide Komparativ and Superlativ forms (e.g. schnell → schneller → am schnellsten). For ALL other word types, return null.
- Do NOT invent German words. Every synonym and antonym must be a real, verifiable German word.`,
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

VOCABULARY WORDS TO USE: ${wordList}

RULES:
- Write a short story (100-200 words) at ${level} level.
- Use AT LEAST 5 of the vocabulary words above naturally in the text. Do NOT force them into unnatural sentences.
- Title: IN GERMAN.
- Content: coherent, engaging text about daily life in Germany. Keep grammar and vocabulary within ${level} scope.
- wordTranslations: a map of EVERY unique German word in the text → its ITALIAN translation.
  - Include articles (der→il, die→la, ein→un), prepositions, pronouns.
  - Map conjugated verbs to their INFINITIVE meaning (e.g. "isst" → "mangiare").
  - Map declined nouns/adjectives to their base meaning.
  - This map is used for tap-to-translate, so completeness is critical. Do NOT skip common words.`,
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

VOCABULARY WORDS TO USE: ${wordList}

RULES:
- Create exactly 3 listening comprehension exercises.
- Each exercise MUST use at least 1-2 of the vocabulary words above in the dialogue.
- dialogue: 2-4 SHORT sentences IN GERMAN. Keep it simple and clear for TTS (no abbreviations, no numbers as digits, no special characters). Stay within ${level} grammar and vocabulary.
- question: comprehension question IN GERMAN about the dialogue.
- options: exactly 3 answer options IN GERMAN. One correct, two plausible but wrong distractors.
- correctIndex: 0, 1, or 2.
- explanation: why the correct answer is right, IN ITALIAN.
- Vary scenarios: restaurant, directions, phone call, doctor, shopping, etc.
- Do NOT reuse the same scenario twice.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate listening exercises");
  }
  return result.output.exercises;
}
