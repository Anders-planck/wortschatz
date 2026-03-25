import { Text, View } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

type CaseType = "akk" | "dat" | "gen" | "nom";

const caseStyles: Record<CaseType, { bg: string; text: string }> = {
  akk: { bg: colors.akkBg, text: colors.akkText },
  dat: { bg: colors.datBg, text: colors.datText },
  gen: { bg: "#E8E0F0", text: "#7A6A8A" },
  nom: { bg: "#E0E8F0", text: "#5A6A7A" },
};

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
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: "600",
          color: style.text,
          letterSpacing: 1,
        }}
      >
        {caseLabels[caseType]}
      </Text>
    </View>
  );
}
