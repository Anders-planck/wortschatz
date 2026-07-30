import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useSearchScreen } from "@/features/search/hooks/use-search-screen";
import { RecentSearches } from "@/features/search/components/recent-searches";
import { SearchHint } from "@/features/search/components/search-hint";

export default function SearchScreen() {
  const { colors, textStyles } = useAppTheme();
  const {
    query,
    setQuery,
    recentWords,
    refreshRecent,
    submitSearch,
    openTranslate,
    openScan,
  } = useSearchScreen();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <View style={{ gap: 8 }}>
          <Text style={textStyles.monoLabel}>Cerca</Text>
          <Text
            style={[
              textStyles.word,
              { fontSize: 36, lineHeight: 36, maxWidth: 250 },
            ]}
          >
            Cerca.
          </Text>
          <Text
            style={[
              textStyles.body,
              { color: colors.textSecondary, lineHeight: 22 },
            ]}
          >
            Cerca una parola, apri la traduzione dettagliata o passa alla
            scansione direttamente dall’header.
          </Text>
        </View>

        {!query ? <RecentSearches words={recentWords} onDeleted={refreshRecent} /> : null}

        {query && query.length < 2 ? <SearchHint /> : null}
      </ScrollView>

      <Stack.Screen.Title large>Cerca</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="text.alignleft"
          onPress={openTranslate}
        />
        <Stack.Toolbar.Button
          icon="camera.viewfinder"
          onPress={openScan}
        />
      </Stack.Toolbar>
      <Stack.SearchBar
        placeholder="Scrivi una parola o una frase..."
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onSearchButtonPress={(e) => submitSearch(e.nativeEvent.text)}
      />
    </>
  );
}
