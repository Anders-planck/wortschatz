import type { Word } from "@/features/dictionary/types";
import { fetchFromWiktionary } from "./wiktionary-client";
import {
  getWordByTerm,
  insertWord,
  updateWordAIContent,
} from "@/features/shared/db/words-repository";
import { generateWordContext } from "./ai-context-service";

export interface LookupResult {
  word: Word;
  fromCache: boolean;
}

export async function lookupFromCache(term: string): Promise<Word | null> {
  return getWordByTerm(term);
}

export async function lookupFromWiktionary(term: string): Promise<Word | null> {
  const data = await fetchFromWiktionary(term);
  if (!data) return null;

  const now = new Date().toISOString();
  const baseWord: Omit<Word, "id"> = {
    term: data.term ?? term,
    type: data.type ?? "noun",
    gender: data.gender ?? null,
    plural: data.plural ?? null,
    translations: data.translations ?? [],
    forms: data.forms ?? null,
    examples: null,
    usageContext: null,
    audioUrl: null,
    rawWiktionary: data.rawWiktionary ?? null,
    searchedAt: now,
    reviewScore: 0,
    nextReview: null,
    category: null,
    createdAt: now,
  };

  const id = await insertWord(baseWord);
  return { ...baseWord, id };
}

export async function enrichWithAI(word: Word): Promise<Word> {
  const context = await generateWordContext(word);

  await updateWordAIContent(
    word.term,
    context.examples,
    context.usageContext,
    context.category,
  );

  return {
    ...word,
    examples: context.examples,
    usageContext: context.usageContext,
    category: context.category,
  };
}
