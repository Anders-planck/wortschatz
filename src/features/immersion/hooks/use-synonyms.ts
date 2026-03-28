import { useState, useEffect } from "react";
import { generateSynonymsAntonyms } from "../services/immersion-ai-service";
import type { SynonymsAntonyms } from "../types";

export function useSynonyms(
  term: string | undefined,
  type: string | undefined,
) {
  const [data, setData] = useState<SynonymsAntonyms | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!term || !type) return;

    let cancelled = false;
    setIsLoading(true);

    generateSynonymsAntonyms(term, type)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        // Silently fail — synonyms are supplementary
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [term, type]);

  return { data, isLoading };
}
