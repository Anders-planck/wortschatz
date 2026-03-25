import { View, Text } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface ContextBoxProps {
  text: string;
}

export function ContextBox({ text }: ContextBoxProps) {
  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 6,
        borderCurve: "continuous",
        padding: 14,
      }}
    >
      <Text selectable style={textStyles.bodyLight}>
        {text}
      </Text>
    </View>
  );
}
