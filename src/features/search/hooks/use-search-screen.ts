import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { getRecentWords } from "@/features/shared/db/words-repository";
import type { Word } from "@/features/dictionary/types";

export function useSearchScreen() {
  const [query, setQuery] = useState("");
  const [recentWords, setRecentWords] = useState<Word[]>([]);
  const router = useRouter();
  const hasNavigated = useRef(false);

  const loadRecent = useCallback(async () => {
    try {
      const words = await getRecentWords(20);
      setRecentWords(words);
    } catch {
      // Empty list on error
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasNavigated.current = false;
      loadRecent();
    }, [loadRecent]),
  );

  const submitSearch = useCallback(
    (term: string) => {
      const normalized = term.trim();
      if (normalized.length < 2 || hasNavigated.current) return;
      hasNavigated.current = true;
      router.push(`/word/${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  return { query, setQuery, recentWords, submitSearch };
}
