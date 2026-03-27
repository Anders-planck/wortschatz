import { Stack, useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { useThemeColors } from "@/features/shared/theme/theme-context";
import { useWordDetail } from "@/features/dictionary/hooks/use-word-detail";
import { WordCard } from "@/features/dictionary/components/word-card";
import { WordLoading } from "@/features/dictionary/components/word-loading";
import { WordError } from "@/features/dictionary/components/word-error";

export default function WordDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { term, word, isLoading, isAILoading, error, handleWordPress } =
    useWordDetail();

  const isNoun = word?.type === "noun";

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

      <Stack.Screen options={{ title: term ?? "" }} />
      <Stack.Toolbar placement="right">
        {word && (
          <Stack.Toolbar.Button
            icon="folder.badge.plus"
            onPress={() =>
              router.push({
                pathname: "/add-to-collection",
                params: { wordId: String(word.id) },
              })
            }
          />
        )}
        {isNoun && (
          <Stack.Toolbar.Button
            icon="tablecells"
            onPress={() =>
              router.push({
                pathname: "/declension/[term]",
                params: { term: word.term },
              })
            }
          />
        )}
      </Stack.Toolbar>
    </>
  );
}
