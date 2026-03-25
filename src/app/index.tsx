import { ScrollView, Text } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function HomeScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
      style={{ backgroundColor: colors.bg }}
    >
      <Text style={textStyles.word}>WortSchatz</Text>
      <Text style={[textStyles.mono, { marginTop: 8 }]}>
        il tuo tedesco, parola per parola
      </Text>
    </ScrollView>
  );
}
