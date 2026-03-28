import { View } from "react-native";
import { SectionTitle } from "@/features/shared/components/section-title";
import { DeclensionTable } from "./declension-table";
import type { Word } from "@/features/dictionary/types";
import type { DeclensionForms } from "@/features/dictionary/utils/declension-data";

interface NounSectionsProps {
  word: Word;
}

function isDeclensionData(
  forms: Record<string, unknown>,
): forms is DeclensionForms & Record<string, unknown> {
  return (
    "nominativ" in forms ||
    "akkusativ" in forms ||
    "dativ" in forms ||
    "genitiv" in forms
  );
}

export function NounSections({ word }: NounSectionsProps) {
  if (!word.forms || !isDeclensionData(word.forms)) return null;

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Declension</SectionTitle>
      <DeclensionTable data={word.forms} />
    </View>
  );
}
