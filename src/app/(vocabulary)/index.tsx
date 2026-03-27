import { useState, useCallback } from "react";
import { Alert, FlatList, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";

import { useThemeColors } from "@/features/shared/theme/theme-context";
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary";
import { FilterChips } from "@/features/vocabulary/components/filter-chips";
import { VocabularyItem } from "@/features/vocabulary/components/vocabulary-item";
import { VocabularyEmpty } from "@/features/vocabulary/components/vocabulary-empty";
import { CollectionGrid } from "@/features/collections/components/collection-grid";
import { useCollections } from "@/features/collections/hooks/use-collections";
import {
  updateCollection,
  deleteCollection,
} from "@/features/shared/db/collections-repository";

export default function VocabularyScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { words, filter, setFilter, isRefreshing, refresh } = useVocabulary();
  const { collections, refresh: refreshCollections } = useCollections();
  const [viewMode, setViewMode] = useState(0);

  const handleRename = useCallback(
    (id: number) => {
      const col = collections.find((c) => c.id === id);
      if (!col) return;
      Alert.prompt(
        "Rinomina",
        "Nuovo nome per la lista:",
        async (name) => {
          if (name && name.trim()) {
            await updateCollection(id, { name: name.trim() });
            refreshCollections();
          }
        },
        "plain-text",
        col.name,
      );
    },
    [collections, refreshCollections],
  );

  const handleDelete = useCallback(
    (id: number) => {
      const col = collections.find((c) => c.id === id);
      if (!col) return;
      Alert.alert(
        "Elimina lista",
        `Vuoi eliminare "${col.name}"? Le parole non verranno cancellate.`,
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Elimina",
            style: "destructive",
            onPress: async () => {
              await deleteCollection(id);
              refreshCollections();
            },
          },
        ],
      );
    },
    [collections, refreshCollections],
  );

  return (
    <>
      {viewMode === 0 ? (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: 24 }}
          data={words}
          renderItem={({ item, index }) => (
            <VocabularyItem word={item} index={index} onDeleted={refresh} />
          )}
          keyExtractor={(item) => item.term}
          ListHeaderComponent={
            <View style={{ gap: 16 }}>
              <SegmentedControl
                values={[`Tutte (${words.length})`, "Collezioni"]}
                selectedIndex={viewMode}
                onChange={(e) =>
                  setViewMode(e.nativeEvent.selectedSegmentIndex)
                }
              />
              <FilterChips
                filter={filter}
                setFilter={setFilter}
                totalCount={words.length}
              />
            </View>
          }
          ListEmptyComponent={<VocabularyEmpty isLoading={isRefreshing} />}
          onRefresh={refresh}
          refreshing={isRefreshing}
        />
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: 24 }}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={{ gap: 16 }}>
              <SegmentedControl
                values={[`Tutte (${words.length})`, "Collezioni"]}
                selectedIndex={viewMode}
                onChange={(e) =>
                  setViewMode(e.nativeEvent.selectedSegmentIndex)
                }
              />
              <CollectionGrid
                collections={collections}
                onCreateNew={() => router.push("/create-collection")}
                onReview={(id) =>
                  router.push({
                    pathname: "/(review)/session",
                    params: { collectionId: String(id) },
                  })
                }
                onRename={handleRename}
                onDelete={handleDelete}
              />
            </View>
          }
          onRefresh={refreshCollections}
          refreshing={false}
        />
      )}

      <Stack.Screen.Title large>Parole</Stack.Screen.Title>

      {viewMode === 1 && (
        <Stack.Toolbar>
          <Stack.Toolbar.Button
            icon="sparkles"
            onPress={() => router.push("/organize")}
          />
          <Stack.Toolbar.Button
            icon="plus"
            onPress={() => router.push("/create-collection")}
          />
        </Stack.Toolbar>
      )}
    </>
  );
}
