import Stack from "expo-router/stack";
import { useThemedStackOptions } from "@/components/themed-stack";

export default function ReviewLayout() {
  const screenOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="session" options={{ presentation: "modal" }} />
      <Stack.Screen name="chat" />
      <Stack.Screen name="chat-session" options={{ presentation: "modal" }} />
      <Stack.Screen name="exercises" />
      <Stack.Screen
        name="exercise-session"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [1.0],
        }}
      />
    </Stack>
  );
}
