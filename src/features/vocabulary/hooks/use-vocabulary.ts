import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

import type { Word, WordFilter } from "@/features/dictionary/types";
import { getAllWords } from "@/features/shared/db/words-repository";

export function useVocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [filter, setFilter] = useState<WordFilter>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async () => {
    const filterArg = filterRef.current
      ? { type: filterRef.current }
      : undefined;
    const result = await getAllWords(filterArg);
    setWords(result);
  }, []);

  const pullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const handleSetFilter = useCallback(
    (newFilter: WordFilter) => {
      setFilter(newFilter);
      filterRef.current = newFilter;
      load();
    },
    [load],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return {
    words,
    filter,
    setFilter: handleSetFilter,
    isRefreshing,
    refresh: pullToRefresh,
  };
}
