import { useState, useEffect, useCallback, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { getRecentWords } from "@/features/shared/db/words-repository";
import { useDebouncedSearch } from "@/features/search/hooks/use-debounced-search";
import { RecentSearches } from "@/features/search/components/recent-searches";
import type { Word } from "@/features/dictionary/types";

export default function SearchScreen() {
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
      // Silently handle — empty list is fine
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

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
      >
        {query.length === 0 && <RecentSearches words={recentWords} />}

        {query.length === 1 && (
          <View style={{ paddingTop: 32, alignItems: "center" }}>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 14, color: colors.textHint },
              ]}
            >
              Continua a scrivere...
            </Text>
          </View>
        )}

        {query.length >= 2 && (
          <View style={{ paddingTop: 32, alignItems: "center" }}>
            <Text style={textStyles.mono}>Cerco &ldquo;{query}&rdquo;...</Text>
          </View>
        )}
      </ScrollView>

      <Stack.Screen.Title large>Cerca</Stack.Screen.Title>
      <Stack.SearchBar
        placeholder="Scrivi una parola..."
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
      />
    </>
  );
}
