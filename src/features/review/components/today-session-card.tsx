import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface TodaySessionCardProps {
  wordCount: number;
  readyCount: number;
  newCount: number;
  onStart: () => void;
}

const DOT_COLORS = {
  ready: "#4A9A4A",
  new: "#7A9EC0",
};

export function TodaySessionCard({
  wordCount,
  readyCount,
  newCount,
  onStart,
}: TodaySessionCardProps) {
  const { colors, textStyles } = useAppTheme();
  const readyCapped = Math.min(readyCount, wordCount);
  const newCapped = Math.min(newCount, wordCount - readyCapped);
  const dots = [
    ...Array.from({ length: readyCapped }, () => "ready" as const),
    ...Array.from({ length: newCapped }, () => "new" as const),
  ];

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
          Oggi
        </Text>
        <Text
          style={[
            textStyles.mono,
            { fontSize: 10, fontVariant: ["tabular-nums"] },
          ]}
        >
          {wordCount} parole
        </Text>
      </View>

      {wordCount > 0 && (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {readyCapped > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: DOT_COLORS.ready,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 10,
                    fontWeight: "500",
                    color: DOT_COLORS.ready,
                  }}
                >
                  {readyCapped} pronte
                </Text>
              </View>
            )}
            {newCapped > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: DOT_COLORS.new,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 10,
                    fontWeight: "500",
                    color: DOT_COLORS.new,
                  }}
                >
                  {newCapped} nuove
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
            {dots.map((type, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: DOT_COLORS[type],
                  opacity: 0.25,
                }}
              />
            ))}
          </View>
        </>
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
          {wordCount === 0 ? "Nessuna parola da ripassare" : "Inizia sessione"}
        </Text>
      </Pressable>
    </View>
  );
}
