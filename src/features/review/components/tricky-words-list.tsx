import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Word } from "@/features/dictionary/types";
import { SectionTitle } from "@/features/shared/components/section-title";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

function getTypeColor(word: Word): string {
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

function getTrickyReason(word: Word): string {
  const score = word.reviewScore;
  if (score <= -4) return "missed many times";
  if (score <= -2) return "frequently incorrect";
  if (word.type === "noun" && word.gender) return "gender mix-up";
  return "needs practice";
}

interface TrickyWordsListProps {
  words: Word[];
}

export function TrickyWordsList({ words }: TrickyWordsListProps) {
  const router = useRouter();

  if (words.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Tricky words</SectionTitle>

      <View style={{ gap: 6 }}>
        {words.map((word) => {
          const typeColor = getTypeColor(word);
          return (
            <Pressable
              key={word.term}
              onPress={() =>
                router.push(`/word/${encodeURIComponent(word.term)}`)
              }
              style={({ pressed }) => ({
                backgroundColor: colors.cream,
                borderRadius: 8,
                borderCurve: "continuous",
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 12,
                gap: 10,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 4,
                  height: 24,
                  borderRadius: 2,
                  backgroundColor: typeColor,
                }}
              />

              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  {word.term}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    color: colors.textHint,
                  }}
                >
                  {getTrickyReason(word)}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  fontWeight: "500",
                  color: typeColor,
                }}
              >
                review
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
