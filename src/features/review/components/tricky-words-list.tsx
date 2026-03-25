import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Word } from "@/features/dictionary/types";
import { SectionTitle } from "@/features/shared/components/section-title";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { getWordTypeColor } from "@/features/shared/utils/word-colors";

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
          const typeColor = getWordTypeColor(word);
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
                  style={[
                    textStyles.heading,
                    { fontSize: 13, letterSpacing: 0 },
                  ]}
                >
                  {word.term}
                </Text>
                <Text style={[textStyles.mono, { fontSize: 9 }]}>
                  {getTrickyReason(word)}
                </Text>
              </View>

              <Text
                style={[textStyles.mono, { fontSize: 10, color: typeColor }]}
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
