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
      <Stack.Screen name="chat-history" />
      <Stack.Screen
        name="chat-session"
        options={{
          presentation: "modal",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="create-scenario"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.85],
        }}
      />
      <Stack.Screen name="readings" />
      <Stack.Screen name="reading/[id]" />
      <Stack.Screen
        name="listening"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [1.0],
        }}
      />
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
