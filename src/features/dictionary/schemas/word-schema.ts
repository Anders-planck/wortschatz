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

export const ConjugationTenseSchema = z.object({
  ich: z.string(),
  du: z.string(),
  er: z.string(), // er/sie/es
  wir: z.string(),
  ihr: z.string(),
  sie: z.string(), // sie/Sie
});

export const VerbConjugationSchema = z.object({
  isIrregular: z
    .boolean()
    .describe("true if this is an irregular (strong) verb"),
  hilfsverb: z.enum(["haben", "sein"]).describe("Auxiliary verb for Perfekt"),
  partizipII: z.string().describe("Past participle, e.g. 'gegessen'"),
  prateritum: z.string().describe("Prateritum 3rd person, e.g. 'ass'"),
  present: ConjugationTenseSchema.describe("Prasens conjugation"),
  pastSimple: ConjugationTenseSchema.describe("Prateritum conjugation"),
  konjunktivII: ConjugationTenseSchema.describe("Konjunktiv II conjugation"),
});

export const WordContextSchema = z.object({
  germanTerm: z
    .string()
    .describe(
      "The German word. If the user searched in Italian, this is the German equivalent (e.g. 'essen' for 'mangiare'). If already German, same as input.",
    ),
  wordType: WordTypeSchema.describe(
    "Part of speech: noun, verb, preposition, adjective, or adverb",
  ),
  gender: GenderSchema.nullable().describe(
    "Article for nouns (der/die/das), null for non-nouns",
  ),
  plural: z
    .string()
    .nullable()
    .describe("Plural form for nouns, null for non-nouns"),
  translationsIt: z
    .array(z.string())
    .describe("Italian translations, 2-4 options"),
  examples: z.array(ExampleSchema),
  usageContext: z.string(),
  category: z.string(),
  conjugation: VerbConjugationSchema.nullable().describe(
    "Full conjugation data for verbs, null for non-verbs",
  ),
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
