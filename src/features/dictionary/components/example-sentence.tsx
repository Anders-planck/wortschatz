import { View, Text, Pressable } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import type { Example } from "@/features/dictionary/types";

interface ExampleSentenceProps {
  example: Example;
  onWordPress?: (word: string, meaning: string) => void;
}

export function ExampleSentence({
  example,
  onWordPress,
}: ExampleSentenceProps) {
  const clickableMap = new Map(
    example.words.map((w) => [w.word.toLowerCase(), w.meaning]),
  );

  // Split sentence into words while preserving punctuation and spaces
  const tokens = example.sentence.split(/(\s+)/);

  return (
    <View style={{ gap: 6 }}>
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
                      backgroundColor: "rgba(196,169,106,0.18)",
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
