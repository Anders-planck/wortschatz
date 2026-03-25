import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function ReviewScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 12 }}
      style={{ backgroundColor: colors.bg }}
    >
      <Text selectable style={textStyles.body}>
        Qui troverai le sessioni di ripasso basate sulla ripetizione spaziata.
      </Text>
      <Text selectable style={textStyles.bodyLight}>
        Le parole da ripassare vengono selezionate automaticamente in base a
        quanto bene le ricordi.
      </Text>
    </ScrollView>
  );
}
