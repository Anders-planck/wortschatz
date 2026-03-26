import { View } from "react-native";
import type { Gender } from "@/features/dictionary/types";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { getGenderColors } from "@/features/shared/utils/word-colors";

interface GenderStripProps {
  gender: Gender;
}

export function GenderStrip({ gender }: GenderStripProps) {
  const colors = useThemeColors();
  const genderColors = getGenderColors(colors);

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
