import Stack from "expo-router/stack";
import { useThemedStackOptions } from "@/components/themed-stack";

export default function ReviewLayout() {
  const screenOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="session" options={{ presentation: "modal" }} />
    </Stack>
  );
}
