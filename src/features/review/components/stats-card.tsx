import { useMemo } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type {
  MasteryLevel,
  WordStats,
} from "@/features/review/services/stats-repository";

const TYPE_LABELS: Record<string, string> = {
  noun: "Nomi",
  verb: "Verbi",
  adjective: "Aggettivi",
  adverb: "Avverbi",
  preposition: "Preposizioni",
};

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  Padroneggiato: "#6AAF6A",
  Buono: "#8DB58A",
  "In progresso": "#C4A96A",
  "Da ripassare": "#D4AAA0",
  Difficile: "#C07060",
};

interface StatsCardProps {
  stats: WordStats;
  dailyGoal: number;
}

interface CalendarDay {
  day: string;
  count: number;
  isFuture: boolean;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function buildCalendarDays(
  activity: { day: string; count: number }[],
): CalendarDay[] {
  const countByDay = new Map(activity.map((a) => [a.day, a.count]));
  const days: CalendarDay[] = [];
  const now = new Date();
  const todayKey = formatDateKey(now);

  // Past 30 days including today
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = formatDateKey(d);
    days.push({ day: key, count: countByDay.get(key) ?? 0, isFuture: false });
  }

  // Remaining days until end of month
  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  for (let d = now.getDate() + 1; d <= lastDayOfMonth; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    days.push({ day: formatDateKey(date), count: 0, isFuture: true });
  }

  return days;
}

export function StatsCard({ stats, dailyGoal }: StatsCardProps) {
  const { colors, textStyles } = useAppTheme();

  const maxTypeCount = Math.max(...stats.byType.map((t) => t.count), 1);
  const calendarDays = useMemo(
    () => buildCalendarDays(stats.monthlyActivity),
    [stats.monthlyActivity],
  );
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  return (
    <View style={{ gap: 24 }}>
      {/* Summary numbers */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[
          { label: "Parole", value: stats.totalWords },
          { label: "Oggi", value: stats.wordsReviewedToday },
          { label: "Punteggio", value: stats.averageScore.toFixed(1) },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 14,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 24,
                fontWeight: "700",
                color: colors.textPrimary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {item.value}
            </Text>
            <Text style={[textStyles.monoLabel, { fontSize: 8 }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Word type distribution */}
      <View style={{ gap: 10 }}>
        <Text style={textStyles.monoLabel}>PER TIPO</Text>
        {stats.byType.map((item) => {
          const pct = (item.count / maxTypeCount) * 100;
          return (
            <View key={item.type} style={{ gap: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    textStyles.body,
                    { fontSize: 13, color: colors.textPrimary },
                  ]}
                >
                  {TYPE_LABELS[item.type] ?? item.type}
                </Text>
                <Text
                  style={[
                    textStyles.mono,
                    { fontVariant: ["tabular-nums"], fontSize: 12 },
                  ]}
                >
                  {item.count}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.cream,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    backgroundColor: colors.accent,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Mastery levels */}
      <View style={{ gap: 10 }}>
        <Text style={textStyles.monoLabel}>LIVELLO DI PADRONANZA</Text>
        <View style={{ flexDirection: "row", gap: 4, height: 28 }}>
          {stats.masteryDistribution.map((item) => {
            const pct =
              stats.totalWords > 0 ? (item.count / stats.totalWords) * 100 : 0;
            if (pct < 1) return null;
            return (
              <View
                key={item.level}
                style={{
                  flex: pct,
                  backgroundColor:
                    MASTERY_COLORS[item.level] ?? colors.textMuted,
                  borderRadius: 6,
                  borderCurve: "continuous",
                  justifyContent: "center",
                  alignItems: "center",
                  minWidth: 24,
                }}
              >
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 8,
                    fontWeight: "700",
                    color: colors.card,
                  }}
                >
                  {item.count}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {stats.masteryDistribution.map((item) => (
            <View
              key={item.level}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    MASTERY_COLORS[item.level] ?? colors.textMuted,
                }}
              />
              <Text style={[textStyles.mono, { fontSize: 9 }]}>
                {item.level}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Monthly activity heatmap — 7 columns grid */}
      <View style={{ gap: 10 }}>
        <Text style={textStyles.monoLabel}>ULTIMO MESE</Text>
        <View style={{ gap: 4 }}>
          {(() => {
            const rows: CalendarDay[][] = [];
            for (let i = 0; i < calendarDays.length; i += 7) {
              rows.push(calendarDays.slice(i, i + 7));
            }
            return rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: 4 }}>
                {row.map((item) => {
                  const intensity = Math.min(item.count / dailyGoal, 1);
                  const dd = item.day.slice(8, 10);
                  const mm = item.day.slice(5, 7);
                  const isToday = item.day === todayKey;

                  const cellBg = item.isFuture
                    ? `${colors.border}40`
                    : item.count > 0
                      ? `${colors.accent}${Math.round(
                          (0.2 + intensity * 0.8) * 255,
                        )
                          .toString(16)
                          .padStart(2, "0")}`
                      : colors.cream;

                  const textColor = item.isFuture
                    ? `${colors.textGhost}80`
                    : item.count > 0
                      ? colors.card
                      : colors.textGhost;

                  return (
                    <View
                      key={item.day}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: 8,
                        borderCurve: "continuous",
                        backgroundColor: cellBg,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: isToday ? 1.5 : item.isFuture ? 1 : 0,
                        borderColor: isToday
                          ? colors.accent
                          : item.isFuture
                            ? `${colors.border}30`
                            : "transparent",
                        borderStyle: item.isFuture ? "dashed" : "solid",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: textStyles.mono.fontFamily,
                          fontSize: 10,
                          fontWeight: isToday ? "700" : "500",
                          color: textColor,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {dd}
                      </Text>
                      <Text
                        style={{
                          fontFamily: textStyles.mono.fontFamily,
                          fontSize: 7,
                          color: textColor,
                          opacity: 0.7,
                        }}
                      >
                        /{mm}
                      </Text>
                    </View>
                  );
                })}
                {row.length < 7 &&
                  Array.from({ length: 7 - row.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={{ flex: 1 }} />
                  ))}
              </View>
            ));
          })()}
        </View>
      </View>
    </View>
  );
}
