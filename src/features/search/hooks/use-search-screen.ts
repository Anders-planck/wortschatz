import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { getRecentWords } from "@/features/shared/db/words-repository";
import { useDebouncedSearch } from "@/features/search/hooks/use-debounced-search";
import type { Word } from "@/features/dictionary/types";

export function useSearchScreen() {
  const [query, setQuery] = useState("");
  const [recentWords, setRecentWords] = useState<Word[]>([]);
  const router = useRouter();
  const debouncedQuery = useDebouncedSearch(query, 400);
  const hasNavigated = useRef(false);

  const loadRecent = useCallback(async () => {
    try {
      const words = await getRecentWords(20);
      setRecentWords(words);
    } catch {
      // Empty list is acceptable — no user-facing error needed
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasNavigated.current = false;
      loadRecent();
    }, [loadRecent]),
  );

  useEffect(() => {
    if (debouncedQuery.length >= 2 && !hasNavigated.current) {
      hasNavigated.current = true;
      router.push(`/word/${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery, router]);

  return { query, setQuery, recentWords };
}
