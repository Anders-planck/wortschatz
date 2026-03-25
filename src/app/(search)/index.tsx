import { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
      >
        <Text selectable style={textStyles.body}>
          Cerca una parola in tedesco per vederne il significato, il genere e
          gli esempi d&apos;uso.
        </Text>
        {query.length > 0 && (
          <Text selectable style={textStyles.bodyLight}>
            Searching: {query}
          </Text>
        )}
      </ScrollView>

      <Stack.Screen.Title large>Cerca</Stack.Screen.Title>
      <Stack.SearchBar
        placeholder="Type a word..."
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
      />
    </>
  );
}
