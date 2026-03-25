import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";
import { Divider } from "@/features/shared/components/divider";
import { SectionTitle } from "@/features/shared/components/section-title";

const genderColor: Record<string, string> = {
  der: colors.der,
  die: colors.die,
  das: colors.das,
};

interface RecentSearchesProps {
  words: Word[];
}

export function RecentSearches({ words }: RecentSearchesProps) {
  if (words.length === 0) {
    return (
      <View style={{ paddingTop: 8 }}>
        <Text
          selectable
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: "300",
            color: colors.textHint,
          }}
        >
          Nessuna ricerca recente. Inizia a cercare una parola in tedesco.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <SectionTitle>Ricerche recenti</SectionTitle>
      {words.map((word, index) => (
        <Animated.View
          key={word.id ?? word.term}
          entering={FadeInUp.delay(index * 40).duration(200)}
        >
          <Link href={`/word/${encodeURIComponent(word.term)}`} asChild>
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 2,
              })}
            >
              {word.gender && genderColor[word.gender] ? (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: genderColor[word.gender],
                  }}
                />
              ) : (
                <View style={{ width: 7 }} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  {word.term}
                </Text>
                {word.translations.length > 0 && (
                  <Text
                    selectable
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      fontWeight: "300",
                      color: colors.textMuted,
                    }}
                  >
                    {word.translations[0]}
                  </Text>
                )}
              </View>
            </Pressable>
          </Link>
          {index < words.length - 1 && <Divider />}
        </Animated.View>
      ))}
    </View>
  );
}
