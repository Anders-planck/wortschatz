import { View } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import type { Gender } from "@/features/dictionary/types";

const genderColors: Record<Gender, string> = {
  der: colors.der,
  die: colors.die,
  das: colors.das,
};

interface GenderStripProps {
  gender: Gender;
}

export function GenderStrip({ gender }: GenderStripProps) {
  return (
    <View
      style={{
        width: 28,
        height: 3,
        borderRadius: 2,
        backgroundColor: genderColors[gender],
        marginBottom: 10,
      }}
    />
  );
}
