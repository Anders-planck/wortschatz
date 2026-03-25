import type { z } from "zod";
import type {
  WordSchema,
  WordTypeSchema,
  GenderSchema,
  ExampleSchema,
  WordContextSchema,
} from "./schemas/word-schema";

export type WordType = z.infer<typeof WordTypeSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type WordContext = z.infer<typeof WordContextSchema>;
export type Word = z.infer<typeof WordSchema>;

export type CaseType = "akk" | "dat" | "gen" | "nom";

const validCases = new Set<string>(["akk", "dat", "gen", "nom"]);
export function isCaseType(value: string): value is CaseType {
  return validCases.has(value);
}
