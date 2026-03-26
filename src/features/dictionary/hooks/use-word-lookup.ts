import { useState, useCallback } from "react";
import type { Word } from "@/features/dictionary/types";
import {
  lookupFromCache,
  lookupFromWiktionary,
  lookupFromAI,
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
      // 1. Cache → instant
      const cached = await lookupFromCache(normalized);
      if (cached) {
        setWord(cached);
        setIsLoading(false);
        return;
      }

      // 2. Wiktionary → fast, structured
      let baseWord: Word | null = null;
      try {
        baseWord = await lookupFromWiktionary(normalized);
      } catch {
        // Wiktionary failed (network) — fall through to AI
      }

      if (baseWord) {
        setWord(baseWord);
        setIsLoading(false);
        setIsAILoading(true);

        try {
          const enriched = await enrichWithAI(baseWord);
          setWord(enriched);
        } catch {
          // AI enrichment failed — word still usable with Wiktionary data
        } finally {
          setIsAILoading(false);
        }
        return;
      }

      // 3. AI-only fallback → Gemini generates everything
      setIsAILoading(true);
      const aiWord = await lookupFromAI(normalized);
      setWord(aiWord);
      setIsLoading(false);
      setIsAILoading(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Nessuna connessione";
      setError(message);
      setIsLoading(false);
      setIsAILoading(false);
    }
  }, []);

  return { word, isLoading, isAILoading, error, lookup };
}
