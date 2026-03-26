import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ContextBoxProps {
  text: string;
}

export function ContextBox({ text }: ContextBoxProps) {
  const { colors, textStyles } = useAppTheme();

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
