import { useState, useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
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
    setIsLoading(true);
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWords} />
        }
      >
        {/* Mastery progress card */}
        <View
          style={{
            backgroundColor: colors.accentLight,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            gap: 12,
            marginBottom: 16,
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

          <Text
            style={[
              textStyles.bodyLight,
              { fontSize: 12, color: colors.textMuted },
            ]}
          >
            {words.length} {words.length === 1 ? "parola" : "parole"}
          </Text>
        </View>

        {/* Word list */}
        {words.map((word, index) => (
          <VocabularyItem
            key={word.term}
            word={word}
            index={index}
            onDeleted={loadWords}
          />
        ))}

        {/* Empty state */}
        {!isLoading && words.length === 0 && (
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
        )}
      </ScrollView>

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
