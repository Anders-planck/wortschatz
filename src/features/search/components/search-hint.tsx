import { Text, View } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export function SearchHint() {
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
