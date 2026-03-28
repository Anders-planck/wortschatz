import { useMemo } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type {
  MasteryLevel,
  WordStats,
} from "@/features/review/services/stats-repository";

// ─── Label/Color Maps ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  noun: "Nomi",
  verb: "Verbi",
  adjective: "Aggettivi",
  adverb: "Avverbi",
  preposition: "Preposizioni",
};

const TYPE_SHORT: Record<string, string> = {
  noun: "Nomi",
  verb: "Verbi",
  adjective: "Agg.",
  adverb: "Avv.",
  preposition: "Prep.",
};

const TYPE_COLORS: Record<string, string> = {
  noun: "#D4B97A",
  verb: "#C0B8E0",
  adjective: "#E0B8AE",
  adverb: "#A8C0D0",
  preposition: "#A8C0D0",
};

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  Padroneggiato: "#6AAF6A",
  Buono: "#8DB58A",
  "In progresso": "#C4A96A",
  "Da ripassare": "#D4AAA0",
  Difficile: "#C07060",
};

const EXERCISE_LABELS: Record<string, string> = {
  fill: "Completa",
  dictation: "Dettato",
  cases: "Articoli & Casi",
};

const EXERCISE_SHORT: Record<string, string> = {
  fill: "Completa",
  dictation: "Dettato",
  cases: "Casi",
};

const EXERCISE_COLORS: Record<string, string> = {
  fill: "#6AAF6A",
  dictation: "#C4A96A",
  cases: "#8DB58A",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

interface CalendarDay {
  day: string;
  count: number;
  isFuture: boolean;
}

function buildCalendarDays(
  activity: { day: string; count: number }[],
): CalendarDay[] {
  const countByDay = new Map(activity.map((a) => [a.day, a.count]));
  const days: CalendarDay[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = formatDateKey(d);
    days.push({ day: key, count: countByDay.get(key) ?? 0, isFuture: false });
  }

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

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "ora";
  if (diffMin < 60) return `${diffMin}m fa`;
  if (diffHr < 24) return `${diffHr}h fa`;
  if (diffDay === 1) return "ieri";
  return `${diffDay}g fa`;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsCardProps {
  stats: WordStats;
  dailyGoal: number;
  streak: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBadge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 6,
        borderCurve: "continuous",
        paddingHorizontal: 7,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{
          fontFamily: "UbuntuSansMono",
          fontSize: 10,
          fontWeight: "600",
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StatsCard({ stats, dailyGoal, streak }: StatsCardProps) {
  const { colors, textStyles } = useAppTheme();

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  // ── 1. Hero Row data
  const heroCards = [
    { label: "Parole", value: String(stats.totalWords), color: "#D4A44A" },
    { label: "Streak", value: `${streak}d`, color: "#E0B8AE" },
    {
      label: "Precisione",
      value: `${stats.overallAccuracy}%`,
      color: "#6AAF6A",
    },
    { label: "Oggi", value: String(stats.activitiesToday), color: "#C4A96A" },
  ];

  // ── 2. Score Trend chart
  const chartWidth = 320;
  const chartHeight = 90;
  const chartPadX = 8;
  const chartPadY = 8;
  const scoreMin = -5;
  const scoreMax = 10;

  const trendPoints = useMemo(() => {
    if (stats.scoreTrend.length === 0) return [];
    const n = stats.scoreTrend.length;
    return stats.scoreTrend.map((pt, i) => {
      const x =
        chartPadX + (i / Math.max(n - 1, 1)) * (chartWidth - chartPadX * 2);
      const norm = (pt.avgScore - scoreMin) / (scoreMax - scoreMin);
      const y =
        chartPadY +
        (1 - Math.max(0, Math.min(1, norm))) * (chartHeight - chartPadY * 2);
      return { x, y };
    });
  }, [stats.scoreTrend]);

  const linePath = useMemo(() => smoothPath(trendPoints), [trendPoints]);
  const areaPath = useMemo(() => {
    if (trendPoints.length < 2) return "";
    const bottom = chartHeight - chartPadY;
    return (
      linePath +
      ` L${trendPoints[trendPoints.length - 1].x},${bottom}` +
      ` L${trendPoints[0].x},${bottom} Z`
    );
  }, [linePath, trendPoints]);

  const trendChange = useMemo(() => {
    if (stats.scoreTrend.length < 2) return null;
    const first = stats.scoreTrend[0].avgScore;
    const last = stats.scoreTrend[stats.scoreTrend.length - 1].avgScore;
    return Math.round((last - first) * 10) / 10;
  }, [stats.scoreTrend]);

  const trendFirstLabel =
    stats.scoreTrend.length > 0
      ? stats.scoreTrend[0].day.slice(5).replace("-", "/")
      : "";
  const trendMidLabel =
    stats.scoreTrend.length > 2
      ? stats.scoreTrend[Math.floor(stats.scoreTrend.length / 2)].day
          .slice(5)
          .replace("-", "/")
      : "";

  // ── 3. Monthly Activity bars
  const last30 = useMemo(() => {
    const countByDay = new Map(
      stats.monthlyActivity.map((a) => [a.day, a.count]),
    );
    const days: { day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = formatDateKey(d);
      days.push({ day: key, count: countByDay.get(key) ?? 0 });
    }
    return days;
  }, [stats.monthlyActivity]);

  const maxDayCount = useMemo(
    () => Math.max(...last30.map((d) => d.count), 1),
    [last30],
  );

  const actFirstLabel =
    last30.length > 0 ? last30[0].day.slice(5).replace("-", "/") : "";
  const actMidLabel =
    last30.length > 14 ? last30[14].day.slice(5).replace("-", "/") : "";

  // ── 4. Mastery Donut
  const totalMastery = useMemo(
    () => stats.masteryDistribution.reduce((s, m) => s + m.count, 0),
    [stats.masteryDistribution],
  );
  const masteryPct =
    stats.totalWords > 0
      ? Math.round(
          Math.max(0, Math.min(100, ((stats.averageScore + 5) / 15) * 100)),
        )
      : 0;

  const DONUT_SIZE = 90;
  const DONUT_R = 33;
  const DONUT_CX = DONUT_SIZE / 2;
  const DONUT_CY = DONUT_SIZE / 2;
  const STROKE_W = 10;
  const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

  const donutSegments = useMemo(() => {
    const total = totalMastery === 0 ? 1 : totalMastery;
    let offset = 0;
    const gap = 2;
    return stats.masteryDistribution
      .filter((m) => m.count > 0)
      .map((m) => {
        const dashLen = (m.count / total) * CIRCUMFERENCE - gap;
        const seg = { ...m, dashLen: Math.max(dashLen, 0), offset };
        offset += (m.count / total) * CIRCUMFERENCE;
        return seg;
      });
  }, [stats.masteryDistribution, totalMastery]);

  // ── 5. By Type bars
  const maxTypeCount = useMemo(
    () => Math.max(...stats.byType.map((t) => t.count), 1),
    [stats.byType],
  );

  // ── 6. Exercise bars
  const maxExerciseAcc = 100;

  // ── 7. Weekly bars
  const weekBars = useMemo(() => {
    const countByDay = new Map(
      stats.monthlyActivity.map((a) => [a.day, a.count]),
    );
    const days: { label: string; day: string; count: number }[] = [];
    const labels = ["L", "M", "M", "G", "V", "S", "D"];
    const now = new Date();
    // last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = formatDateKey(d);
      const dow = d.getDay(); // 0=Sun
      const labelIdx = dow === 0 ? 6 : dow - 1;
      days.push({
        label: labels[labelIdx],
        day: key,
        count: countByDay.get(key) ?? 0,
      });
    }
    return days;
  }, [stats.monthlyActivity]);

  const maxWeekCount = useMemo(
    () => Math.max(...weekBars.map((b) => b.count), 1),
    [weekBars],
  );
  const weekTotal = weekBars.reduce((s, b) => s + b.count, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ gap: 16 }}>
      {/* ── 1. Hero Row ── */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {heroCards.map((card) => (
          <View
            key={card.label}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 14,
              borderCurve: "continuous",
              padding: 14,
              alignItems: "center",
              gap: 5,
            }}
          >
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 22,
                fontWeight: "700",
                color: card.color,
                fontVariant: ["tabular-nums"],
              }}
            >
              {card.value}
            </Text>
            <Text
              style={[
                textStyles.monoLabel,
                { fontSize: 8, color: colors.textMuted },
              ]}
            >
              {card.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── 2. Score Trend Area Chart ── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[
              textStyles.body,
              { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
            ]}
          >
            Punteggio medio
          </Text>
          {trendChange !== null && (
            <View
              style={{
                backgroundColor: trendChange >= 0 ? "#6AAF6A22" : "#C0706022",
                borderRadius: 6,
                borderCurve: "continuous",
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 11,
                  fontWeight: "600",
                  color: trendChange >= 0 ? "#6AAF6A" : "#C07060",
                }}
              >
                {trendChange >= 0 ? "+" : ""}
                {trendChange}
              </Text>
            </View>
          )}
        </View>

        {stats.scoreTrend.length < 2 ? (
          <View
            style={{
              height: chartHeight,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={[
                textStyles.mono,
                { fontSize: 12, color: colors.textMuted },
              ]}
            >
              Nessun dato
            </Text>
          </View>
        ) : (
          <View>
            <Svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <Defs>
                <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0%"
                    stopColor={colors.accent}
                    stopOpacity="0.35"
                  />
                  <Stop
                    offset="100%"
                    stopColor={colors.accent}
                    stopOpacity="0"
                  />
                </LinearGradient>
              </Defs>

              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((frac) => {
                const gy = chartPadY + frac * (chartHeight - chartPadY * 2);
                return (
                  <Line
                    key={frac}
                    x1={chartPadX}
                    y1={gy}
                    x2={chartWidth - chartPadX}
                    y2={gy}
                    stroke={colors.border}
                    strokeWidth="1"
                    strokeDasharray="3,4"
                    opacity="0.5"
                  />
                );
              })}

              {/* Area fill */}
              <Path d={areaPath} fill="url(#trendGrad)" />

              {/* Line */}
              <Path
                d={linePath}
                fill="none"
                stroke={colors.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Last dot */}
              {trendPoints.length > 0 && (
                <Circle
                  cx={trendPoints[trendPoints.length - 1].x}
                  cy={trendPoints[trendPoints.length - 1].y}
                  r="4"
                  fill={colors.accent}
                />
              )}
            </Svg>

            {/* X labels */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text
                style={[
                  textStyles.mono,
                  { fontSize: 9, color: colors.textMuted },
                ]}
              >
                {trendFirstLabel}
              </Text>
              {trendMidLabel !== "" && (
                <Text
                  style={[
                    textStyles.mono,
                    { fontSize: 9, color: colors.textMuted },
                  ]}
                >
                  {trendMidLabel}
                </Text>
              )}
              <Text
                style={[textStyles.mono, { fontSize: 9, color: colors.accent }]}
              >
                oggi
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── 3. Daily Activity Bar Chart ── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[
              textStyles.body,
              { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
            ]}
          >
            Attivita giornaliera
          </Text>
          <SectionBadge
            label="30gg"
            color={colors.textSecondary}
            bg={colors.cream}
          />
        </View>

        <View style={{ height: 56 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 3,
              height: 48,
              alignItems: "flex-end",
            }}
          >
            {last30.map((bar) => {
              const isToday = bar.day === todayKey;
              const heightPct = bar.count / maxDayCount;
              const barH = Math.max(4, heightPct * 48);
              const opacity = isToday
                ? 1
                : bar.count > 0
                  ? 0.4 + heightPct * 0.5
                  : 0.15;
              return (
                <View
                  key={bar.day}
                  style={{
                    flex: 1,
                    height: barH,
                    backgroundColor: colors.accent,
                    borderRadius: 3,
                    borderCurve: "continuous",
                    opacity,
                    ...(isToday
                      ? {
                          shadowColor: colors.accent,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.7,
                          shadowRadius: 6,
                        }
                      : {}),
                  }}
                />
              );
            })}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[textStyles.mono, { fontSize: 9, color: colors.textMuted }]}
          >
            {actFirstLabel}
          </Text>
          {actMidLabel !== "" && (
            <Text
              style={[
                textStyles.mono,
                { fontSize: 9, color: colors.textMuted },
              ]}
            >
              {actMidLabel}
            </Text>
          )}
          <Text
            style={[textStyles.mono, { fontSize: 9, color: colors.accent }]}
          >
            oggi
          </Text>
        </View>
      </View>

      {/* ── 4. Mastery Donut ── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          gap: 12,
        }}
      >
        <Text
          style={[
            textStyles.body,
            { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
          ]}
        >
          Padronanza
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {/* Donut SVG */}
          <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
            {/* Background track */}
            <Circle
              cx={DONUT_CX}
              cy={DONUT_CY}
              r={DONUT_R}
              fill="none"
              stroke={colors.cream}
              strokeWidth={STROKE_W}
            />

            {/* Segments */}
            {donutSegments.map((seg) => (
              <Circle
                key={seg.level}
                cx={DONUT_CX}
                cy={DONUT_CY}
                r={DONUT_R}
                fill="none"
                stroke={MASTERY_COLORS[seg.level]}
                strokeWidth={STROKE_W}
                strokeDasharray={`${seg.dashLen} ${CIRCUMFERENCE}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                rotation={-90}
                origin={`${DONUT_CX},${DONUT_CY}`}
              />
            ))}

            {/* Center text */}
            <SvgText
              x={DONUT_CX}
              y={DONUT_CY + 2}
              textAnchor="middle"
              fontSize="18"
              fontWeight="800"
              fill={colors.textPrimary}
            >
              {masteryPct} %
            </SvgText>
            <SvgText
              x={DONUT_CX}
              y={DONUT_CY + 14}
              textAnchor="middle"
              fontSize="7"
              fill={colors.textHint}
              letterSpacing="1"
            >
              MEDIA
            </SvgText>
          </Svg>

          {/* Legend */}
          <View style={{ flex: 1, gap: 6 }}>
            {stats.masteryDistribution.map((m) => (
              <View
                key={m.level}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      MASTERY_COLORS[m.level] ?? colors.textMuted,
                  }}
                />
                <Text
                  style={[
                    textStyles.body,
                    {
                      fontSize: 12,
                      color: colors.textSecondary,
                      flex: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {m.level}
                </Text>
                <Text
                  style={[
                    textStyles.mono,
                    {
                      fontSize: 11,
                      color: colors.textPrimary,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {m.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 5. Per Tipo — Vertical Bar Chart ── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[
              textStyles.body,
              { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
            ]}
          >
            Per tipo
          </Text>
          <SectionBadge
            label={String(stats.totalWords)}
            color={colors.accent}
            bg={`${colors.accent}1A`}
          />
        </View>

        <View style={{ height: 130 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              height: 110,
            }}
          >
            {stats.byType.map((item) => {
              const barH = Math.max(4, (item.count / maxTypeCount) * 90);
              const col = TYPE_COLORS[item.type] ?? colors.accent;
              return (
                <View
                  key={item.type}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: 110,
                  }}
                >
                  {/* Value label */}
                  <Text
                    style={[
                      textStyles.mono,
                      {
                        fontSize: 11,
                        fontWeight: "700",
                        color: col,
                        marginBottom: 4,
                        fontVariant: ["tabular-nums"],
                      },
                    ]}
                  >
                    {item.count}
                  </Text>
                  {/* Bar */}
                  <View
                    style={{
                      width: "100%",
                      height: barH,
                      backgroundColor: col,
                      borderRadius: 6,
                      borderCurve: "continuous",
                      borderBottomLeftRadius: 3,
                      borderBottomRightRadius: 3,
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* Type labels */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 6,
            }}
          >
            {stats.byType.map((item) => (
              <View key={item.type} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={[
                    textStyles.mono,
                    {
                      fontSize: 9,
                      color: colors.textMuted,
                      textAlign: "center",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {TYPE_SHORT[item.type] ?? item.type}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 6. Esercizi — Vertical Bar Chart (accuracy %) ── */}
      {stats.exerciseBreakdown.length > 0 && (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={[
                textStyles.body,
                { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
              ]}
            >
              Esercizi
            </Text>
            <SectionBadge
              label={`${stats.overallAccuracy}%`}
              color="#6AAF6A"
              bg="#6AAF6A22"
            />
          </View>

          <View style={{ height: 130 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 12,
                height: 110,
              }}
            >
              {stats.exerciseBreakdown.map((item) => {
                const barH = Math.max(4, (item.accuracy / maxExerciseAcc) * 90);
                const col = EXERCISE_COLORS[item.type] ?? colors.accent;
                return (
                  <View
                    key={item.type}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: 110,
                    }}
                  >
                    <Text
                      style={[
                        textStyles.mono,
                        {
                          fontSize: 11,
                          fontWeight: "700",
                          color: col,
                          marginBottom: 4,
                          fontVariant: ["tabular-nums"],
                        },
                      ]}
                    >
                      {item.accuracy}%
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        height: barH,
                        backgroundColor: col,
                        borderRadius: 6,
                        borderCurve: "continuous",
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 6,
              }}
            >
              {stats.exerciseBreakdown.map((item) => (
                <View key={item.type} style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={[
                      textStyles.mono,
                      {
                        fontSize: 9,
                        color: colors.textMuted,
                        textAlign: "center",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {EXERCISE_SHORT[item.type] ?? item.type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── 7. Weekly Bar Chart ── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[
              textStyles.body,
              { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
            ]}
          >
            Questa settimana
          </Text>
          <SectionBadge
            label={String(weekTotal)}
            color={colors.accent}
            bg={`${colors.accent}1A`}
          />
        </View>

        <View style={{ height: 100 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 6,
              height: 80,
            }}
          >
            {weekBars.map((bar) => {
              const isToday = bar.day === todayKey;
              const isFuture = bar.day > todayKey;
              const barH = isFuture
                ? 4
                : Math.max(4, (bar.count / maxWeekCount) * 72);
              const opacity = isToday ? 1 : isFuture ? 0.15 : 0.65;

              return (
                <View
                  key={bar.day}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    height: 80,
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: barH,
                      backgroundColor: isFuture ? "transparent" : colors.accent,
                      borderRadius: 6,
                      borderCurve: "continuous",
                      borderBottomLeftRadius: 3,
                      borderBottomRightRadius: 3,
                      opacity,
                      borderWidth: isFuture ? 1 : 0,
                      borderColor: isFuture
                        ? `${colors.accent}40`
                        : "transparent",
                      borderStyle: isFuture ? "dashed" : "solid",
                      ...(isToday
                        ? {
                            shadowColor: colors.accent,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.65,
                            shadowRadius: 8,
                          }
                        : {}),
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* Day labels */}
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginTop: 6,
            }}
          >
            {weekBars.map((bar) => {
              const isToday = bar.day === todayKey;
              return (
                <View key={bar.day} style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={[
                      textStyles.mono,
                      {
                        fontSize: 10,
                        fontWeight: isToday ? "700" : "400",
                        color: isToday ? colors.accent : colors.textMuted,
                      },
                    ]}
                  >
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── 8. Recent Activity ── */}
      <View style={{ gap: 10 }}>
        <Text style={textStyles.monoLabel}>ATTIVITA RECENTE</Text>
        {stats.recentActivity.length === 0 ? (
          <Text
            style={[textStyles.body, { fontSize: 13, color: colors.textMuted }]}
          >
            Nessuna attivita registrata
          </Text>
        ) : (
          stats.recentActivity.map((item, idx) => {
            const badgeLabel =
              item.activityType === "review"
                ? "Ripasso"
                : (EXERCISE_LABELS[item.exerciseType ?? ""] ??
                  item.exerciseType ??
                  "Esercizio");

            return (
              <View
                key={`${item.createdAt}-${idx}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Image
                  source={
                    item.isCorrect
                      ? "sf:checkmark.circle.fill"
                      : "sf:xmark.circle.fill"
                  }
                  style={{ width: 18, height: 18 }}
                  tintColor={item.isCorrect ? "#6AAF6A" : "#C07060"}
                />
                <Text
                  style={[
                    textStyles.body,
                    {
                      fontSize: 13,
                      color: colors.textPrimary,
                      flex: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.term}
                </Text>
                <View
                  style={{
                    backgroundColor: `${colors.accent}20`,
                    borderRadius: 6,
                    borderCurve: "continuous",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={[
                      textStyles.mono,
                      { fontSize: 9, color: colors.accent },
                    ]}
                  >
                    {badgeLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    textStyles.mono,
                    {
                      fontSize: 10,
                      color: colors.textMuted,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {relativeTime(item.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
