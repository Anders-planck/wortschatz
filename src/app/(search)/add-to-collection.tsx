import { useState, useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { Collection } from "@/features/collections/types";
import {
  getCollections,
  getCollectionsForWord,
  addWordToCollection,
  removeWordFromCollection,
} from "@/features/shared/db/collections-repository";

export default function AddToCollectionScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();

  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    const [collections, wordCollections] = await Promise.all([
      getCollections(),
      getCollectionsForWord(Number(wordId)),
    ]);
    setAllCollections(collections);
    setMemberIds(new Set(wordCollections.map((c) => c.id)));
  }, [wordId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleCollection = useCallback(
    async (collectionId: number) => {
      const isMember = memberIds.has(collectionId);
      if (isMember) {
        await removeWordFromCollection(collectionId, Number(wordId));
        setMemberIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      } else {
        await addWordToCollection(collectionId, Number(wordId));
        setMemberIds((prev) => new Set(prev).add(collectionId));
      }
    },
    [wordId, memberIds],
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 8, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <Text style={[textStyles.heading, { fontSize: 18, marginBottom: 8 }]}>
          Aggiungi a lista
        </Text>

        {allCollections.map((col) => {
          const isMember = memberIds.has(col.id);
          return (
            <Pressable
              key={col.id}
              onPress={() => toggleCollection(col.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.card,
                borderRadius: 12,
                borderCurve: "continuous",
                padding: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: col.color + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={`sf:${col.icon}`}
                  style={{ width: 18, height: 18 }}
                  tintColor={col.color}
                />
              </View>

              <Text
                style={[textStyles.heading, { flex: 1, fontSize: 14 }]}
                numberOfLines={1}
              >
                {col.name}
              </Text>

              {isMember && (
                <Image
                  source="sf:checkmark.circle.fill"
                  style={{ width: 22, height: 22 }}
                  tintColor={colors.accent}
                />
              )}
            </Pressable>
          );
        })}

        {/* Create new collection row */}
        <Pressable
          onPress={() => router.push("/create-collection")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 14,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source="sf:plus"
              style={{ width: 18, height: 18 }}
              tintColor={colors.textMuted}
            />
          </View>

          <Text
            style={[
              textStyles.bodyLight,
              { fontSize: 14, color: colors.textMuted },
            ]}
          >
            Crea nuova lista
          </Text>
        </Pressable>
      </ScrollView>

      <Stack.Screen options={{ title: "Aggiungi a lista" }} />
    </>
  );
}
