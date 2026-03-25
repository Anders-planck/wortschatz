import Stack from "expo-router/stack";
import { PlatformColor } from "react-native";

export const unstable_settings = {
  search: { anchor: "search" },
  vocabulary: { anchor: "vocabulary" },
};

export default function SharedStackLayout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1] ?? "search";
  const titles: Record<string, string> = {
    search: "Cerca",
    vocabulary: "Parole",
  };

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
      <Stack.Screen
        name={screen}
        options={{ title: titles[screen] ?? "Cerca" }}
      />
      <Stack.Screen name="word/[term]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
