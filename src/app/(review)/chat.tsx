import { Stack, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SCENARIOS } from "@/features/chat/constants";
import { ScenarioCard } from "@/features/chat/components/scenario-card";

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 12 }}
        style={{ backgroundColor: colors.bg }}
      >
        {SCENARIOS.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            featured={index === 0}
            onPress={() =>
              router.push({
                pathname: "/(review)/chat-session",
                params: { scenarioId: scenario.id },
              })
            }
          />
        ))}
      </ScrollView>
      <Stack.Screen options={{ title: "Conversazione" }} />
    </>
  );
}
