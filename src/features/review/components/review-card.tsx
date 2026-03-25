import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { Divider } from "@/features/shared/components/divider";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

function getGenderColor(gender: string | null): string {
  if (gender === "der") return colors.der;
  if (gender === "die") return colors.die;
  if (gender === "das") return colors.das;
  return colors.textHint;
}

interface ReviewCardProps {
  word: Word;
  isRevealed: boolean;
  onReveal: () => void;
}

export function ReviewCard({ word, isRevealed, onReveal }: ReviewCardProps) {
  if (!isRevealed) {
    return (
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          gap: 12,
        }}
      >
        {word.type === "noun" && word.gender && (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: getGenderColor(word.gender),
            }}
          />
        )}

        <Text
          selectable
          style={[
            textStyles.word,
            { fontSize: 42, letterSpacing: -1.5, textAlign: "center" },
          ]}
        >
          {word.term}
        </Text>

        {word.type === "noun" && (
          <Text style={textStyles.mono}>
            {word.gender}
            {word.plural ? `  ·  pl. ${word.plural}` : ""}
          </Text>
        )}

        <Pressable onPress={onReveal} style={{ marginTop: 24 }}>
          <View
            style={{
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: colors.border,
              borderRadius: 6,
              borderCurve: "continuous",
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text
              style={[
                textStyles.mono,
                { fontSize: 10, color: colors.textGhost },
              ]}
            >
              tap to reveal
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 8,
      }}
    >
      {word.type === "noun" && word.gender && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: getGenderColor(word.gender),
          }}
        />
      )}

      <Text selectable style={[textStyles.word, { textAlign: "center" }]}>
        {word.term}
      </Text>

      {word.type === "noun" && (
        <Text style={textStyles.mono}>
          {word.gender}
          {word.plural ? `  ·  pl. ${word.plural}` : ""}
        </Text>
      )}

      <View style={{ width: "100%", paddingHorizontal: 16 }}>
        <Divider />
      </View>

      <Text
        selectable
        style={[textStyles.body, { fontSize: 16, textAlign: "center" }]}
      >
        {word.translations.join(", ")}
      </Text>

      {word.examples && word.examples.length > 0 && (
        <>
          <View style={{ width: "100%", paddingHorizontal: 16 }}>
            <Divider />
          </View>
          <View style={{ gap: 4, alignItems: "center" }}>
            <Text
              selectable
              style={[
                textStyles.body,
                {
                  fontSize: 13,
                  color: colors.textPrimary,
                  textAlign: "center",
                  fontStyle: "italic",
                },
              ]}
            >
              {word.examples[0].sentence}
            </Text>
            <Text
              selectable
              style={[
                textStyles.bodyLight,
                { fontSize: 12, textAlign: "center" },
              ]}
            >
              {word.examples[0].translation}
            </Text>
          </View>
        </>
      )}

      {word.usageContext && (
        <View
          style={{
            marginTop: 8,
            backgroundColor: colors.cream,
            borderRadius: 6,
            borderCurve: "continuous",
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text
            selectable
            style={[
              textStyles.mono,
              { fontSize: 10, color: colors.textMuted, textAlign: "center" },
            ]}
          >
            {word.usageContext}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
