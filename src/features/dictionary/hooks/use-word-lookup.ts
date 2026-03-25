import { useState, useCallback } from "react";
import type { Word } from "@/features/dictionary/types";
import { fetchFromWiktionary } from "@/features/dictionary/services/wiktionary-client";
import { generateWordContext } from "@/features/dictionary/services/ai-context-service";
import {
  getWordByTerm,
  insertWord,
  updateWordAIContent,
} from "@/features/shared/db/words-repository";

interface UseWordLookupReturn {
  word: Word | null;
  isLoading: boolean;
  isAILoading: boolean;
  error: string | null;
  lookup: (term: string) => Promise<void>;
}

export function useWordLookup(): UseWordLookupReturn {
  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (term: string) => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;

    setIsLoading(true);
    setError(null);
    setWord(null);
    setIsAILoading(false);

    try {
      // Phase 0: Check SQLite cache
      const cached = await getWordByTerm(normalized);
      if (cached) {
        setWord(cached);
        setIsLoading(false);
        return;
      }

      // Phase 1: Fetch from Wiktionary
      const wiktionaryData = await fetchFromWiktionary(normalized);

      if (!wiktionaryData) {
        setError(`"${normalized}" nicht gefunden`);
        setIsLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const baseWord: Omit<Word, "id"> = {
        term: wiktionaryData.term ?? normalized,
        type: wiktionaryData.type ?? "noun",
        gender: wiktionaryData.gender ?? null,
        plural: wiktionaryData.plural ?? null,
        translations: wiktionaryData.translations ?? [],
        forms: wiktionaryData.forms ?? null,
        examples: null,
        usageContext: null,
        audioUrl: null,
        rawWiktionary: wiktionaryData.rawWiktionary ?? null,
        searchedAt: now,
        reviewScore: 0,
        nextReview: null,
        category: null,
        createdAt: now,
      };

      // Save base word to SQLite
      const id = await insertWord(baseWord);
      const savedWord: Word = { ...baseWord, id };
      setWord(savedWord);
      setIsLoading(false);

      // Phase 2: AI enrichment (background, non-critical)
      setIsAILoading(true);
      try {
        const context = await generateWordContext(wiktionaryData);

        await updateWordAIContent(
          savedWord.term,
          context.examples,
          context.usageContext,
          context.category,
        );

        setWord((prev) =>
          prev
            ? {
                ...prev,
                examples: context.examples,
                usageContext: context.usageContext,
                category: context.category,
              }
            : prev,
        );
      } catch {
        // AI failure is non-critical — word is still usable without context
      } finally {
        setIsAILoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Fehler bei der Wortsuche";
      setError(message);
      setIsLoading(false);
      setIsAILoading(false);
    }
  }, []);

  return { word, isLoading, isAILoading, error, lookup };
}
