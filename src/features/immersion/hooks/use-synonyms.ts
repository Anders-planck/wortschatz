import { useState, useEffect } from "react";
import { generateSynonymsAntonyms } from "../services/immersion-ai-service";
import {
  getSynonymsCache,
  setSynonymsCache,
} from "@/features/shared/db/words-repository";
import type { SynonymsAntonyms } from "../types";

export function useSynonyms(
  term: string | undefined,
  type: string | undefined,
) {
  const [data, setData] = useState<SynonymsAntonyms | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!term || !type) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setData(null);
    setIsLoading(true);

    (async () => {
      try {
        const cached = await getSynonymsCache(term);
        if (cached) {
          if (!cancelled) {
            setData(cached);
            setIsLoading(false);
          }
          return;
        }

        const result = await generateSynonymsAntonyms(term, type);
        await setSynonymsCache(term, result).catch(() => {});
        if (!cancelled) {
          setData(result);
        }
      } catch {
        // Silently fail — synonyms are supplementary
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [term, type]);

  return { data, isLoading };
}
