import { useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useWordLookup } from "@/features/dictionary/hooks/use-word-lookup";

export function useWordDetail() {
  const { term } = useLocalSearchParams<{ term: string }>();
  const router = useRouter();
  const { word, isLoading, isAILoading, error, lookup } = useWordLookup();

  useEffect(() => {
    if (term) {
      lookup(term);
    }
  }, [term, lookup]);

  const handleWordPress = useCallback(
    (pressedWord: string, _meaning: string) => {
      router.push(`/word/${encodeURIComponent(pressedWord)}`);
    },
    [router],
  );

  return { term, word, isLoading, isAILoading, error, handleWordPress };
}
