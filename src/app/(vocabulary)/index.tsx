import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function VocabularyScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 12 }}
      style={{ backgroundColor: colors.bg }}
    >
      <Text selectable style={textStyles.body}>
        Le parole che hai salvato appariranno qui, raggruppate per genere e
        ordinate per data.
      </Text>
      <Text selectable style={textStyles.bodyLight}>
        Tocca una parola per rivederne i dettagli o scorri per eliminarla dalla
        lista.
      </Text>
    </ScrollView>
  );
}
