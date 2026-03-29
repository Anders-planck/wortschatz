import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { ScenarioCard } from "@/features/chat/components/scenario-card";
import {
  getAllScenarios,
  deleteScenario,
  deleteScenarios,
} from "@/features/chat/services/scenario-repository";
import type { Scenario } from "@/features/chat/types";
import { Toast } from "@/features/shared/components/toast";

export default function ChatScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<
    (Scenario & { isDefault: boolean })[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getAllScenarios().then(setScenarios);
    }, []),
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleDeleteSingle = (id: string, title: string) => {
    Alert.alert(
      "Elimina categoria",
      `Vuoi eliminare "${title}" e tutte le sue conversazioni?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteScenario(id);
            setScenarios((prev) => prev.filter((s) => s.id !== id));
            showToast("Categoria eliminata");
          },
        },
      ],
    );
  };

  const toggleSelect = (id: string) => {
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
      "Elimina categorie",
      `Vuoi eliminare ${count} ${count === 1 ? "categoria" : "categorie"} e tutte le conversazioni associate?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteScenarios([...selectedIds]);
            setScenarios((prev) => prev.filter((s) => !selectedIds.has(s.id)));
            setSelectedIds(new Set());
            setIsSelecting(false);
            showToast(
              `${count} ${count === 1 ? "categoria eliminata" : "categorie eliminate"}`,
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
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
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

        {/* All scenarios */}
        {scenarios.map((scenario, index) => (
          <Animated.View
            key={scenario.id}
            entering={FadeInUp.delay(index * 50).duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            {isSelecting ? (
              <Pressable
                onPress={() => toggleSelect(scenario.id)}
                style={({ pressed }) => ({
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  borderCurve: "continuous",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: pressed ? 0.9 : 1,
                  borderWidth: selectedIds.has(scenario.id) ? 2 : 0,
                  borderColor: colors.accent,
                })}
              >
                <SymbolView
                  name={
                    selectedIds.has(scenario.id)
                      ? "checkmark.circle.fill"
                      : "circle"
                  }
                  size={22}
                  tintColor={
                    selectedIds.has(scenario.id)
                      ? colors.accent
                      : colors.textGhost
                  }
                  resizeMode="scaleAspectFit"
                />
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    backgroundColor: colors.accentLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SymbolView
                    name={scenario.icon as import("expo-symbols").SFSymbol}
                    size={20}
                    tintColor={colors.accent}
                    resizeMode="scaleAspectFit"
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[textStyles.heading, { fontSize: 15 }]}>
                    {scenario.title}
                  </Text>
                  <Text style={[textStyles.bodyLight, { fontSize: 13 }]}>
                    {scenario.description}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.accentLight,
                    borderRadius: 8,
                    borderCurve: "continuous",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: textStyles.mono.fontFamily,
                      fontSize: 10,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    {scenario.level}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <ScenarioCard
                scenario={scenario}
                featured={index === 0}
                onPress={() =>
                  router.push({
                    pathname: "/(review)/chat-history",
                    params: { scenarioId: scenario.id },
                  })
                }
                onLongPress={() =>
                  handleDeleteSingle(scenario.id, scenario.title)
                }
              />
            )}
          </Animated.View>
        ))}
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        icon="trash.circle.fill"
      />
      <Stack.Screen options={{ title: "Conversazione" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={cancelSelection} hidden={!isSelecting}>
          Fine
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          icon="checkmark.circle"
          onPress={() => setIsSelecting(true)}
          hidden={isSelecting}
        />
        <Stack.Toolbar.Button
          icon="plus.circle.fill"
          onPress={() => router.push("/(review)/create-scenario")}
          hidden={isSelecting}
        />
      </Stack.Toolbar>
    </>
  );
}
