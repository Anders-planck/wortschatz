import { z } from "zod";

// --- Word Family ---

export const FamilyWordSchema = z.object({
  term: z.string(),
  type: z.enum(["noun", "verb", "adjective", "adverb", "preposition"]),
  gender: z.enum(["der", "die", "das"]).nullable(),
  translation: z.string(),
  prefix: z
    .string()
    .nullable()
    .describe("Separable/inseparable prefix if applicable"),
});

export const WordFamilySchema = z.object({
  root: z.string().describe("The root word/stem"),
  words: z.array(FamilyWordSchema),
});

export type FamilyWord = z.infer<typeof FamilyWordSchema>;
export type WordFamily = z.infer<typeof WordFamilySchema>;

// --- Synonyms / Antonyms ---

export const SynonymSchema = z.object({
  term: z.string(),
  translation: z.string(),
  intensity: z.enum(["high", "medium", "low"]),
});

export const AntonymSchema = z.object({
  term: z.string(),
  translation: z.string(),
});

export const ComparativeSchema = z.object({
  komparativ: z.string(),
  superlativ: z.string(),
});

export const SynonymsAntonymsSchema = z.object({
  synonyms: z.array(SynonymSchema),
  antonyms: z.array(AntonymSchema),
  comparative: ComparativeSchema.nullable().describe("Only for adjectives"),
});

export type Synonym = z.infer<typeof SynonymSchema>;
export type Antonym = z.infer<typeof AntonymSchema>;
export type Comparative = z.infer<typeof ComparativeSchema>;
export type SynonymsAntonyms = z.infer<typeof SynonymsAntonymsSchema>;

// --- Reading ---

export const ReadingSchema = z.object({
  title: z.string(),
  level: z.string(),
  content: z.string().describe("Story text, 100-200 words"),
  wordTranslations: z
    .record(z.string(), z.string())
    .describe("German word → Italian translation for all words"),
});

export type Reading = z.infer<typeof ReadingSchema>;

export interface SavedReading {
  id: number;
  title: string;
  level: string;
  content: string;
  wordTranslations: Record<string, string>;
  wordCount: number;
  createdAt: string;
}

// --- Listening ---

export const ListeningExerciseSchema = z.object({
  dialogue: z.string().describe("Text to be spoken via TTS"),
  question: z.string().describe("Comprehension question in German"),
  options: z.array(z.string()).length(3),
  correctIndex: z.number().min(0).max(2),
  explanation: z.string().describe("Why the answer is correct, in Italian"),
});

export const ListeningSetSchema = z.object({
  exercises: z.array(ListeningExerciseSchema),
});

export type ListeningExercise = z.infer<typeof ListeningExerciseSchema>;
