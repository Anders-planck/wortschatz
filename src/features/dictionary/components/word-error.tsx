import { View, Text } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface WordErrorProps {
  message: string;
}

export function WordError({ message }: WordErrorProps) {
  const { colors, textStyles } = useAppTheme();

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
