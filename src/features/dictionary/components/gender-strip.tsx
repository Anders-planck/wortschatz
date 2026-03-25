import { View } from "react-native";
import type { Gender } from "@/features/dictionary/types";
import { GENDER_COLORS } from "@/features/shared/utils/word-colors";

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
        backgroundColor: GENDER_COLORS[gender],
        marginBottom: 10,
      }}
    />
  );
}
