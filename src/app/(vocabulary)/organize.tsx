import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import {
  getUnorganizedWords,
  createCollection,
  addWordToCollection,
} from "@/features/shared/db/collections-repository";
import { getAllWords } from "@/features/shared/db/words-repository";
import {
  triageWords,
  type TriageGroup,
} from "@/features/collections/services/ai-collections-service";
import type { Word } from "@/features/dictionary/types";

type Phase = "loading-words" | "triaging" | "done" | "empty" | "error";

export default function OrganizeScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading-words");
  const [groups, setGroups] = useState<TriageGroup[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const unorganized = await getUnorganizedWords();
        if (cancelled) return;

        if (unorganized.length === 0) {
          setPhase("empty");
          return;
        }

        const words = await getAllWords();
        if (cancelled) return;
        setAllWords(words);

        setPhase("triaging");
        const result = await triageWords(unorganized);
        if (cancelled) return;

        setGroups(result);
        setPhase("done");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateGroup = useCallback(
    async (group: TriageGroup, index: number) => {
      setCreatingIndex(index);
      try {
        const collectionId = await createCollection(
          group.name,
          group.icon,
          "#D4A44A",
          true,
        );

        for (const term of group.words) {
          const word = allWords.find(
            (w) => w.term.toLowerCase() === term.toLowerCase(),
          );
          if (word?.id != null) {
            await addWordToCollection(collectionId, word.id);
          }
        }

        setGroups((prev) => prev.filter((_, i) => i !== index));
      } finally {
        setCreatingIndex(null);
      }
    },
    [allWords],
  );

  const handleDismissGroup = useCallback((index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Loading states */}
        {(phase === "loading-words" || phase === "triaging") && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
              gap: 16,
            }}
          >
            <ActivityIndicator size="large" color={colors.accent} />
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 14, color: colors.textSecondary },
              ]}
            >
              {phase === "loading-words"
                ? "Caricamento parole..."
                : "L'AI sta organizzando le tue parole..."}
            </Text>
          </View>
        )}

        {/* Empty state */}
        {phase === "empty" && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
              gap: 16,
            }}
          >
            <Image
              source="sf:checkmark.circle.fill"
              style={{ width: 48, height: 48 }}
              tintColor={colors.accent}
            />
            <Text style={[textStyles.heading, { fontSize: 18 }]}>
              Tutte le parole sono organizzate!
            </Text>
            <Text
              style={[
                textStyles.bodyLight,
                {
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                },
              ]}
            >
              Ogni parola appartiene già a una lista.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginTop: 8,
              }}
            >
              <Text
                style={[textStyles.heading, { fontSize: 14, color: "#FFFFFF" }]}
              >
                Torna indietro
              </Text>
            </Pressable>
          </View>
        )}

        {/* Error state */}
        {phase === "error" && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
              gap: 12,
            }}
          >
            <Text style={[textStyles.heading, { fontSize: 16 }]}>
              Errore nell'organizzazione
            </Text>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 13, color: colors.textSecondary },
              ]}
            >
              Non è stato possibile analizzare le parole. Riprova più tardi.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginTop: 8,
              }}
            >
              <Text style={[textStyles.heading, { fontSize: 14 }]}>Chiudi</Text>
            </Pressable>
          </View>
        )}

        {/* Groups */}
        {phase === "done" && groups.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
              gap: 16,
            }}
          >
            <Image
              source="sf:checkmark.circle.fill"
              style={{ width: 48, height: 48 }}
              tintColor={colors.accent}
            />
            <Text style={[textStyles.heading, { fontSize: 18 }]}>
              Tutto organizzato!
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginTop: 8,
              }}
            >
              <Text
                style={[textStyles.heading, { fontSize: 14, color: "#FFFFFF" }]}
              >
                Torna indietro
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "done" &&
          groups.map((group, index) => (
            <View
              key={group.name}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderCurve: "continuous",
                padding: 16,
                gap: 12,
              }}
            >
              {/* Group header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Image
                  source={`sf:${group.icon}`}
                  style={{ width: 22, height: 22 }}
                  tintColor={colors.accent}
                />
                <Text style={[textStyles.heading, { fontSize: 16, flex: 1 }]}>
                  {group.name}
                </Text>
              </View>

              {/* Reason */}
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 12, color: colors.textSecondary },
                ]}
              >
                {group.reason}
              </Text>

              {/* Word chips */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {group.words.map((word) => (
                  <View
                    key={word}
                    style={{
                      backgroundColor: colors.accentLight,
                      borderRadius: 8,
                      borderCurve: "continuous",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={[
                        textStyles.heading,
                        { fontSize: 13, color: colors.accent },
                      ]}
                    >
                      {word}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <Pressable
                  onPress={() => handleCreateGroup(group, index)}
                  disabled={creatingIndex === index}
                  style={{
                    flex: 1,
                    backgroundColor: colors.accent,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: creatingIndex === index ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={[
                      textStyles.heading,
                      { fontSize: 13, color: "#FFFFFF" },
                    ]}
                  >
                    {creatingIndex === index ? "Creazione..." : "Crea lista"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDismissGroup(index)}
                  style={{
                    backgroundColor: colors.borderLight,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={[
                      textStyles.heading,
                      { fontSize: 13, color: colors.textSecondary },
                    ]}
                  >
                    Ignora
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
      </ScrollView>

      <Stack.Screen options={{ title: "Organizza con AI" }} />
    </>
  );
}
