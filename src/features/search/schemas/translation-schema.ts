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
  grammarNotes: z.array(z.string()).min(1).max(6),
  tokens: z.array(PhraseTokenSchema).min(1),
});

export const TranslationAnalysisSchema = z.object({
  detectedSourceLanguage: TranslationLanguageSchema,
  targetLanguage: TranslationLanguageSchema,
  sourceText: z.string(),
  translatedText: z.string(),
  naturalTranslation: z.string(),
  overallExplanation: z.string(),
  usageNotes: z.array(z.string()).min(2).max(8),
  alternativeTranslations: z.array(z.string()).max(5),
  phraseBreakdown: z.array(PhraseBreakdownSchema).min(1),
  extractedText: z.string().nullable(),
  extractionNotes: z.array(z.string()).max(5),
});
