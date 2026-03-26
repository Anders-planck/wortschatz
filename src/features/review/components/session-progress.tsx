import { View } from "react-native";
import type { Word } from "@/features/dictionary/types";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { getWordTypeColor } from "@/features/shared/utils/word-colors";

interface SessionProgressProps {
  words: Word[];
  currentIndex: number;
  responses: number[];
}

export function SessionProgress({
  words,
  currentIndex,
  responses,
}: SessionProgressProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 20,
        paddingVertical: 12,
      }}
    >
      {words.map((word, i) => {
        const isCompleted = i < responses.length;
        const isCurrent = i === currentIndex;
        return (
          <View
            key={word.term}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: isCompleted
                ? getWordTypeColor(word, colors)
                : isCurrent
                  ? `${colors.textPrimary}33`
                  : `${colors.textPrimary}14`,
            }}
          />
        );
      })}
    </View>
  );
}
