import { View, Text } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

export function SessionEmpty() {
  const { colors, textStyles } = useAppTheme();

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
