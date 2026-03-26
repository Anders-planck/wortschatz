import { useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SectionTitle } from "@/features/shared/components/section-title";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { CasePill } from "./case-pill";
import { PronounGrid } from "./pronoun-grid";
import { HighlightedForm } from "./highlighted-form";
import { VerbBadge } from "./verb-badge";
import {
  type Word,
  type VerbConjugation,
  isCaseType,
  isVerbConjugation,
} from "@/features/dictionary/types";

interface VerbSectionsProps {
  word: Word;
}

interface VerbForms {
  [key: string]: unknown;
  present?: Record<string, string>;
  governs?: string[];
  isIrregular?: boolean;
  hilfsverb?: string;
  partizipII?: string;
}

function isVerbForms(forms: Record<string, unknown>): forms is VerbForms {
  return "present" in forms || "governs" in forms || "isIrregular" in forms;
}

export function VerbSections({ word }: VerbSectionsProps) {
  const router = useRouter();
  const forms = word.forms as VerbForms | null;
  const hasVerb = !!forms && isVerbForms(forms as Record<string, unknown>);
  const governs = forms?.governs;
  const conjugated = hasVerb && isVerbConjugation(forms);
  const referenceForm = (forms?.present as Record<string, string> | undefined)
    ?.wir;

  const renderForm = useCallback(
    (pronoun: string, form: string) => (
      <HighlightedForm
        form={form}
        person={pronoun}
        isIrregular={!!forms?.isIrregular}
        referenceForm={referenceForm}
        highlightEnding={true}
      />
    ),
    [forms?.isIrregular, referenceForm],
  );

  if (!hasVerb) return null;

  return (
    <View style={{ gap: 16 }}>
      {conjugated && (
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {forms.isIrregular && (
            <VerbBadge label="Irregular" variant="warning" />
          )}
          <VerbBadge
            label={`Perfekt: ${(forms as VerbConjugation).hilfsverb === "sein" ? "ist" : "hat"} ${(forms as VerbConjugation).partizipII}`}
            variant="info"
          />
        </View>
      )}

      {forms.present && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Prasens</SectionTitle>
          <PronounGrid
            data={
              forms.present as {
                ich: string;
                du: string;
                er: string;
                wir: string;
                ihr: string;
                sie: string;
              }
            }
            renderForm={renderForm}
          />
        </View>
      )}

      {governs && governs.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Governs</SectionTitle>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {governs.filter(isCaseType).map((c) => (
              <CasePill key={c} caseType={c} />
            ))}
          </View>
        </View>
      )}

      {conjugated && (
        <Pressable
          onPress={() =>
            router.push(`/conjugation/${encodeURIComponent(word.term)}`)
          }
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: pressed ? colors.border : colors.cream,
            borderRadius: 10,
            borderCurve: "continuous",
            gap: 4,
          })}
        >
          <Text
            style={[textStyles.body, { color: colors.verb, fontWeight: "600" }]}
          >
            All tenses
          </Text>
          <Text style={[textStyles.body, { color: colors.verb }]}>
            {"\u2192"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
