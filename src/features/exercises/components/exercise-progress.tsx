import { View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ExerciseProgressProps {
  total: number;
  current: number;
  results: Array<{ isCorrect: boolean }>;
}

export function ExerciseProgress({
  total,
  current,
  results,
}: ExerciseProgressProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < results.length;
        const isCurrent = i === current;
        const result = results[i];

        let bgColor: string;
        if (isCompleted && result) {
          bgColor = result.isCorrect ? "#4A9A4A" : "#C05050";
        } else if (isCurrent) {
          bgColor = colors.accent;
        } else {
          bgColor = colors.borderLight;
        }

        return (
          <View
            key={i}
            style={{
              width: isCurrent ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: bgColor,
            }}
          />
        );
      })}
    </View>
  );
}
