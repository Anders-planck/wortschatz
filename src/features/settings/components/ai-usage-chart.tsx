import { Text, View } from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatCost } from "../utils/format-usage";
import type { UsageDayPoint } from "../services/ai-usage-repository";

interface AiUsageChartProps {
  data: UsageDayPoint[];
  averageCost: number;
}

const CHART_W = 320;
const CHART_H = 100;
const PAD_L = 30;
const PAD_R = 10;
const USABLE_W = CHART_W - PAD_L - PAD_R;

export function AiUsageChart({ data, averageCost }: AiUsageChartProps) {
  const { colors, textStyles } = useAppTheme();

  const maxCost = Math.max(...data.map((d) => d.cost), 0.001);

  const toX = (i: number) =>
    PAD_L +
    (data.length > 1 ? (i / (data.length - 1)) * USABLE_W : USABLE_W / 2);
  const toY = (cost: number) => CHART_H - (cost / maxCost) * (CHART_H - 10) - 5;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.cost)}`)
    .join(" ");

  const areaPath = `${linePath} L${toX(data.length - 1)},${CHART_H} L${toX(0)},${CHART_H} Z`;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderCurve: "continuous",
        padding: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
          Costo giornaliero
        </Text>
        {data.length > 0 && (
          <Text
            style={[
              textStyles.mono,
              {
                fontSize: 12,
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            media {formatCost(averageCost)}/g
          </Text>
        )}
      </View>

      {data.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 30 }}>
          <Text style={[textStyles.body, { color: colors.textGhost }]}>
            Nessun dato per questo periodo
          </Text>
        </View>
      ) : (
        <Svg
          width="100%"
          height={120}
          viewBox={`0 0 ${CHART_W} ${CHART_H + 15}`}
        >
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {/* Grid */}
          <Line
            x1={PAD_L}
            y1={CHART_H * 0.25}
            x2={CHART_W - PAD_R}
            y2={CHART_H * 0.25}
            stroke={colors.borderLight}
            strokeWidth={0.5}
          />
          <Line
            x1={PAD_L}
            y1={CHART_H * 0.5}
            x2={CHART_W - PAD_R}
            y2={CHART_H * 0.5}
            stroke={colors.borderLight}
            strokeWidth={0.5}
          />
          <Line
            x1={PAD_L}
            y1={CHART_H * 0.75}
            x2={CHART_W - PAD_R}
            y2={CHART_H * 0.75}
            stroke={colors.borderLight}
            strokeWidth={0.5}
          />
          {/* Y labels */}
          <SvgText
            x={2}
            y={CHART_H * 0.25 + 3}
            fill={colors.textGhost}
            fontSize={8}
            fontFamily={textStyles.mono.fontFamily}
          >
            {formatCost(maxCost * 0.75)}
          </SvgText>
          <SvgText
            x={2}
            y={CHART_H * 0.5 + 3}
            fill={colors.textGhost}
            fontSize={8}
            fontFamily={textStyles.mono.fontFamily}
          >
            {formatCost(maxCost * 0.5)}
          </SvgText>
          {/* Area + Line */}
          <Path d={areaPath} fill="url(#areaGrad)" />
          <Path
            d={linePath}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots */}
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={toX(i)}
              cy={toY(d.cost)}
              r={3.5}
              fill={colors.accent}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}
