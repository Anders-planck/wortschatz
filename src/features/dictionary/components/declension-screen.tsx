import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";

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

const CASE_INFO = [
  {
    key: "NOM",
    name: "Nominativ",
    question: "Chi? / Cosa?",
    role: "Il soggetto della frase — chi compie l'azione.",
    example: "Der Hund schläft.",
    translation: "Il cane dorme.",
    prepositions: null,
    tip: "Il nominativo è la forma base. È quella che trovi nel dizionario.",
  },
  {
    key: "AKK",
    name: "Akkusativ",
    question: "Chi? / Cosa? (subisce)",
    role: "L'oggetto diretto — chi o cosa subisce l'azione.",
    example: "Ich sehe den Hund.",
    translation: "Vedo il cane.",
    prepositions: "für, durch, gegen, ohne, um, bis, entlang",
    tip: "Solo il maschile cambia: der → den, ein → einen. Femminile, neutro e plurale restano uguali al NOM.",
  },
  {
    key: "DAT",
    name: "Dativ",
    question: "A chi? / Per chi?",
    role: "L'oggetto indiretto — a chi è destinata l'azione.",
    example: "Ich gebe dem Hund Wasser.",
    translation: "Do acqua al cane.",
    prepositions: "mit, nach, aus, bei, von, zu, seit, gegenüber",
    tip: "Tutti i generi cambiano: der → dem, die → der, das → dem. Al plurale: den + -n al nome.",
  },
  {
    key: "GEN",
    name: "Genitiv",
    question: "Di chi? / Di cosa?",
    role: "Possesso e appartenenza.",
    example: "Das Haus des Mannes.",
    translation: "La casa dell'uomo.",
    prepositions: "wegen, trotz, während, statt, außerhalb, innerhalb",
    tip: "Maschile e neutro aggiungono -s o -es al nome. Nella lingua parlata si usa spesso 'von + Dativ' al posto del genitivo.",
  },
];

function CaseInfoSheet({ onClose }: { onClose: () => void }) {
  const { colors, textStyles } = useAppTheme();
  const caseColors: Record<string, { bg: string; text: string }> = {
    NOM: { bg: colors.nomBg, text: colors.nomText },
    AKK: { bg: colors.akkBg, text: colors.akkText },
    DAT: { bg: colors.datBg, text: colors.datText },
    GEN: { bg: colors.genBg, text: colors.genText },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          paddingTop: 16,
        }}
      >
        <Text style={[textStyles.heading, { fontSize: 20 }]}>
          I casi tedeschi
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <SymbolView
            name="xmark.circle.fill"
            size={28}
            tintColor={colors.textGhost}
            resizeMode="scaleAspectFit"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 16 }}
      >
        {CASE_INFO.map((c, i) => {
          const caseColor = caseColors[c.key] ?? {
            bg: colors.cream,
            text: colors.textMuted,
          };
          return (
            <Animated.View
              key={c.key}
              entering={FadeInDown.delay(i * 80).duration(300)}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderCurve: "continuous",
                overflow: "hidden",
              }}
            >
              {/* Case header */}
              <View
                style={{
                  backgroundColor: caseColor.bg,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <Text
                    style={[
                      textStyles.mono,
                      {
                        fontSize: 12,
                        fontWeight: "700",
                        color: caseColor.text,
                        letterSpacing: 1,
                      },
                    ]}
                  >
                    {c.key}
                  </Text>
                  <Text
                    style={[
                      textStyles.heading,
                      { fontSize: 16, color: caseColor.text },
                    ]}
                  >
                    {c.name}
                  </Text>
                </View>
                <Text
                  style={[
                    textStyles.bodyLight,
                    { fontSize: 13, color: caseColor.text },
                  ]}
                >
                  {c.question}
                </Text>
              </View>

              {/* Body */}
              <View style={{ padding: 16, gap: 12 }}>
                <Text
                  style={[
                    textStyles.body,
                    { fontSize: 14, color: colors.textSecondary },
                  ]}
                >
                  {c.role}
                </Text>

                {/* Example */}
                <View
                  style={{
                    backgroundColor: colors.cream,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    padding: 12,
                    gap: 4,
                  }}
                >
                  <Text
                    style={[
                      textStyles.heading,
                      { fontSize: 15, color: colors.textPrimary },
                    ]}
                  >
                    {c.example}
                  </Text>
                  <Text
                    style={[
                      textStyles.bodyLight,
                      { fontSize: 13, color: colors.textMuted },
                    ]}
                  >
                    {c.translation}
                  </Text>
                </View>

                {/* Prepositions */}
                {c.prepositions && (
                  <View style={{ gap: 4 }}>
                    <Text
                      style={[
                        textStyles.mono,
                        {
                          fontSize: 10,
                          color: colors.textGhost,
                          letterSpacing: 1,
                        },
                      ]}
                    >
                      PREPOSIZIONI
                    </Text>
                    <Text
                      style={[
                        textStyles.body,
                        {
                          fontSize: 13,
                          color: caseColor.text,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {c.prepositions}
                    </Text>
                  </View>
                )}

                {/* Tip */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <SymbolView
                    name="lightbulb.fill"
                    size={14}
                    tintColor={colors.accent}
                    resizeMode="scaleAspectFit"
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={[
                      textStyles.bodyLight,
                      { fontSize: 13, color: colors.textSecondary, flex: 1 },
                    ]}
                  >
                    {c.tip}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Quick reference */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(300)}
          style={{
            backgroundColor: colors.accentLight,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 16,
            gap: 8,
            marginBottom: 40,
          }}
        >
          <Text
            style={[
              textStyles.mono,
              { fontSize: 10, color: colors.textGhost, letterSpacing: 1 },
            ]}
          >
            TRUCCO RAPIDO
          </Text>
          {[
            { q: "Chi fa?", a: "→ NOM" },
            { q: "Chi/cosa subisce?", a: "→ AKK" },
            { q: "A chi va?", a: "→ DAT" },
            { q: "Di chi è?", a: "→ GEN" },
          ].map((item) => (
            <View key={item.a} style={{ flexDirection: "row", gap: 8 }}>
              <Text
                style={[
                  textStyles.body,
                  { fontSize: 14, color: colors.textPrimary },
                ]}
              >
                {item.q}
              </Text>
              <Text
                style={[
                  textStyles.heading,
                  { fontSize: 14, color: colors.accent },
                ]}
              >
                {item.a}
              </Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export function DeclensionScreen({ term }: DeclensionScreenProps) {
  const { colors, textStyles } = useAppTheme();
  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="info.circle"
          onPress={() => setShowInfo(true)}
        />
      </Stack.Toolbar>

      <Modal
        visible={showInfo}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowInfo(false)}
      >
        <CaseInfoSheet onClose={() => setShowInfo(false)} />
      </Modal>
    </>
  );
}
