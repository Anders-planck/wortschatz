import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { Word } from "@/features/dictionary/types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { Divider } from "@/features/shared/components/divider";
import { SectionTitle } from "@/features/shared/components/section-title";
import { WordListItem } from "@/features/shared/components/word-link-menu";
import { getGenderColors } from "@/features/shared/utils/word-colors";

interface RecentSearchesProps {
  words: Word[];
  onDeleted?: () => void;
}

export function RecentSearches({ words, onDeleted }: RecentSearchesProps) {
  const { colors, textStyles } = useAppTheme();
  const GENDER_COLORS = getGenderColors(colors);

  if (words.length === 0) {
    return (
      <View style={{ paddingTop: 8 }}>
        <Text selectable style={textStyles.bodyLight}>
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
          <WordListItem
            word={word}
            onDeleted={onDeleted}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 2,
            }}
          >
            {word.gender && GENDER_COLORS[word.gender] ? (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: GENDER_COLORS[word.gender],
                }}
              />
            ) : (
              <View style={{ width: 7 }} />
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[textStyles.heading, { fontSize: 15, letterSpacing: 0 }]}
              >
                {word.term}
              </Text>
              {word.translations.length > 0 && (
                <Text
                  selectable
                  style={[
                    textStyles.bodyLight,
                    { fontSize: 12, color: colors.textMuted },
                  ]}
                >
                  {word.translations[0]}
                </Text>
              )}
            </View>
          </WordListItem>
          {index < words.length - 1 && <Divider />}
        </Animated.View>
      ))}
    </View>
  );
}
