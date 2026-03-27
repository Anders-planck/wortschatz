import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ExerciseProgressProps {
  total: number;
  current: number;
  results: Array<{ isCorrect: boolean }>;
  startTime: number | null;
}

export function ExerciseProgress({
  total,
  current,
  results,
  startTime,
}: ExerciseProgressProps) {
  const { colors, textStyles } = useAppTheme();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    setElapsed(Math.round((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 8,
      }}
    >
      {/* Timer */}
      <Text
        style={{
          fontFamily: textStyles.mono.fontFamily,
          fontSize: 12,
          color: colors.textHint,
          fontVariant: ["tabular-nums"],
          minWidth: 36,
        }}
      >
        {minutes}:{String(seconds).padStart(2, "0")}
      </Text>

      {/* Dots */}
      <View
        style={{
          flex: 1,
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

      {/* Counter */}
      <Text
        style={{
          fontFamily: textStyles.mono.fontFamily,
          fontSize: 12,
          color: colors.textHint,
          minWidth: 36,
          textAlign: "right",
        }}
      >
        {current + 1}/{total}
      </Text>
    </View>
  );
}
