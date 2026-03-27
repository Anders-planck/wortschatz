import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { getWordTypeColor } from "@/features/shared/utils/word-colors";
import { WordListItem } from "@/features/shared/components/word-link-menu";

interface VocabularyItemProps {
  word: Word;
  index: number;
  onDeleted?: () => void;
}

export const VocabularyItem = React.memo(function VocabularyItem({
  word,
  index,
  onDeleted,
}: VocabularyItemProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 30).duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <WordListItem
        word={word}
        onDeleted={onDeleted}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 4,
            height: 28,
            borderRadius: 2,
            backgroundColor: getWordTypeColor(word, colors),
          }}
        />

        <Text
          style={[
            textStyles.heading,
            { flex: 1, fontSize: 14, letterSpacing: 0 },
          ]}
        >
          {word.term}
        </Text>

        <Text
          style={[
            textStyles.bodyLight,
            { fontSize: 11, color: colors.textHint },
          ]}
        >
          {word.translations[0] ?? ""}
        </Text>
      </WordListItem>
    </Animated.View>
  );
});
