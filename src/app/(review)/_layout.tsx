import Stack from "expo-router/stack";

export default function ReviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="session" options={{ presentation: "modal" }} />
    </Stack>
  );
}
