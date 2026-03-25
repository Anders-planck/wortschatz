import { View, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface WordErrorProps {
  message: string;
}

export function WordError({ message }: WordErrorProps) {
  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 6,
        borderCurve: "continuous",
        padding: 16,
        alignItems: "center",
        gap: 6,
      }}
    >
      <Text selectable style={[textStyles.body, { textAlign: "center" }]}>
        {message}
      </Text>
    </View>
  );
}
