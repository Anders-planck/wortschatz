import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import type { Example } from "@/features/dictionary/types";

interface ExampleSentenceProps {
  example: Example;
  onWordPress?: (word: string, meaning: string) => void;
}

export function ExampleSentence({
  example,
  onWordPress,
}: ExampleSentenceProps) {
  const { colors, textStyles } = useAppTheme();
  const clickableMap = useMemo(
    () => new Map(example.words.map((w) => [w.word.toLowerCase(), w.meaning])),
    [example],
  );
  const tokens = useMemo(
    () => example.sentence.split(/(\s+)/),
    [example.sentence],
  );

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {tokens.map((token, i) => {
              const stripped = token.replace(/[.,!?;:"""''()]/g, "");
              const meaning = clickableMap.get(stripped.toLowerCase());

              if (meaning && onWordPress) {
                return (
                  <Pressable
                    key={`${token}-${i}`}
                    onPress={() => onWordPress(stripped, meaning)}
                  >
                    <Text
                      style={[
                        textStyles.body,
                        {
                          fontSize: 14,
                          color: colors.textPrimary,
                          backgroundColor: `${colors.accent}20`,
                          borderRadius: 3,
                          overflow: "hidden",
                        },
                      ]}
                    >
                      {token}
                    </Text>
                  </Pressable>
                );
              }

              return (
                <Text
                  key={`${token}-${i}`}
                  style={[
                    textStyles.body,
                    { fontSize: 14, color: colors.textPrimary },
                  ]}
                >
                  {token}
                </Text>
              );
            })}
          </Text>
        </View>
        <View style={{ paddingTop: 2 }}>
          <SpeakerButton text={example.sentence} size="sm" />
        </View>
      </View>
      <Text
        selectable
        style={[
          textStyles.bodyLight,
          { fontSize: 12, color: colors.textHint, fontStyle: "italic" },
        ]}
      >
        {example.translation}
      </Text>
    </View>
  );
}
