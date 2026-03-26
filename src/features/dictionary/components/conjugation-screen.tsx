import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { SectionTitle } from "@/features/shared/components/section-title";
import { getWordByTerm } from "@/features/shared/db/words-repository";
import type { Word, VerbConjugation } from "@/features/dictionary/types";

interface ConjugationScreenProps {
  term: string;
}

interface ConjugationTenseData {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

const pronounRows: { key: keyof ConjugationTenseData; label: string }[] = [
  { key: "ich", label: "ich" },
  { key: "du", label: "du" },
  { key: "er", label: "er/sie/es" },
  { key: "wir", label: "wir" },
  { key: "ihr", label: "ihr" },
  { key: "sie", label: "sie/Sie" },
];

const leftPronouns = pronounRows.slice(0, 3);
const rightPronouns = pronounRows.slice(3);

// Standard verb endings for highlighting
const standardEndings: Record<string, string> = {
  ich: "e",
  du: "st",
  er: "t",
  wir: "en",
  ihr: "t",
  sie: "en",
};

function splitEnding(
  form: string,
  person: string,
): { stem: string; ending: string } {
  const ending = standardEndings[person] ?? "";
  if (form.endsWith(ending) && ending.length > 0) {
    return {
      stem: form.slice(0, form.length - ending.length),
      ending,
    };
  }
  return { stem: form, ending: "" };
}

function HighlightedForm({
  form,
  person,
  isIrregular,
  referenceForm,
  highlightEnding,
}: {
  form: string;
  person: string;
  isIrregular: boolean;
  referenceForm?: string;
  highlightEnding: boolean;
}) {
  const { stem, ending } = highlightEnding
    ? splitEnding(form, person)
    : { stem: form, ending: "" };

  // Check for stem change compared to reference (wir form)
  let stemHasChange = false;
  if (isIrregular && referenceForm) {
    const refParts = splitEnding(referenceForm, "wir");
    if (stem !== refParts.stem && stem.length > 0 && refParts.stem.length > 0) {
      stemHasChange = true;
    }
  }

  if (!highlightEnding && !stemHasChange) {
    return (
      <Text
        selectable
        style={[textStyles.body, { color: colors.textSecondary }]}
      >
        {form}
      </Text>
    );
  }

  return (
    <Text selectable style={[textStyles.body, { color: colors.textSecondary }]}>
      {stemHasChange ? (
        <Text style={{ backgroundColor: colors.datBg, color: colors.datText }}>
          {stem}
        </Text>
      ) : (
        stem
      )}
      {ending.length > 0 && (
        <Text style={{ backgroundColor: colors.akkBg, color: colors.akkText }}>
          {ending}
        </Text>
      )}
    </Text>
  );
}

function TenseTable({
  title,
  data,
  isIrregular,
  highlightEnding,
  constructPerfekt,
}: {
  title: string;
  data: ConjugationTenseData;
  isIrregular: boolean;
  highlightEnding: boolean;
  constructPerfekt?: boolean;
}) {
  const referenceForm = data.wir;

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 10,
          borderCurve: "continuous",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            {leftPronouns.map(({ key, label }) => (
              <View
                key={key}
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Text
                  style={[textStyles.monoLabel, { width: 52, marginBottom: 0 }]}
                >
                  {label}
                </Text>
                <HighlightedForm
                  form={data[key] ?? "\u2014"}
                  person={key}
                  isIrregular={isIrregular}
                  referenceForm={referenceForm}
                  highlightEnding={highlightEnding}
                />
              </View>
            ))}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {rightPronouns.map(({ key, label }) => (
              <View
                key={key}
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <Text
                  style={[textStyles.monoLabel, { width: 52, marginBottom: 0 }]}
                >
                  {label}
                </Text>
                <HighlightedForm
                  form={data[key] ?? "\u2014"}
                  person={key}
                  isIrregular={isIrregular}
                  referenceForm={referenceForm}
                  highlightEnding={highlightEnding}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function buildPerfektData(
  hilfsverb: string,
  partizipII: string,
): ConjugationTenseData {
  const aux =
    hilfsverb === "sein"
      ? {
          ich: "bin",
          du: "bist",
          er: "ist",
          wir: "sind",
          ihr: "seid",
          sie: "sind",
        }
      : {
          ich: "habe",
          du: "hast",
          er: "hat",
          wir: "haben",
          ihr: "habt",
          sie: "haben",
        };

  return {
    ich: `${aux.ich} ${partizipII}`,
    du: `${aux.du} ${partizipII}`,
    er: `${aux.er} ${partizipII}`,
    wir: `${aux.wir} ${partizipII}`,
    ihr: `${aux.ihr} ${partizipII}`,
    sie: `${aux.sie} ${partizipII}`,
  };
}

function getConjugation(
  forms: Record<string, unknown>,
): VerbConjugation | null {
  if (
    "hilfsverb" in forms &&
    "partizipII" in forms &&
    "present" in forms &&
    "pastSimple" in forms &&
    "konjunktivII" in forms
  ) {
    return forms as unknown as VerbConjugation;
  }
  return null;
}

export function ConjugationScreen({ term }: ConjugationScreenProps) {
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    if (term) {
      getWordByTerm(term).then((w) => {
        if (w) setWord(w);
      });
    }
  }, [term]);

  const conjugation = word?.forms ? getConjugation(word.forms) : null;

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Header badges */}
        {conjugation && (
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {conjugation.isIrregular && (
              <View
                style={{
                  backgroundColor: colors.genBg,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 14,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  style={[
                    textStyles.mono,
                    { color: colors.genText, fontSize: 12 },
                  ]}
                >
                  Irregular verb
                </Text>
              </View>
            )}
            <View
              style={{
                backgroundColor: colors.nomBg,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 14,
                borderCurve: "continuous",
              }}
            >
              <Text
                style={[
                  textStyles.mono,
                  { color: colors.nomText, fontSize: 12 },
                ]}
              >
                Perfekt: {conjugation.hilfsverb === "sein" ? "ist" : "hat"}{" "}
                {conjugation.partizipII}
              </Text>
            </View>
          </View>
        )}

        {/* Legend */}
        {conjugation && (
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: colors.akkBg,
                  borderRadius: 3,
                  borderCurve: "continuous",
                }}
              />
              <Text style={textStyles.mono}>Endings</Text>
            </View>
            {conjugation.isIrregular && (
              <View
                style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: colors.datBg,
                    borderRadius: 3,
                    borderCurve: "continuous",
                  }}
                />
                <Text style={textStyles.mono}>Stem change</Text>
              </View>
            )}
          </View>
        )}

        {/* Prasens */}
        {conjugation && (
          <TenseTable
            title="Prasens"
            data={conjugation.present}
            isIrregular={conjugation.isIrregular}
            highlightEnding={true}
          />
        )}

        {/* Prateritum */}
        {conjugation && (
          <TenseTable
            title="Prateritum"
            data={conjugation.pastSimple}
            isIrregular={conjugation.isIrregular}
            highlightEnding={true}
          />
        )}

        {/* Perfekt (constructed) */}
        {conjugation && (
          <TenseTable
            title="Perfekt"
            data={buildPerfektData(
              conjugation.hilfsverb,
              conjugation.partizipII,
            )}
            isIrregular={false}
            highlightEnding={false}
          />
        )}

        {/* Konjunktiv II */}
        {conjugation && (
          <TenseTable
            title="Konjunktiv II"
            data={conjugation.konjunktivII}
            isIrregular={conjugation.isIrregular}
            highlightEnding={true}
          />
        )}

        {!conjugation && word && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>
              No conjugation data available for this word.
            </Text>
          </View>
        )}

        {!word && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>Loading...</Text>
          </View>
        )}
      </ScrollView>

      <Stack.Screen.Title>
        {term} {"\u2014"} Konjugation
      </Stack.Screen.Title>
    </>
  );
}
