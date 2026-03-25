import Stack from "expo-router/stack";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function WordDetailScreen() {
  const { term } = useLocalSearchParams<{ term: string }>();

  return (
    <>
      <Stack.Screen options={{ title: term ?? "" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        <Text selectable style={textStyles.word}>
          {term}
        </Text>
        <Text selectable style={textStyles.bodyLight}>
          Dettagli per &ldquo;{term}&rdquo; in arrivo.
        </Text>
      </ScrollView>
    </>
  );
}
