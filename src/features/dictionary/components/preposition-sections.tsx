import { View } from "react-native";
import { SectionTitle } from "@/features/shared/components/section-title";
import { CasePill } from "./case-pill";
import { ExampleSentence } from "./example-sentence";
import type { Word, Example } from "@/features/dictionary/types";

interface PrepositionSectionsProps {
  word: Word;
  onWordPress?: (word: string, meaning: string) => void;
}

type CaseType = "akk" | "dat" | "gen" | "nom";

const validCases: readonly string[] = ["akk", "dat", "gen", "nom"];

function isCaseType(value: string): value is CaseType {
  return validCases.includes(value);
}

interface PrepForms {
  [key: string]: unknown;
  cases?: string[];
  wechsel?: boolean;
  akkExample?: Example;
  datExample?: Example;
}

function isPrepForms(forms: Record<string, unknown>): forms is PrepForms {
  return "cases" in forms || "wechsel" in forms;
}

export function PrepositionSections({
  word,
  onWordPress,
}: PrepositionSectionsProps) {
  if (!word.forms || !isPrepForms(word.forms)) return null;

  const { cases: prepCases, wechsel, akkExample, datExample } = word.forms;

  return (
    <View style={{ gap: 16 }}>
      {prepCases && prepCases.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Cases</SectionTitle>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {prepCases.filter(isCaseType).map((c) => (
              <CasePill key={c} caseType={c} />
            ))}
          </View>
        </View>
      )}
      {wechsel && (
        <View style={{ gap: 12 }}>
          {akkExample && (
            <View style={{ gap: 6 }}>
              <CasePill caseType="akk" />
              <ExampleSentence example={akkExample} onWordPress={onWordPress} />
            </View>
          )}
          {datExample && (
            <View style={{ gap: 6 }}>
              <CasePill caseType="dat" />
              <ExampleSentence example={datExample} onWordPress={onWordPress} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
