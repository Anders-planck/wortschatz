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
