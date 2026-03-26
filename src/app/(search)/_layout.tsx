import Stack from "expo-router/stack";

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="word/[term]" />
      <Stack.Screen
        name="conjugation/[term]"
        options={{ title: "Konjugation" }}
      />
    </Stack>
  );
}
