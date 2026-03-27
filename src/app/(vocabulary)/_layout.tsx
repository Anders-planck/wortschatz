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
      <Stack.Screen name="collection/[id]" />
      <Stack.Screen
        name="add-to-collection"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1.0],
        }}
      />
      <Stack.Screen
        name="create-collection"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.75, 1.0],
        }}
      />
      <Stack.Screen name="organize" />
    </Stack>
  );
}
