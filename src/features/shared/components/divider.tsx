import { View } from "react-native";
import { colors } from "@/features/shared/theme/colors";

export function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.6,
        marginVertical: 14,
      }}
    />
  );
}
