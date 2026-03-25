import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

import type { Word } from "@/features/dictionary/types";
import { getAllWords } from "@/features/shared/db/words-repository";

type WordFilter = "noun" | "verb" | "preposition" | undefined;

export function useVocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [filter, setFilter] = useState<WordFilter>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const filterArg = filterRef.current
        ? { type: filterRef.current }
        : undefined;
      const result = await getAllWords(filterArg);
      setWords(result);
    } catch {
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetFilter = useCallback(
    (newFilter: WordFilter) => {
      setFilter(newFilter);
      filterRef.current = newFilter;
      refresh();
    },
    [refresh],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    words,
    filter,
    setFilter: handleSetFilter,
    isLoading,
    refresh,
  };
}
