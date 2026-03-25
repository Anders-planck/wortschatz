import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles, fonts } from "@/features/shared/theme/typography";
import { useWordLookup } from "@/features/dictionary/hooks/use-word-lookup";
import { WordCard } from "@/features/dictionary/components/word-card";

export default function WordDetailScreen() {
  const { term } = useLocalSearchParams<{ term: string }>();
  const router = useRouter();
  const { word, isLoading, isAILoading, error, lookup } = useWordLookup();

  useEffect(() => {
    if (term) {
      lookup(term);
    }
  }, [term, lookup]);

  const handleWordPress = useCallback(
    (pressedWord: string, _meaning: string) => {
      router.push(`/word/${encodeURIComponent(pressedWord)}`);
    },
    [router],
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        {isLoading && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
          >
            <ActivityIndicator size="small" color={colors.textHint} />
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 11,
                color: colors.textHint,
                marginTop: 10,
              }}
            >
              Looking up {term}...
            </Text>
          </View>
        )}

        {error && (
          <View
            style={{
              backgroundColor: colors.cream,
              borderRadius: 6,
              borderCurve: "continuous",
              padding: 16,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text selectable style={[textStyles.body, { textAlign: "center" }]}>
              {error}
            </Text>
          </View>
        )}

        {word && (
          <WordCard
            word={word}
            isAILoading={isAILoading}
            onWordPress={handleWordPress}
          />
        )}
      </ScrollView>

      <Stack.Screen.Title>{term ?? ""}</Stack.Screen.Title>
    </>
  );
}
