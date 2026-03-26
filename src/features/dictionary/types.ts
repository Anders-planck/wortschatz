import type { z } from "zod";
import {
  type WordSchema,
  type WordTypeSchema,
  type GenderSchema,
  type ExampleSchema,
  type WordContextSchema,
  type ConjugationTenseSchema,
  VerbConjugationSchema,
} from "./schemas/word-schema";

export type WordType = z.infer<typeof WordTypeSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type WordContext = z.infer<typeof WordContextSchema>;
export type Word = z.infer<typeof WordSchema>;
export type ConjugationTense = z.infer<typeof ConjugationTenseSchema>;
export type VerbConjugation = z.infer<typeof VerbConjugationSchema>;

export type CaseType = "akk" | "dat" | "gen" | "nom";

const validCases = new Set<string>(["akk", "dat", "gen", "nom"]);
export function isCaseType(value: string): value is CaseType {
  return validCases.has(value);
}

export function isVerbConjugation(forms: unknown): forms is VerbConjugation {
  return VerbConjugationSchema.safeParse(forms).success;
}

export type WordFilter = WordType | undefined;
