import { Pressable, Text, View } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

interface TodaySessionCardProps {
  wordCount: number;
  completedCount: number;
  onStart: () => void;
}

export function TodaySessionCard({
  wordCount,
  completedCount,
  onStart,
}: TodaySessionCardProps) {
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
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 14,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
        >
          Today
        </Text>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: "500",
            color: colors.textHint,
            fontVariant: ["tabular-nums"],
          }}
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
                backgroundColor:
                  i < completedCount ? colors.der : "rgba(44, 44, 44, 0.08)",
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
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: "500",
            color: "#FFFFFF",
          }}
        >
          {wordCount === 0 ? "Nessuna parola da ripassare" : "Start session"}
        </Text>
      </Pressable>
    </View>
  );
}
