import type { z } from "zod";
import {
  type PhraseTokenSchema,
  type PhraseBreakdownSchema,
  type TranslationAnalysisSchema,
  type TranslationLanguageSchema,
} from "./schemas/translation-schema";

export type TranslationLanguage = z.infer<typeof TranslationLanguageSchema>;
export type TranslationSourceLanguage = TranslationLanguage | "auto";
export type PhraseToken = z.infer<typeof PhraseTokenSchema>;
export type PhraseBreakdown = z.infer<typeof PhraseBreakdownSchema>;
export type TranslationAnalysis = z.infer<typeof TranslationAnalysisSchema>;

export const LANGUAGE_LABELS: Record<TranslationLanguage, string> = {
  it: "Italiano",
  fr: "Francese",
  de: "Tedesco",
};

export const SOURCE_LANGUAGE_OPTIONS: {
  value: TranslationSourceLanguage;
  label: string;
}[] = [
  { value: "auto", label: "Auto" },
  { value: "it", label: "IT" },
  { value: "fr", label: "FR" },
  { value: "de", label: "DE" },
];

export const TARGET_LANGUAGE_OPTIONS: {
  value: TranslationLanguage;
  label: string;
}[] = [
  { value: "de", label: "DE" },
  { value: "it", label: "IT" },
  { value: "fr", label: "FR" },
];
