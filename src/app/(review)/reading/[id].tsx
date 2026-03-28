import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { getReadingById } from "@/features/immersion/services/readings-repository";
import { getAllWords } from "@/features/shared/db/words-repository";
import { WordPopup } from "@/features/immersion/components/word-popup";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import type { SavedReading } from "@/features/immersion/types";

export default function ReadingDetailScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reading, setReading] = useState<SavedReading | null>(null);
  const [knownTerms, setKnownTerms] = useState<Set<string>>(new Set());
  const [vocabTranslations, setVocabTranslations] = useState<
    Map<string, string>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getReadingById(Number(id)), getAllWords(undefined, 500)])
      .then(([r, words]) => {
        setReading(r);
        setKnownTerms(new Set(words.map((w) => w.term.toLowerCase())));
        const vMap = new Map<string, string>();
        for (const w of words) {
          vMap.set(w.term.toLowerCase(), w.translations.join(", "));
        }
        setVocabTranslations(vMap);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const cleanWord = (w: string) => w.replace(/[.,!?;:"""«»„"()\[\]]/g, "");

  const words = useMemo(() => {
    if (!reading) return [];
    // Split on whitespace, keep each word as token
    return reading.content.split(/\s+/).filter(Boolean);
  }, [reading]);

  const findTranslation = (word: string): string | null => {
    if (!reading) return null;
    const clean = cleanWord(word).toLowerCase();
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    const map = reading.wordTranslations;
    // Try AI-generated map first, then user's vocabulary
    return (
      map[word] ??
      map[cleanWord(word)] ??
      map[clean] ??
      map[capitalized] ??
      vocabTranslations.get(clean) ??
      null
    );
  };

  const isKnown = (word: string): boolean => {
    const clean = cleanWord(word).toLowerCase();
    return knownTerms.has(clean);
  };

  const [tappedWord, setTappedWord] = useState<{
    word: string;
    translation: string | null;
  } | null>(null);

  const handleWordTap = (word: string) => {
    const translation = findTranslation(word);
    const clean = cleanWord(word);
    setTappedWord({
      word: clean,
      translation,
    });
  };

  if (isLoading) {
    return (
      <>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
        <Stack.Screen options={{ title: "" }} />
      </>
    );
  }

  if (!reading) return null;

  const totalWords = words.length;
  const knownCount = words.filter((w) => isKnown(w)).length;

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 100 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Speaker */}
        <View style={{ alignItems: "center" }}>
          <SpeakerButton text={reading.content} size="md" />
        </View>

        {/* Stats bar */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: colors.accentLight,
              borderRadius: 8,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 4,
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
              {reading.level}
            </Text>
          </View>
          <Text
            style={[textStyles.mono, { fontSize: 12, color: colors.textMuted }]}
          >
            {knownCount}/{totalWords} note
          </Text>
        </View>

        {/* Reading text */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {words.map((word, i) => {
            const known = isKnown(word);

            return (
              <Pressable key={i} onPress={() => handleWordTap(word)}>
                <Text
                  style={{
                    fontFamily: textStyles.body.fontFamily,
                    fontSize: 18,
                    lineHeight: 30,
                    color: known ? colors.accent : colors.textPrimary,
                  }}
                >
                  {word}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[
            textStyles.bodyLight,
            {
              fontSize: 12,
              color: colors.textGhost,
              textAlign: "center",
            },
          ]}
        >
          Tocca una parola per la traduzione
        </Text>
      </ScrollView>

      {tappedWord && (
        <WordPopup
          word={tappedWord.word}
          translation={tappedWord.translation}
          isKnown={isKnown(tappedWord.word)}
          onDismiss={() => setTappedWord(null)}
          onLookup={() => {
            setTappedWord(null);
            router.push({
              pathname: "/(search)/word/[term]",
              params: { term: tappedWord.word },
            });
          }}
        />
      )}

      <Stack.Screen options={{ title: reading.title }} />
    </>
  );
}
