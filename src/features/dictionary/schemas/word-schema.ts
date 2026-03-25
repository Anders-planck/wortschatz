import { z } from "zod";

export const WordTypeSchema = z.enum([
  "noun",
  "verb",
  "preposition",
  "adjective",
  "adverb",
]);
export const GenderSchema = z.enum(["der", "die", "das"]);

export const ClickableWordSchema = z.object({
  word: z.string(),
  meaning: z.string(),
});

export const ExampleSchema = z.object({
  sentence: z.string(),
  translation: z.string(),
  words: z.array(ClickableWordSchema),
});

export const WordContextSchema = z.object({
  examples: z.array(ExampleSchema),
  usageContext: z.string(),
  category: z.string(),
});

export const WordSchema = z.object({
  id: z.number().optional(),
  term: z.string(),
  type: WordTypeSchema,
  gender: GenderSchema.nullable(),
  plural: z.string().nullable(),
  translations: z.array(z.string()),
  forms: z.record(z.string(), z.unknown()).nullable(),
  examples: z.array(ExampleSchema).nullable(),
  usageContext: z.string().nullable(),
  audioUrl: z.string().nullable(),
  rawWiktionary: z.record(z.string(), z.unknown()).nullable(),
  searchedAt: z.string(),
  reviewScore: z.number().default(0),
  nextReview: z.string().nullable(),
  category: z.string().nullable(),
  createdAt: z.string(),
});
