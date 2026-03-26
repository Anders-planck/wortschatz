import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { getWordTypeColor } from "@/features/shared/utils/word-colors";
import { deleteWord } from "@/features/shared/db/words-repository";

interface VocabularyItemProps {
  word: Word;
  index: number;
  onDeleted?: () => void;
}

export function VocabularyItem({
  word,
  index,
  onDeleted,
}: VocabularyItemProps) {
  const router = useRouter();

  const handleLongPress = () => {
    Alert.alert(
      `Delete "${word.term}"?`,
      "This will remove the word from your vocabulary.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteWord(word.term);
            onDeleted?.();
          },
        },
      ],
    );
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 30).duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <Pressable
        onPress={() => router.push(`/word/${encodeURIComponent(word.term)}`)}
        onLongPress={handleLongPress}
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
            backgroundColor: getWordTypeColor(word),
          }}
        />

        <Text
          selectable
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
      </Pressable>
    </Animated.View>
  );
}
