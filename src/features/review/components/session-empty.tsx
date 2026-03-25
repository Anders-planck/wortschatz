import { View, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export function SessionEmpty() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <Text style={textStyles.mono}>No words to review</Text>
    </View>
  );
}
