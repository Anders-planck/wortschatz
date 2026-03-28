import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SfIconPicker } from "@/features/shared/components/sf-icon-picker";
import { SCENARIO_ICONS, SCENARIO_LEVELS } from "@/features/chat/types";
import { createScenario } from "@/features/chat/services/scenario-repository";

export default function CreateScenarioScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("text.bubble");
  const [level, setLevel] = useState("Adaptive");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && description.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await createScenario({
        title: title.trim(),
        description: description.trim(),
        icon,
        level,
      });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 24 }}
        style={{ backgroundColor: colors.bg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: colors.accentLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView
              name={icon as import("expo-symbols").SFSymbol}
              size={28}
              tintColor={colors.accent}
              resizeMode="scaleAspectFit"
            />
          </View>
          <Text
            style={[
              textStyles.heading,
              {
                fontSize: 17,
                color: title.trim() ? colors.textPrimary : colors.textGhost,
              },
            ]}
          >
            {title.trim() || "Nome categoria"}
          </Text>
          {description.trim() ? (
            <Text
              style={[
                textStyles.bodyLight,
                { color: colors.textMuted, textAlign: "center" },
              ]}
            >
              {description.trim()}
            </Text>
          ) : null}
          <View
            style={{
              backgroundColor: colors.accentLight,
              borderRadius: 8,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 11,
                fontWeight: "600",
                color: colors.accent,
              }}
            >
              {level}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={{ gap: 8 }}>
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Titolo
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="es. Al ristorante"
            placeholderTextColor={colors.textGhost}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 14,
              fontFamily: textStyles.body.fontFamily,
              fontSize: 15,
              color: colors.textPrimary,
            }}
          />
        </View>

        {/* Description */}
        <View style={{ gap: 8 }}>
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Descrizione
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="es. Ordinare, menù, conto"
            placeholderTextColor={colors.textGhost}
            multiline
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 14,
              fontFamily: textStyles.body.fontFamily,
              fontSize: 15,
              color: colors.textPrimary,
              minHeight: 60,
            }}
          />
        </View>

        {/* Level */}
        <View style={{ gap: 8 }}>
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Livello
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SCENARIO_LEVELS.map((l) => {
              const isSelected = l === level;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLevel(l)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    backgroundColor: isSelected
                      ? colors.accentLight
                      : colors.card,
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: isSelected ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: textStyles.mono.fontFamily,
                      fontSize: 13,
                      fontWeight: "600",
                      color: isSelected ? colors.accent : colors.textSecondary,
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Icon picker */}
        <View style={{ gap: 8 }}>
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Icona
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderCurve: "continuous",
              padding: 14,
            }}
          >
            <SfIconPicker
              icons={SCENARIO_ICONS}
              selected={icon}
              onSelect={setIcon}
            />
          </View>
        </View>
      </ScrollView>

      <Stack.Screen
        options={{
          title: "Nuova categoria",
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={!canSave || saving}>
              <Text
                style={{
                  fontFamily: textStyles.heading.fontFamily,
                  fontSize: 16,
                  fontWeight: "600",
                  color: canSave ? colors.accent : colors.textGhost,
                }}
              >
                {saving ? "Salvo..." : "Salva"}
              </Text>
            </Pressable>
          ),
        }}
      />
    </>
  );
}
