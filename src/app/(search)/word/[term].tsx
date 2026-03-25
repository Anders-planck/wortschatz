import { Stack } from "expo-router";
import { ScrollView } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { useWordDetail } from "@/features/dictionary/hooks/use-word-detail";
import { WordCard } from "@/features/dictionary/components/word-card";
import { WordLoading } from "@/features/dictionary/components/word-loading";
import { WordError } from "@/features/dictionary/components/word-error";

export default function WordDetailScreen() {
  const { term, word, isLoading, isAILoading, error, handleWordPress } =
    useWordDetail();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        {isLoading && <WordLoading term={term ?? ""} />}
        {error && <WordError message={error} />}
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
