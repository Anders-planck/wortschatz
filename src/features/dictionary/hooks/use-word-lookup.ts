import { useState, useCallback } from "react";
import type { Word } from "@/features/dictionary/types";
import {
  lookupFromCache,
  lookupFromWiktionary,
  enrichWithAI,
} from "@/features/dictionary/services/word-lookup-service";

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
    const normalized = term.trim();
    if (!normalized) return;

    setIsLoading(true);
    setError(null);
    setWord(null);
    setIsAILoading(false);

    try {
      const cached = await lookupFromCache(normalized);
      if (cached) {
        setWord(cached);
        setIsLoading(false);
        return;
      }

      const baseWord = await lookupFromWiktionary(normalized);
      if (!baseWord) {
        setError(`"${normalized}" nicht gefunden`);
        setIsLoading(false);
        return;
      }

      setWord(baseWord);
      setIsLoading(false);
      setIsAILoading(true);

      try {
        const enriched = await enrichWithAI(baseWord);
        setWord(enriched);
      } catch {
        // AI failure is non-critical
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
