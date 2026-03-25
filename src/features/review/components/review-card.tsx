import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { Divider } from "@/features/shared/components/divider";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

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
          style={{
            fontFamily: fonts.display,
            fontSize: 42,
            fontWeight: "700",
            color: colors.textPrimary,
            letterSpacing: -1.5,
            textAlign: "center",
          }}
        >
          {word.term}
        </Text>

        {word.type === "noun" && (
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: "500",
              color: colors.textHint,
            }}
          >
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
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                color: colors.textGhost,
              }}
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

      <Text
        selectable
        style={{
          fontFamily: fonts.display,
          fontSize: 34,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: -1,
          textAlign: "center",
        }}
      >
        {word.term}
      </Text>

      {word.type === "noun" && (
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: "500",
            color: colors.textHint,
          }}
        >
          {word.gender}
          {word.plural ? `  ·  pl. ${word.plural}` : ""}
        </Text>
      )}

      <View style={{ width: "100%", paddingHorizontal: 16 }}>
        <Divider />
      </View>

      <Text
        selectable
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          fontWeight: "400",
          color: colors.textSecondary,
          textAlign: "center",
        }}
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
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: "400",
                color: colors.textPrimary,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {word.examples[0].sentence}
            </Text>
            <Text
              selectable
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                fontWeight: "300",
                color: colors.textTertiary,
                textAlign: "center",
              }}
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
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            {word.usageContext}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
