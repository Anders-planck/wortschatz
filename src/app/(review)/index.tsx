import { Stack } from "expo-router";
import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function ReviewScreen() {
  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
      >
        <Text selectable style={textStyles.body}>
          Qui troverai le sessioni di ripasso basate sulla ripetizione spaziata.
        </Text>
      </ScrollView>

      <Stack.Screen.Title large>Ripasso</Stack.Screen.Title>
    </>
  );
}
