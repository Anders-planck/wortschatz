import Stack from "expo-router/stack";
import { useThemedStackOptions } from "@/components/themed-stack";

export default function SearchLayout() {
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
      <Stack.Screen
        name="add-to-collection"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1.0],
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.85, 1.0],
        }}
      />
    </Stack>
  );
}
