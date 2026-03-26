import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { SectionTitle } from "@/features/shared/components/section-title";
import { getWordByTerm } from "@/features/shared/db/words-repository";
import type { Word, VerbConjugation } from "@/features/dictionary/types";
import { isVerbConjugation } from "@/features/dictionary/types";
import { PronounGrid } from "./pronoun-grid";
import { HighlightedForm } from "./highlighted-form";
import { VerbBadge } from "./verb-badge";

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

function TenseTable({
  title,
  data,
  isIrregular,
  highlightEnding,
}: {
  title: string;
  data: ConjugationTenseData;
  isIrregular: boolean;
  highlightEnding: boolean;
}) {
  const referenceForm = data.wir;

  const renderForm = useCallback(
    (pronoun: string, form: string) => (
      <HighlightedForm
        form={form}
        person={pronoun}
        isIrregular={isIrregular}
        referenceForm={referenceForm}
        highlightEnding={highlightEnding}
      />
    ),
    [isIrregular, referenceForm, highlightEnding],
  );

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
        <PronounGrid data={data} renderForm={renderForm} />
      </View>
    </View>
  );
}

function PerfektForm({
  form,
  partizipII,
}: {
  form: string;
  partizipII: string;
}) {
  const parts = form.split(partizipII);
  if (parts.length < 2) {
    return (
      <Text
        selectable
        style={[textStyles.body, { color: colors.textSecondary }]}
      >
        {form}
      </Text>
    );
  }

  const hilfsverb = parts[0].trim();

  return (
    <Text selectable style={[textStyles.body, { color: colors.textSecondary }]}>
      <Text style={{ backgroundColor: colors.akkBg, color: colors.akkText }}>
        {hilfsverb}
      </Text>{" "}
      <Text style={{ backgroundColor: colors.datBg, color: colors.datText }}>
        {partizipII}
      </Text>
    </Text>
  );
}

function PerfektTable({
  data,
  partizipII,
}: {
  data: ConjugationTenseData;
  partizipII: string;
}) {
  const renderForm = useCallback(
    (_pronoun: string, form: string) => (
      <PerfektForm form={form} partizipII={partizipII} />
    ),
    [partizipII],
  );

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Perfekt</SectionTitle>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 10,
          borderCurve: "continuous",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <PronounGrid data={data} renderForm={renderForm} />
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

export function ConjugationScreen({ term }: ConjugationScreenProps) {
  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!term) return;
    setIsLoading(true);
    getWordByTerm(term)
      .then((w) => setWord(w))
      .finally(() => setIsLoading(false));
  }, [term]);

  const conjugation = useMemo<VerbConjugation | null>(
    () => (word?.forms && isVerbConjugation(word.forms) ? word.forms : null),
    [word?.forms],
  );

  const perfektData = useMemo(
    () =>
      conjugation
        ? buildPerfektData(conjugation.hilfsverb, conjugation.partizipII)
        : null,
    [conjugation],
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        style={{ backgroundColor: colors.bg }}
      >
        {conjugation && (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {conjugation.isIrregular && (
                <VerbBadge label="Irregular verb" variant="warning" />
              )}
              <VerbBadge
                label={`Perfekt: ${conjugation.hilfsverb === "sein" ? "ist" : "hat"} ${conjugation.partizipII}`}
                variant="info"
              />
            </View>

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
                  style={{
                    flexDirection: "row",
                    gap: 4,
                    alignItems: "center",
                  }}
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

            <TenseTable
              title="Prasens"
              data={conjugation.present}
              isIrregular={conjugation.isIrregular}
              highlightEnding={true}
            />

            <TenseTable
              title="Prateritum"
              data={conjugation.pastSimple}
              isIrregular={conjugation.isIrregular}
              highlightEnding={true}
            />

            {perfektData && (
              <PerfektTable
                data={perfektData}
                partizipII={conjugation.partizipII}
              />
            )}

            <TenseTable
              title="Konjunktiv II"
              data={conjugation.konjunktivII}
              isIrregular={conjugation.isIrregular}
              highlightEnding={true}
            />
          </>
        )}

        {!conjugation && word && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>
              No conjugation data available for this word.
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.mono}>Loading...</Text>
          </View>
        )}

        {!isLoading && !word && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={textStyles.body}>Word not found.</Text>
          </View>
        )}
      </ScrollView>

      <Stack.Screen options={{ title: `${term} \u2014 Konjugation` }} />
    </>
  );
}
