import Stack from "expo-router/stack";
import { useThemedStackOptions } from "@/components/themed-stack";

export default function VocabularyLayout() {
  const screenOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="word/[term]" />
      <Stack.Screen
        name="conjugation/[term]"
        options={{ title: "Konjugation" }}
      />
      <Stack.Screen
        name="declension/[term]"
        options={{ title: "Deklination" }}
      />
    </Stack>
  );
}
