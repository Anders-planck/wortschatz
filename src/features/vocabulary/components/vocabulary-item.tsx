import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
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

interface VocabularyItemProps {
  word: Word;
  index: number;
}

export function VocabularyItem({ word, index }: VocabularyItemProps) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(300)}>
      <Pressable
        onPress={() => router.push(`/word/${encodeURIComponent(word.term)}`)}
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
            backgroundColor: getTypeColor(word),
          }}
        />

        <Text
          selectable
          style={{
            flex: 1,
            fontFamily: fonts.display,
            fontSize: 14,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
        >
          {word.term}
        </Text>

        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: "300",
            color: colors.textHint,
          }}
        >
          {word.translations[0] ?? ""}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
