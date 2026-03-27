import { useState, useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useCollections } from "@/features/collections/hooks/use-collections";
import { getCollectionWords } from "@/features/shared/db/collections-repository";
import { VocabularyItem } from "@/features/vocabulary/components/vocabulary-item";
import type { Word } from "@/features/dictionary/types";
import { useFocusEffect } from "expo-router";

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { collections } = useCollections();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const collection = collections.find((c) => c.id === Number(id));

  const loadWords = useCallback(async () => {
    try {
      const result = await getCollectionWords(Number(id));
      setWords(result);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords]),
  );

  const masteryPercent = collection?.masteryPercent ?? 0;

  return (
    <>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        data={words}
        renderItem={({ item, index }) => (
          <VocabularyItem word={item} index={index} onDeleted={loadWords} />
        )}
        keyExtractor={(item) => item.term}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            {/* Mastery progress card */}
            <View
              style={{
                backgroundColor: colors.accentLight,
                borderRadius: 16,
                borderCurve: "continuous",
                padding: 20,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    textStyles.bodyLight,
                    { fontSize: 13, color: colors.textSecondary },
                  ]}
                >
                  Padronanza
                </Text>
                <Text style={[textStyles.heading, { color: colors.accent }]}>
                  {masteryPercent}%
                </Text>
              </View>

              {/* Progress bar */}
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3,
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                    width: `${masteryPercent}%`,
                  }}
                />
              </View>

              {/* Word count */}
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 12, color: colors.textMuted },
                ]}
              >
                {words.length} {words.length === 1 ? "parola" : "parole"}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 40,
                gap: 8,
              }}
            >
              <Text
                style={[
                  textStyles.heading,
                  { fontSize: 16, color: colors.textMuted },
                ]}
              >
                Nessuna parola
              </Text>
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 13, color: colors.textHint, textAlign: "center" },
                ]}
              >
                Aggiungi parole a questa lista dalla schermata di dettaglio
                parola.
              </Text>
            </View>
          ) : null
        }
        onRefresh={loadWords}
        refreshing={isLoading}
      />

      <Stack.Screen options={{ title: collection?.name ?? "Lista" }} />

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="play.fill"
          onPress={() =>
            router.push({
              pathname: "/(review)/session",
              params: { collectionId: String(id) },
            })
          }
        />
      </Stack.Toolbar>
    </>
  );
}
