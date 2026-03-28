import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import { getWordByTerm } from "@/features/shared/db/words-repository";
import { getGenderColors } from "@/features/shared/utils/word-colors";
import type { Word } from "@/features/dictionary/types";
import {
  CASE_CONFIG,
  buildDeclensionCards,
  type ArticleDeclension,
  type DeclensionForms,
} from "@/features/dictionary/utils/declension-data";

interface DeclensionScreenProps {
  term: string;
}

function ArticleCard({
  data,
  showPlural,
  delay,
}: {
  data: ArticleDeclension;
  showPlural: boolean;
  delay: number;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400).springify()}
      style={{
        flex: 1,
        gap: 2,
        borderRadius: 14,
        borderCurve: "continuous",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          backgroundColor: colors.cream,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
      >
        <Text
          style={{
            fontFamily: textStyles.mono.fontFamily,
            fontSize: 9,
            fontWeight: "700",
            color: colors.textMuted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {data.label}
        </Text>
      </View>

      {data.cases.map((c) => {
        const cfg = CASE_CONFIG.find((cc) => cc.key === c.key);
        if (!cfg) return null;
        const form = showPlural ? c.plural : c.singular;
        const parts = form.split(/\s+/);
        const article = parts[0];
        const noun = parts.slice(1).join(" ");

        return (
          <View
            key={c.key}
            style={{
              backgroundColor: colors[cfg.bgKey],
              paddingVertical: 12,
              paddingHorizontal: 14,
              gap: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 8,
                  fontWeight: "700",
                  color: colors[cfg.textKey],
                  letterSpacing: 1,
                  opacity: 0.7,
                }}
              >
                {cfg.abbr}
              </Text>
              {form !== "—" && <SpeakerButton text={form} size="sm" />}
            </View>

            {form === "—" ? (
              <Text
                style={[
                  textStyles.body,
                  { color: colors.textGhost, fontSize: 15 },
                ]}
              >
                —
              </Text>
            ) : (
              <Text selectable style={{ flexDirection: "row" }}>
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors[cfg.textKey],
                  }}
                >
                  {article}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 18,
                    fontWeight: "400",
                    color: colors.textPrimary,
                  }}
                >
                  {" "}
                  {noun}
                </Text>
              </Text>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
}

export function DeclensionScreen({ term }: DeclensionScreenProps) {
  const { colors, textStyles } = useAppTheme();
  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlural, setShowPlural] = useState(false);

  useEffect(() => {
    if (!term) return;
    setIsLoading(true);
    getWordByTerm(term)
      .then(setWord)
      .finally(() => setIsLoading(false));
  }, [term]);

  const cards = useMemo(() => {
    if (!word?.gender) return null;
    const forms = (word.forms as unknown as DeclensionForms) ?? null;
    return buildDeclensionCards(word.gender, forms, word.term, word.plural);
  }, [word]);

  const genderColor = word?.gender
    ? (getGenderColors(colors)[word.gender] ?? colors.textHint)
    : colors.textHint;

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        style={{ backgroundColor: colors.bg }}
      >
        {word && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={{ gap: 8, alignItems: "center" }}
          >
            <View
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                backgroundColor: genderColor,
              }}
            />

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                selectable
                style={[textStyles.word, { fontSize: 28, textAlign: "center" }]}
              >
                {word.term}
              </Text>
              <SpeakerButton text={word.term} size="md" />
            </View>

            <Text style={textStyles.mono}>
              {word.gender}
              {word.plural ? `  ·  pl. ${word.plural}` : ""}
            </Text>

            {word.plural && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 0,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                {(["Singular", "Plural"] as const).map((label) => {
                  const active =
                    (label === "Singular" && !showPlural) ||
                    (label === "Plural" && showPlural);
                  return (
                    <Text
                      key={label}
                      onPress={() => setShowPlural(label === "Plural")}
                      style={{
                        fontFamily: textStyles.mono.fontFamily,
                        fontSize: 11,
                        fontWeight: active ? "700" : "400",
                        color: active ? colors.accent : colors.textMuted,
                        backgroundColor: active
                          ? colors.accentLight
                          : colors.cream,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                      }}
                    >
                      {label}
                    </Text>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {cards && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ArticleCard
              data={cards.definite}
              showPlural={showPlural}
              delay={100}
            />
            <ArticleCard
              data={cards.indefinite}
              showPlural={showPlural}
              delay={200}
            />
          </View>
        )}

        {cards && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(300)}
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              paddingTop: 4,
            }}
          >
            {CASE_CONFIG.map((cfg) => (
              <View
                key={cfg.key}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    borderCurve: "continuous",
                    backgroundColor: colors[cfg.bgKey],
                  }}
                />
                <Text
                  style={[
                    textStyles.mono,
                    { fontSize: 9, color: colors[cfg.textKey] },
                  ]}
                >
                  {cfg.abbr}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {cards && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(300)}
            style={{
              backgroundColor: colors.cream,
              borderRadius: 10,
              borderCurve: "continuous",
              padding: 14,
            }}
          >
            <Text
              style={[
                textStyles.mono,
                { fontSize: 10, color: colors.textMuted, lineHeight: 16 },
              ]}
            >
              {"L'articolo cambia in base al caso grammaticale. Il "}
              <Text style={{ fontWeight: "700", color: colors.textTertiary }}>
                Nominativ
              </Text>
              {" è il soggetto, l'"}
              <Text style={{ fontWeight: "700", color: colors.textTertiary }}>
                Akkusativ
              </Text>
              {" l'oggetto diretto, il "}
              <Text style={{ fontWeight: "700", color: colors.textTertiary }}>
                Dativ
              </Text>
              {" l'oggetto indiretto, e il "}
              <Text style={{ fontWeight: "700", color: colors.textTertiary }}>
                Genitiv
              </Text>
              {" indica possesso."}
            </Text>
          </Animated.View>
        )}

        {isLoading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.mono}>Loading...</Text>
          </View>
        )}

        {!isLoading && !word && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>Parola non trovata.</Text>
          </View>
        )}

        {!isLoading && word && !cards && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>
              Dati di declinazione non disponibili per questa parola.
            </Text>
          </View>
        )}
      </ScrollView>

      <Stack.Screen options={{ title: `${term} — Deklination` }} />
    </>
  );
}
