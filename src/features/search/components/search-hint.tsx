import { Text, View } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

export function SearchHint() {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ paddingTop: 32, alignItems: "center" }}>
      <Text
        style={[textStyles.bodyLight, { fontSize: 14, color: colors.textHint }]}
      >
        Continua a scrivere...
      </Text>
    </View>
  );
}
