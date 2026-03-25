import { View } from "react-native";
import type { Word } from "@/features/dictionary/types";
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
                ? getWordTypeColor(word)
                : isCurrent
                  ? "rgba(44, 44, 44, 0.2)"
                  : "rgba(44, 44, 44, 0.08)",
            }}
          />
        );
      })}
    </View>
  );
}
