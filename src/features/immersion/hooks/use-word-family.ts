import { useState, useEffect } from "react";
import { generateWordFamily } from "../services/immersion-ai-service";
import {
  getWordFamilyCache,
  setWordFamilyCache,
} from "@/features/shared/db/words-repository";
import type { WordFamily } from "../types";

export function useWordFamily(term: string, type: string) {
  const [family, setFamily] = useState<WordFamily | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!term) {
      setFamily(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setFamily(null);
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const cached = await getWordFamilyCache(term);
        if (cached) {
          if (!cancelled) {
            setFamily(cached);
            setIsLoading(false);
          }
          return;
        }

        const result = await generateWordFamily(term, type);
        await setWordFamilyCache(term, result).catch(() => {});
        if (!cancelled) {
          setFamily(result);
        }
      } catch {
        if (!cancelled) setError("Impossibile generare la famiglia di parole");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [term, type]);

  return { family, isLoading, error };
}
