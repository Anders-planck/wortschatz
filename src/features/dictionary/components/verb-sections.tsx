import { View } from "react-native";
import { SectionTitle } from "@/features/shared/components/section-title";
import { ConjugationTable } from "./conjugation-table";
import { CasePill } from "./case-pill";
import type { Word } from "@/features/dictionary/types";

interface VerbSectionsProps {
  word: Word;
}

interface ConjugationData {
  ich?: string;
  du?: string;
  er?: string;
  wir?: string;
  ihr?: string;
  sie?: string;
}

interface VerbForms {
  [key: string]: unknown;
  present?: ConjugationData;
  governs?: string[];
}

function isVerbForms(forms: Record<string, unknown>): forms is VerbForms {
  return "present" in forms || "governs" in forms;
}

type CaseType = "akk" | "dat" | "gen" | "nom";

const validCases: readonly string[] = ["akk", "dat", "gen", "nom"];

function isCaseType(value: string): value is CaseType {
  return validCases.includes(value);
}

export function VerbSections({ word }: VerbSectionsProps) {
  if (!word.forms || !isVerbForms(word.forms)) return null;

  const { present, governs } = word.forms;

  return (
    <View style={{ gap: 16 }}>
      {present && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Present Tense</SectionTitle>
          <ConjugationTable data={present} />
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
    </View>
  );
}
