import { useCallback } from "react";
import { Stack } from "expo-router";
import { FlatList, Text, View } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary";
import { FilterChips } from "@/features/vocabulary/components/filter-chips";
import { VocabularyItem } from "@/features/vocabulary/components/vocabulary-item";
import type { Word } from "@/features/dictionary/types";

export default function VocabularyScreen() {
  const { words, filter, setFilter, isLoading, refresh } = useVocabulary();

  const renderItem = useCallback(
    ({ item, index }: { item: Word; index: number }) => (
      <VocabularyItem word={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Word) => item.term, []);

  const ListHeader = useCallback(
    () => (
      <FilterChips
        filter={filter}
        setFilter={setFilter}
        totalCount={words.length}
      />
    ),
    [filter, setFilter, words.length],
  );

  const ListEmpty = useCallback(
    () =>
      !isLoading ? (
        <View
          style={{
            paddingTop: 40,
            alignItems: "center",
          }}
        >
          <Text
            selectable
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: "300",
              color: colors.textHint,
              textAlign: "center",
            }}
          >
            Nessuna parola salvata.{"\n"}Cerca una parola per iniziare.
          </Text>
        </View>
      ) : null,
    [isLoading],
  );

  return (
    <>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24 }}
        data={words}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        onRefresh={refresh}
        refreshing={isLoading}
      />

      <Stack.Screen.Title large>Parole</Stack.Screen.Title>
    </>
  );
}
