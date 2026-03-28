import { Stack, useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { ExerciseHub } from "@/features/exercises/components/exercise-hub";
import type { ExerciseType } from "@/features/exercises/types";

export default function ExercisesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const handleSelect = (type: ExerciseType) => {
    router.push({
      pathname: "/(review)/exercise-session",
      params: { exerciseType: type },
    });
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        <ExerciseHub onSelect={handleSelect} />
      </ScrollView>
      <Stack.Screen options={{ title: "Esercizi" }} />
    </>
  );
}
