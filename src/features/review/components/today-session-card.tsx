import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface TodaySessionCardProps {
  wordCount: number;
  onStart: () => void;
}

export function TodaySessionCard({
  wordCount,
  onStart,
}: TodaySessionCardProps) {
  const { colors, textStyles } = useAppTheme();
  const dots = Array.from({ length: Math.max(wordCount, 0) }, (_, i) => i);

  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 8,
        borderCurve: "continuous",
        padding: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={[textStyles.heading, { fontSize: 14, letterSpacing: 0 }]}>
          Today
        </Text>
        <Text
          style={[
            textStyles.mono,
            { fontSize: 10, fontVariant: ["tabular-nums"] },
          ]}
        >
          {wordCount} words
        </Text>
      </View>

      {wordCount > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
          {dots.map((i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "rgba(44, 44, 44, 0.08)",
              }}
            />
          ))}
        </View>
      )}

      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          backgroundColor: colors.textPrimary,
          borderRadius: 4,
          borderCurve: "continuous",
          paddingVertical: 10,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={[
            textStyles.body,
            { fontSize: 13, fontWeight: "500", color: colors.card },
          ]}
        >
          {wordCount === 0 ? "Nessuna parola da ripassare" : "Start session"}
        </Text>
      </Pressable>
    </View>
  );
}
