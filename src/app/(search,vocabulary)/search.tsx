import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function SearchScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 12 }}
      style={{ backgroundColor: colors.bg }}
    >
      <Text selectable style={textStyles.body}>
        Cerca una parola in tedesco per vederne il significato, il genere e gli
        esempi d&apos;uso.
      </Text>
      <Text selectable style={textStyles.bodyLight}>
        La ricerca interroga Wiktionary e, quando necessario, un modello AI per
        arricchire le informazioni.
      </Text>
    </ScrollView>
  );
}
