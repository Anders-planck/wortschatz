import React from "react";
import { Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

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

interface HighlightedFormProps {
  form: string;
  person: string;
  isIrregular: boolean;
  referenceForm?: string;
  highlightEnding: boolean;
}

export const HighlightedForm = React.memo(function HighlightedForm({
  form,
  person,
  isIrregular,
  referenceForm,
  highlightEnding,
}: HighlightedFormProps) {
  const { colors, textStyles } = useAppTheme();
  const { stem, ending } = highlightEnding
    ? splitEnding(form, person)
    : { stem: form, ending: "" };

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
});
