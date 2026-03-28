import { useCallback } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { CollectionGrid } from "@/features/collections/components/collection-grid";
import { useCollections } from "@/features/collections/hooks/use-collections";
import {
  updateCollection,
  deleteCollection,
} from "@/features/shared/db/collections-repository";

export default function ListeScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const {
    collections,
    unorganizedCount,
    refresh: refreshCollections,
  } = useCollections();

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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24, paddingBottom: 60, gap: 16 }}
      >
        {/* Unorganized words banner */}
        {unorganizedCount > 0 && collections.length > 0 && (
          <Pressable
            onPress={() => router.push("/organize")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: colors.accentLight,
              borderRadius: 14,
              borderCurve: "continuous",
              padding: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <SymbolView
              name="sparkles"
              size={20}
              tintColor={colors.accent}
              resizeMode="scaleAspectFit"
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[textStyles.heading, { fontSize: 14 }]}>
                {unorganizedCount}{" "}
                {unorganizedCount === 1
                  ? "parola non organizzata"
                  : "parole non organizzate"}
              </Text>
              <Text
                style={{
                  fontFamily: textStyles.bodyLight.fontFamily,
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                Organizza con AI
              </Text>
            </View>
            <SymbolView
              name="chevron.right"
              size={12}
              tintColor={colors.textMuted}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        )}

        <CollectionGrid
          collections={collections}
          onCreateNew={() => router.push("/create-collection")}
          onOrganizeAI={() => router.push("/organize")}
          onReview={(id) =>
            router.push({
              pathname: "/(review)/session",
              params: { collectionId: String(id) },
            })
          }
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </ScrollView>

      <Stack.Screen.Title large>Liste</Stack.Screen.Title>

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="sparkles"
          onPress={() => router.push("/organize")}
        />
        <Stack.Toolbar.Button
          icon="plus"
          onPress={() => router.push("/create-collection")}
        />
      </Stack.Toolbar>
    </>
  );
}
