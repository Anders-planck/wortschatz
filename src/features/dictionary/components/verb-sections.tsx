import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SectionTitle } from "@/features/shared/components/section-title";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { CasePill } from "./case-pill";
import {
  type Word,
  type VerbConjugation,
  isCaseType,
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

function hasConjugation(
  forms: VerbForms,
): forms is VerbForms & VerbConjugation {
  return "hilfsverb" in forms && "partizipII" in forms && "present" in forms;
}

const leftPronouns = [
  { key: "ich" as const, label: "ich" },
  { key: "du" as const, label: "du" },
  { key: "er" as const, label: "er/sie/es" },
];

const rightPronouns = [
  { key: "wir" as const, label: "wir" },
  { key: "ihr" as const, label: "ihr" },
  { key: "sie" as const, label: "sie/Sie" },
];

function HighlightedConjugation({
  form,
  isIrregular,
  referenceForm,
}: {
  form: string;
  isIrregular: boolean;
  referenceForm?: string;
}) {
  if (!isIrregular || !referenceForm || form === referenceForm) {
    return (
      <Text
        selectable
        style={[textStyles.body, { color: colors.textSecondary }]}
      >
        {form}
      </Text>
    );
  }

  // Try to find the differing part (stem vowel change)
  // Simple approach: find first character difference
  let diffStart = -1;
  let diffEnd = -1;
  const minLen = Math.min(form.length, referenceForm.length);

  for (let i = 0; i < minLen; i++) {
    if (form[i] !== referenceForm[i]) {
      if (diffStart === -1) diffStart = i;
      diffEnd = i + 1;
    }
  }

  // If lengths differ, extend diff to cover extra chars
  if (form.length !== referenceForm.length && diffStart === -1) {
    diffStart = minLen;
    diffEnd = Math.max(form.length, referenceForm.length);
  } else if (diffEnd < form.length && form.length > referenceForm.length) {
    diffEnd = form.length - (referenceForm.length - diffEnd);
  }

  if (diffStart === -1) {
    return (
      <Text
        selectable
        style={[textStyles.body, { color: colors.textSecondary }]}
      >
        {form}
      </Text>
    );
  }

  const before = form.slice(0, diffStart);
  const changed = form.slice(diffStart, diffEnd);
  const after = form.slice(diffEnd);

  return (
    <Text selectable style={[textStyles.body, { color: colors.textSecondary }]}>
      {before}
      <Text
        style={{
          backgroundColor: colors.akkBg,
          color: colors.akkText,
          fontWeight: "600",
        }}
      >
        {changed}
      </Text>
      {after}
    </Text>
  );
}

function PresentTenseTable({
  data,
  isIrregular,
}: {
  data: Record<string, string>;
  isIrregular: boolean;
}) {
  // Use "wir" form as reference (always regular stem)
  const referenceForm = data.wir;

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
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
            <HighlightedConjugation
              form={data[key] ?? "—"}
              isIrregular={isIrregular}
              referenceForm={referenceForm}
            />
          </View>
        ))}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
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
            <HighlightedConjugation
              form={data[key] ?? "—"}
              isIrregular={isIrregular}
              referenceForm={referenceForm}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function VerbSections({ word }: VerbSectionsProps) {
  const router = useRouter();

  if (!word.forms || !isVerbForms(word.forms)) return null;

  const forms = word.forms;
  const { governs } = forms;
  const conjugated = hasConjugation(forms);

  return (
    <View style={{ gap: 16 }}>
      {/* Irregular badge + Hilfsverb */}
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
            <View
              style={{
                backgroundColor: colors.genBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderCurve: "continuous",
              }}
            >
              <Text
                style={[
                  textStyles.mono,
                  { color: colors.genText, fontSize: 12 },
                ]}
              >
                Irregular
              </Text>
            </View>
          )}
          <View
            style={{
              backgroundColor: colors.nomBg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderCurve: "continuous",
            }}
          >
            <Text
              style={[textStyles.mono, { color: colors.nomText, fontSize: 12 }]}
            >
              Perfekt: {forms.hilfsverb === "sein" ? "ist" : "hat"}{" "}
              {forms.partizipII}
            </Text>
          </View>
        </View>
      )}

      {/* Present tense table */}
      {forms.present && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Prasens</SectionTitle>
          <PresentTenseTable
            data={forms.present as Record<string, string>}
            isIrregular={!!forms.isIrregular}
          />
        </View>
      )}

      {/* Governs cases */}
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

      {/* All tenses link */}
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
