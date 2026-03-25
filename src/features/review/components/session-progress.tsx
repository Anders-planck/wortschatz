import { View } from "react-native";
import type { Word } from "@/features/dictionary/types";
import { colors } from "@/features/shared/theme/colors";

function getWordColor(word: Word): string {
  if (word.type === "noun") {
    if (word.gender === "der") return colors.der;
    if (word.gender === "die") return colors.die;
    if (word.gender === "das") return colors.das;
    return colors.textHint;
  }
  if (word.type === "verb") return colors.verb;
  if (word.type === "preposition") return colors.prep;
  return colors.textHint;
}

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
                ? getWordColor(word)
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
