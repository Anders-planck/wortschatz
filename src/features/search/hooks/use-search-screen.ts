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
      if (/\s/.test(normalized)) {
        router.push({
          pathname: "/translate",
          params: { text: normalized },
        });
        return;
      }

      router.push(`/word/${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  const openTranslate = useCallback(() => {
    router.push("/translate");
  }, [router]);

  const openScan = useCallback(() => {
    router.push("/scan-translate");
  }, [router]);

  return {
    query,
    setQuery,
    recentWords,
    refreshRecent: loadRecent,
    submitSearch,
    openTranslate,
    openScan,
  };
}
