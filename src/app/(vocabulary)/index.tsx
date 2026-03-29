import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { CollectionGrid } from "@/features/collections/components/collection-grid";
import { useCollections } from "@/features/collections/hooks/use-collections";
import {
  updateCollection,
  deleteCollection,
  deleteCollections,
} from "@/features/shared/db/collections-repository";
import { Toast } from "@/features/shared/components/toast";

export default function ListeScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const {
    collections,
    unorganizedCount,
    refresh: refreshCollections,
  } = useCollections();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

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
        `Vuoi eliminare "${col.name}" e tutte le sue associazioni?`,
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Elimina",
            style: "destructive",
            onPress: async () => {
              await deleteCollection(id);
              refreshCollections();
              showToast("Lista eliminata");
            },
          },
        ],
      );
    },
    [collections, refreshCollections],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    Alert.alert(
      "Elimina liste",
      `Vuoi eliminare ${count} ${count === 1 ? "lista" : "liste"} e tutte le associazioni?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteCollections([...selectedIds]);
            setSelectedIds(new Set());
            setIsSelecting(false);
            refreshCollections();
            showToast(
              `${count} ${count === 1 ? "lista eliminata" : "liste eliminate"}`,
            );
          },
        },
      ],
    );
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24, paddingBottom: 60, gap: 16 }}
      >
        {/* Batch delete bar */}
        {isSelecting && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={cancelSelection}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={[
                  textStyles.heading,
                  { fontSize: 14, color: colors.textSecondary },
                ]}
              >
                Annulla
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor:
                  selectedIds.size > 0 ? colors.danger : colors.borderLight,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <SymbolView
                name="trash"
                size={14}
                tintColor={
                  selectedIds.size > 0 ? colors.onAccent : colors.textMuted
                }
                resizeMode="scaleAspectFit"
              />
              <Text
                style={[
                  textStyles.heading,
                  {
                    fontSize: 14,
                    color:
                      selectedIds.size > 0 ? colors.onAccent : colors.textMuted,
                  },
                ]}
              >
                Elimina ({selectedIds.size})
              </Text>
            </Pressable>
          </View>
        )}

        {/* Unorganized words banner */}
        {!isSelecting && unorganizedCount > 0 && collections.length > 0 && (
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

        {/* Selection mode: checkboxes */}
        {isSelecting ? (
          <View style={{ gap: 10 }}>
            {collections.map((collection) => (
              <Animated.View
                key={collection.id}
                entering={FadeInUp.duration(200)}
                exiting={FadeOutLeft.duration(200)}
              >
                <Pressable
                  onPress={() => toggleSelect(collection.id)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    borderCurve: "continuous",
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    opacity: pressed ? 0.9 : 1,
                    borderWidth: selectedIds.has(collection.id) ? 2 : 0,
                    borderColor: colors.accent,
                  })}
                >
                  <SymbolView
                    name={
                      selectedIds.has(collection.id)
                        ? "checkmark.circle.fill"
                        : "circle"
                    }
                    size={22}
                    tintColor={
                      selectedIds.has(collection.id)
                        ? colors.accent
                        : colors.textGhost
                    }
                    resizeMode="scaleAspectFit"
                  />
                  <SymbolView
                    name={collection.icon as import("expo-symbols").SFSymbol}
                    size={20}
                    tintColor={colors.accent}
                    resizeMode="scaleAspectFit"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[textStyles.heading, { fontSize: 15 }]}>
                      {collection.name}
                    </Text>
                    <Text
                      style={[
                        textStyles.mono,
                        { fontSize: 11, color: colors.textHint },
                      ]}
                    >
                      {collection.wordCount}{" "}
                      {collection.wordCount === 1 ? "parola" : "parole"}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : (
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
        )}
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        icon="trash.circle.fill"
      />

      <Stack.Screen.Title large>Liste</Stack.Screen.Title>

      <Stack.Toolbar placement="right">
        {isSelecting ? (
          <Stack.Toolbar.Button icon="xmark" onPress={cancelSelection} />
        ) : (
          <>
            {collections.length > 1 && (
              <Stack.Toolbar.Button
                icon="checkmark.circle"
                onPress={() => setIsSelecting(true)}
              />
            )}
            <Stack.Toolbar.Button
              icon="sparkles"
              onPress={() => router.push("/organize")}
            />
            <Stack.Toolbar.Button
              icon="plus"
              onPress={() => router.push("/create-collection")}
            />
          </>
        )}
      </Stack.Toolbar>
    </>
  );
}
