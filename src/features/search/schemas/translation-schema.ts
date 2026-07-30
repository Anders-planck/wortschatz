import { z } from "zod";

export const TranslationLanguageSchema = z.enum(["it", "fr", "de"]);

export const PhraseTokenSchema = z.object({
  source: z.string(),
  target: z.string(),
  role: z.string(),
  explanation: z.string(),
});

export const PhraseBreakdownSchema = z.object({
  sourcePhrase: z.string(),
  translatedPhrase: z.string(),
  literalMeaning: z.string(),
  explanation: z.string(),
  grammarNotes: z.array(z.string()),
  tokens: z.array(PhraseTokenSchema),
});

export const TranslationAnalysisSchema = z.object({
  detectedSourceLanguage: TranslationLanguageSchema,
  targetLanguage: TranslationLanguageSchema,
  sourceText: z.string(),
  translatedText: z.string(),
  naturalTranslation: z.string(),
  overallExplanation: z.string(),
  usageNotes: z.array(z.string()),
  alternativeTranslations: z.array(z.string()),
  phraseBreakdown: z.array(PhraseBreakdownSchema),
  extractedText: z.string().nullable(),
  extractionNotes: z.array(z.string()),
});
