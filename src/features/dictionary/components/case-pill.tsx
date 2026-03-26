import { Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { CaseType } from "@/features/dictionary/types";

const caseLabels: Record<CaseType, string> = {
  akk: "AKK",
  dat: "DAT",
  gen: "GEN",
  nom: "NOM",
};

interface CasePillProps {
  caseType: CaseType;
}

export function CasePill({ caseType }: CasePillProps) {
  const { colors, textStyles } = useAppTheme();

  const caseStyles: Record<CaseType, { bg: string; text: string }> = {
    akk: { bg: colors.akkBg, text: colors.akkText },
    dat: { bg: colors.datBg, text: colors.datText },
    gen: { bg: colors.genBg, text: colors.genText },
    nom: { bg: colors.nomBg, text: colors.nomText },
  };

  const style = caseStyles[caseType];

  return (
    <View
      style={{
        backgroundColor: style.bg,
        borderRadius: 4,
        borderCurve: "continuous",
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={[textStyles.monoLabel, { color: style.text, letterSpacing: 1 }]}
      >
        {caseLabels[caseType]}
      </Text>
    </View>
  );
}
