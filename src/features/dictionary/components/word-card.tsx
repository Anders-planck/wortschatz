import { View, Text, ActivityIndicator } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { Divider } from "@/features/shared/components/divider";
import { SectionTitle } from "@/features/shared/components/section-title";
import { GenderStrip } from "./gender-strip";
import { NounSections } from "./noun-sections";
import { VerbSections } from "./verb-sections";
import { PrepositionSections } from "./preposition-sections";
import { ExampleSentence } from "./example-sentence";
import { ContextBox } from "./context-box";
import type { Word } from "@/features/dictionary/types";

interface WordCardProps {
  word: Word;
  isAILoading: boolean;
  onWordPress?: (word: string, meaning: string) => void;
}

export function WordCard({ word, isAILoading, onWordPress }: WordCardProps) {
  const isNoun = word.type === "noun";
  const isVerb = word.type === "verb";
  const isPreposition = word.type === "preposition";

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        borderCurve: "continuous",
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {isNoun && word.gender && <GenderStrip gender={word.gender} />}

      <Text selectable style={textStyles.word}>
        {word.term}
      </Text>

      <Text style={[textStyles.mono, { marginTop: 4 }]}>
        {word.type}
        {isNoun && word.gender ? ` · ${word.gender}` : ""}
        {isNoun && word.plural ? ` · pl. ${word.plural}` : ""}
      </Text>

      <Divider />

      <Text selectable style={textStyles.body}>
        {word.translations.join(", ")}
      </Text>

      <Divider />

      {isNoun && <NounSections word={word} />}
      {isVerb && <VerbSections word={word} />}
      {isPreposition && (
        <PrepositionSections word={word} onWordPress={onWordPress} />
      )}

      {isAILoading && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <ActivityIndicator size="small" color={colors.textHint} />
          <Text style={textStyles.mono}>Loading context...</Text>
        </Animated.View>
      )}

      {word.examples && word.examples.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={{ marginTop: 16, gap: 12 }}
        >
          <SectionTitle>Examples</SectionTitle>
          {word.examples.map((example, index) => (
            <Animated.View
              key={`example-${index}`}
              entering={FadeInUp.delay(index * 50).duration(250)}
            >
              <ExampleSentence example={example} onWordPress={onWordPress} />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {word.usageContext && (
        <Animated.View
          entering={FadeInUp.duration(300).delay(100)}
          style={{ marginTop: 16, gap: 8 }}
        >
          <SectionTitle>Context</SectionTitle>
          <ContextBox text={word.usageContext} />
        </Animated.View>
      )}
    </View>
  );
}
