import Stack from "expo-router/stack";
import { useThemedStackOptions } from "@/components/themed-stack";

export default function SettingsLayout() {
  const screenOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
