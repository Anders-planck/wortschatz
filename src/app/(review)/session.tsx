import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function SessionScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 12 }}
      style={{ backgroundColor: colors.bg }}
    >
      <Text selectable style={textStyles.body}>
        La sessione di ripasso apparira qui.
      </Text>
      <Text selectable style={textStyles.bodyLight}>
        Rispondi alle domande per consolidare il vocabolario.
      </Text>
    </ScrollView>
  );
}
