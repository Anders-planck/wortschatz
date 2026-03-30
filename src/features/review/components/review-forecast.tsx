import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { toLocalDateStr } from "@/features/shared/utils/date";
import type {
  ForecastDay,
  ForecastBreakdown,
} from "../services/forecast-repository";

interface ReviewForecastProps {
  forecast: ForecastDay[];
  breakdown: ForecastBreakdown;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

const STATE_COLORS = {
  ready: { bg: "#EDF5ED", text: "#4A9A4A" },
  learning: { bg: "#FDF3E6", text: "#D4944A" },
  new: { bg: "#E8F0F8", text: "#7A9EC0" },
};

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

function formatTimeUntil(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (diffMs < 60_000) return "<1 min";
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  return `${hours}h`;
}

export function ReviewForecast({ forecast, breakdown }: ReviewForecastProps) {
  const { colors, textStyles } = useAppTheme();

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
    const dateStr = toLocalDateStr(d);
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

  const chips = [
    { count: breakdown.ready, label: "pronte", color: STATE_COLORS.ready },
    {
      count: breakdown.learning,
      label: "in corso",
      color: STATE_COLORS.learning,
    },
    { count: breakdown.newCount, label: "nuove", color: STATE_COLORS.new },
  ].filter((c) => c.count > 0);

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

        {/* State breakdown chips */}
        {chips.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {chips.map((chip) => (
              <View
                key={chip.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: chip.color.bg,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: chip.color.text,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 11,
                    fontWeight: "600",
                    color: chip.color.text,
                  }}
                >
                  {chip.count} {chip.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 7-day forecast grid */}
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

        {/* Next session hint */}
        {breakdown.learning > 0 && breakdown.nextLearningDue && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              padding: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderCurve: "continuous",
              backgroundColor: STATE_COLORS.learning.bg,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: STATE_COLORS.learning.text,
                opacity: 0.7,
              }}
            />
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                fontWeight: "500",
                color: STATE_COLORS.learning.text,
                flex: 1,
              }}
            >
              Prossima sessione tra {formatTimeUntil(breakdown.nextLearningDue)}{" "}
              — {breakdown.learning}{" "}
              {breakdown.learning === 1 ? "parola" : "parole"} in apprendimento
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
