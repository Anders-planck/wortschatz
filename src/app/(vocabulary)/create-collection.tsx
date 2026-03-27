import { useState, useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SfIconPicker } from "@/features/collections/components/sf-icon-picker";
import { ColorPicker } from "@/features/collections/components/color-picker";
import {
  createCollection,
  addWordToCollection,
} from "@/features/shared/db/collections-repository";
import { getAllWords } from "@/features/shared/db/words-repository";
import { autoPopulateCollection } from "@/features/collections/services/ai-collections-service";

export default function CreateCollectionScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder.fill");
  const [color, setColor] = useState("#D4A44A");
  const [aiPopulate, setAiPopulate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Nome richiesto", "Inserisci un nome per la lista.");
      return;
    }

    setIsCreating(true);
    try {
      const collectionId = await createCollection(
        name.trim(),
        icon,
        color,
        aiPopulate,
      );

      if (aiPopulate) {
        try {
          const allWords = await getAllWords();
          const matchedTerms = await autoPopulateCollection(
            name.trim(),
            allWords,
          );
          for (const term of matchedTerms) {
            const word = allWords.find(
              (w) => w.term.toLowerCase() === term.toLowerCase(),
            );
            if (word?.id != null) {
              await addWordToCollection(collectionId, word.id);
            }
          }
        } catch {
          // AI populate failed silently — collection was still created
        }
      }

      router.back();
    } catch {
      Alert.alert("Errore", "Impossibile creare la lista.");
    } finally {
      setIsCreating(false);
    }
  }, [name, icon, color, aiPopulate, router]);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 40 }}
          style={{ backgroundColor: colors.bg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={{ gap: 8 }}>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 13, color: colors.textSecondary },
              ]}
            >
              Nome
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="es. Essen & Trinken"
              placeholderTextColor={colors.textHint}
              autoFocus
              style={[
                textStyles.heading,
                {
                  fontSize: 16,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  padding: 14,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          {/* Icon */}
          <View style={{ gap: 8 }}>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 13, color: colors.textSecondary },
              ]}
            >
              Icona
            </Text>
            <SfIconPicker selected={icon} onSelect={setIcon} />
          </View>

          {/* Color */}
          <View style={{ gap: 8 }}>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 13, color: colors.textSecondary },
              ]}
            >
              Colore
            </Text>
            <ColorPicker selected={color} onSelect={setColor} />
          </View>

          {/* AI Populate toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.card,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 14,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[textStyles.heading, { fontSize: 14 }]}>
                Popola con AI
              </Text>
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 12, color: colors.textMuted },
                ]}
              >
                Aggiunge automaticamente le parole che corrispondono al tema
              </Text>
            </View>
            <Switch
              value={aiPopulate}
              onValueChange={setAiPopulate}
              trackColor={{ true: colors.accent }}
            />
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => router.back()}
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
              onPress={handleCreate}
              disabled={isCreating}
              style={{
                flex: 1,
                backgroundColor: colors.accent,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 14,
                alignItems: "center",
                opacity: isCreating ? 0.6 : 1,
              }}
            >
              <Text
                style={[textStyles.heading, { fontSize: 14, color: "#FFFFFF" }]}
              >
                {isCreating ? "Creazione..." : "Crea"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Stack.Screen options={{ title: "Nuova lista" }} />
    </>
  );
}
