import { generateText, Output } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import { WordContextSchema } from "@/features/dictionary/schemas/word-schema";
import type { Word, WordContext } from "@/features/dictionary/types";

function buildPrompt(word: Partial<Word>): string {
  const term = word.term ?? "unknown";
  const type = word.type ?? "noun";
  const gender = word.gender;

  let typeSpecificInstruction = "";

  switch (type) {
    case "noun":
      typeSpecificInstruction = gender
        ? `This is a noun with gender "${gender}". Always include the article (${gender}) before the noun in examples. Reinforce the correct gender through repeated usage in different cases (nominative, accusative, dative).`
        : `This is a noun. Try to determine the correct article (der/die/das) and always use it in examples.`;
      break;
    case "verb":
      typeSpecificInstruction = `This is a verb. Show which case it governs (accusative, dative, or both). Include examples demonstrating case governance clearly. Show at least one reflexive or separable prefix usage if applicable.`;
      break;
    case "preposition":
      typeSpecificInstruction = `This is a preposition. Show which case(s) it takes (accusative, dative, or Wechselpräposition). Include examples with both cases if it's a two-way preposition.`;
      break;
    case "adjective":
      typeSpecificInstruction = `This is an adjective. Show different declension endings in examples (strong, weak, mixed). Include comparative/superlative if commonly used.`;
      break;
    case "adverb":
      typeSpecificInstruction = `This is an adverb. Show typical sentence positions and common collocations.`;
      break;
  }

  return `You are a German language tutor for an Italian-speaking B1 student.

Generate contextual learning data for the German word: "${term}" (${type})

${typeSpecificInstruction}

Requirements:
- "wordType": The part of speech (noun, verb, preposition, adjective, adverb). Determine it accurately.
- "gender": For nouns, provide the correct article (der/die/das). For non-nouns, return null.
- "plural": For nouns, provide the plural form (e.g. "Tische" for Tisch). For non-nouns, return null.
- "translationsIt": 2-4 Italian translations of the word, most common first.
- "examples": 2-3 real-world example sentences in practical everyday German (B1 level). Each sentence must have an Italian translation. For each sentence, provide word-by-word breakdown: every word with its Italian meaning (for clickable word exploration).
- "usageContext": Brief explanation in Italian of when and how to use this word, common mistakes, similar words.
- "category": Semantic category (e.g., "Alltag", "Arbeit", "Reisen", "Essen", "Gefühle", "Wohnung", etc.)

Keep sentences natural and useful for daily life in Germany/Austria/Switzerland.`;
}

export async function generateWordContext(
  word: Partial<Word>,
): Promise<WordContext> {
  const result = await generateText({
    model: google("gemini-2.5-flash-lite"),
    output: Output.object({
      schema: WordContextSchema,
    }),
    prompt: buildPrompt(word),
  });

  if (!result.output) {
    throw new Error("AI failed to generate structured word context");
  }

  return result.output;
}
