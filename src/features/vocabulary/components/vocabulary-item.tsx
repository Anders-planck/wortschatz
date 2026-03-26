import React from "react";
import { Pressable, Share, Text, View } from "react-native";
import { Link } from "expo-router";
import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { getAudio } from "@/features/shared/services/tts-service";

import { getSpeechRate } from "@/features/settings/services/settings-repository";
import Animated, { FadeInUp, FadeOutLeft } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { getWordTypeColor } from "@/features/shared/utils/word-colors";
import { deleteWord } from "@/features/shared/db/words-repository";
import { formatWordForSharing } from "@/features/shared/utils/format-word";

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
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 30).duration(300)}
      exiting={FadeOutLeft.duration(200)}
    >
      <Link href={`/word/${encodeURIComponent(word.term)}`} asChild>
        <Link.Trigger>
          <Pressable
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
        </Link.Trigger>

        <Link.Preview />

        <Link.Menu>
          <Link.MenuAction
            title="Pronuncia"
            icon="speaker.wave.2"
            onPress={async () => {
              const rate = await getSpeechRate();
              const path = await getAudio(word.term, rate);
              if (path) {
                const player = createAudioPlayer({ uri: path });
                player.play();
              } else {
                Speech.speak(word.term, { language: "de-DE", rate });
              }
            }}
          />
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              Share.share({ message: formatWordForSharing(word) });
            }}
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            destructive
            onPress={async () => {
              await deleteWord(word.term);
              onDeleted?.();
            }}
          />
        </Link.Menu>
      </Link>
    </Animated.View>
  );
});
