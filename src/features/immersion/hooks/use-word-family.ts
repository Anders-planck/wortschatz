import { useState, useEffect } from "react";
import { generateWordFamily } from "../services/immersion-ai-service";
import type { WordFamily } from "../types";

export function useWordFamily(term: string, type: string) {
  const [family, setFamily] = useState<WordFamily | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    generateWordFamily(term, type)
      .then((result) => {
        if (!cancelled) setFamily(result);
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile generare la famiglia di parole");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [term, type]);

  return { family, isLoading, error };
}
