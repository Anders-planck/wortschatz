import { Text, View } from "react-native";
import { SectionTitle } from "@/features/shared/components/section-title";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

const ALL_LABELS = ["D", "L", "M", "M", "G", "V", "S"];

interface WeeklyChartProps {
  data: number[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { colors, textStyles } = useAppTheme();
  const maxValue = Math.max(...data, 1);
  const todayIndex = 6; // last item is always today

  // Build labels for last 7 days ending today
  const now = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    return ALL_LABELS[d.getDay()];
  });

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Questa settimana</SectionTitle>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 6,
          height: 80,
        }}
      >
        {data.map((value, i) => {
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const isToday = i === todayIndex;

          return (
            <View
              key={i}
              style={{ flex: 1, alignItems: "center", gap: 6, height: "100%" }}
            >
              <View
                style={{
                  flex: 1,
                  width: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: `${Math.max(heightPercent, 4)}%`,
                    backgroundColor: colors.textPrimary,
                    borderRadius: 3,
                    borderCurve: "continuous",
                    opacity: value > 0 ? (isToday ? 1 : 0.4) : 0.08,
                    minHeight: 3,
                  }}
                />
              </View>
              <Text
                style={[
                  textStyles.mono,
                  {
                    fontSize: 8,
                    fontWeight: isToday ? "700" : "400",
                    color: isToday ? colors.textPrimary : colors.textHint,
                  },
                ]}
              >
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
