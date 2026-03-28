import type { ReactNode } from "react";
import { Share, View, type StyleProp, type ViewStyle } from "react-native";
import { Link } from "expo-router";
import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";

import type { Word } from "@/features/dictionary/types";
import { getAudio } from "@/features/shared/services/tts-service";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { deleteWord } from "@/features/shared/db/words-repository";
import { formatWordForSharing } from "@/features/shared/utils/format-word";

interface WordListItemProps {
  word: Word;
  onDeleted?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function WordListItem({
  word,
  onDeleted,
  style,
  children,
}: WordListItemProps) {
  return (
    <Link href={`/word/${encodeURIComponent(word.term)}`}>
      <Link.Trigger>
        <View style={style}>{children}</View>
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
          title="Condividi"
          icon="square.and.arrow.up"
          onPress={() => {
            Share.share({ message: formatWordForSharing(word) });
          }}
        />
        <Link.MenuAction
          title="Elimina"
          icon="trash"
          destructive
          onPress={async () => {
            await deleteWord(word.term);
            onDeleted?.();
          }}
        />
      </Link.Menu>
    </Link>
  );
}
