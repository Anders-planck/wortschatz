import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ForecastDay } from "../services/forecast-repository";

interface ReviewForecastProps {
  forecast: ForecastDay[];
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getColor(
  count: number,
  colors: {
    textGhost: string;
    success: string;
    accent: string;
    danger: string;
  },
): string {
  if (count === 0) return colors.textGhost;
  if (count <= 5) return colors.success;
  if (count <= 15) return colors.accent;
  return colors.danger;
}

export function ReviewForecast({ forecast }: ReviewForecastProps) {
  const { colors, textStyles } = useAppTheme();

  // Build 7-day array starting from today
  const today = new Date();
  const days: {
    label: string;
    date: string;
    count: number;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = localDateStr(d);
    const dayOfWeek = d.getDay();
    const found = forecast.find((f) => f.date === dateStr);
    days.push({
      label: i === 0 ? "Oggi" : DAY_LABELS[dayOfWeek],
      date: dateStr,
      count: found?.count ?? 0,
      isToday: i === 0,
    });
  }

  const totalUpcoming = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <Animated.View entering={FadeInUp.delay(60).duration(300)}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 18,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Prossime review
          </Text>
          <Text
            style={[
              textStyles.mono,
              {
                fontSize: 12,
                color: colors.textMuted,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {totalUpcoming} parole
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {days.map((day) => {
            const color = getColor(day.count, colors);
            return (
              <View
                key={day.date}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderCurve: "continuous",
                  backgroundColor: day.isToday
                    ? colors.accentLight
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 9,
                    fontWeight: "600",
                    color: day.isToday ? colors.accent : colors.textGhost,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {day.label}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 16,
                    fontWeight: "600",
                    color,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {day.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}
