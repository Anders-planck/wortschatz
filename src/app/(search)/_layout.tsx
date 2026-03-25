import Stack from "expo-router/stack";

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
