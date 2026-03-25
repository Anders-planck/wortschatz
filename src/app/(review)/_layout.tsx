import Stack from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function ReviewStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerTitleStyle: {
          color: PlatformColor("label") as unknown as string,
        },
        headerLargeTitleStyle: {
          color: PlatformColor("label") as unknown as string,
        },
        headerLargeTitle: true,
        headerBlurEffect: "none",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Ripasso" }} />
      <Stack.Screen
        name="session"
        options={{
          presentation: "modal",
          headerLargeTitle: false,
          title: "Sessione",
        }}
      />
    </Stack>
  );
}
