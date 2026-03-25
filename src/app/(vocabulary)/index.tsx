import { Stack } from "expo-router";
import { FlatList } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary";
import { FilterChips } from "@/features/vocabulary/components/filter-chips";
import { VocabularyItem } from "@/features/vocabulary/components/vocabulary-item";
import { VocabularyEmpty } from "@/features/vocabulary/components/vocabulary-empty";

export default function VocabularyScreen() {
  const { words, filter, setFilter, isLoading, refresh } = useVocabulary();

  return (
    <>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24 }}
        data={words}
        renderItem={({ item, index }) => (
          <VocabularyItem word={item} index={index} />
        )}
        keyExtractor={(item) => item.term}
        ListHeaderComponent={
          <FilterChips
            filter={filter}
            setFilter={setFilter}
            totalCount={words.length}
          />
        }
        ListEmptyComponent={<VocabularyEmpty isLoading={isLoading} />}
        onRefresh={refresh}
        refreshing={isLoading}
      />

      <Stack.Screen.Title large>Parole</Stack.Screen.Title>
    </>
  );
}
