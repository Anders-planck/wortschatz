import { Stack } from "expo-router";
import { ScrollView } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { useSearchScreen } from "@/features/search/hooks/use-search-screen";
import { RecentSearches } from "@/features/search/components/recent-searches";
import { SearchHint } from "@/features/search/components/search-hint";

export default function SearchScreen() {
  const { query, setQuery, recentWords, submitSearch } = useSearchScreen();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
      >
        {!query && <RecentSearches words={recentWords} />}
        {query && query.length < 2 && <SearchHint />}
      </ScrollView>

      <Stack.Screen.Title large>Cerca</Stack.Screen.Title>
      <Stack.SearchBar
        placeholder="Scrivi una parola..."
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onSearchButtonPress={(e) => submitSearch(e.nativeEvent.text)}
      />
    </>
  );
}
