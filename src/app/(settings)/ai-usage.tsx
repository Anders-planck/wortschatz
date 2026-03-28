import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import {
  getUsageByPeriod,
  getUsageSummary,
  getUsageByFeature,
  getCurrentMonthCost,
  type UsageDayPoint,
  type UsageSummary,
  type FeatureUsage,
} from "@/features/settings/services/ai-usage-repository";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { AiBudgetCard } from "@/features/settings/components/ai-budget-card";
import { AiUsageChart } from "@/features/settings/components/ai-usage-chart";
import { AiUsageSummaryRow } from "@/features/settings/components/ai-usage-summary";
import { AiUsageBreakdown } from "@/features/settings/components/ai-usage-breakdown";

const PERIODS = [
  { label: "7g", days: 7 },
  { label: "30g", days: 30 },
  { label: "Tutto", days: null },
] as const;

function groupFeatures(features: FeatureUsage[]): FeatureUsage[] {
  const vocabFeatures = ["enrichment", "synonyms", "word_family"];
  const vocabGroup: FeatureUsage = {
    feature: "enrichment",
    cost: 0,
    tokens: 0,
    calls: 0,
  };
  const result: FeatureUsage[] = [];

  for (const f of features) {
    if (vocabFeatures.includes(f.feature)) {
      vocabGroup.cost += f.cost;
      vocabGroup.tokens += f.tokens;
      vocabGroup.calls += f.calls;
    } else {
      result.push(f);
    }
  }

  if (vocabGroup.calls > 0) result.push(vocabGroup);
  return result.sort((a, b) => b.cost - a.cost);
}

export default function AiUsageScreen() {
  const { colors, textStyles } = useAppTheme();
  const { settings, updateSetting } = useSettings();
  const [periodIdx, setPeriodIdx] = useState(1);
  const [chartData, setChartData] = useState<UsageDayPoint[]>([]);
  const [summary, setSummary] = useState<UsageSummary>({
    totalCost: 0,
    totalTokens: 0,
    totalCalls: 0,
  });
  const [features, setFeatures] = useState<FeatureUsage[]>([]);
  const [monthCost, setMonthCost] = useState(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const budget =
    ((settings as unknown as Record<string, unknown>)
      .aiMonthlyBudget as number) ?? 5;
  const period = PERIODS[periodIdx];

  const loadData = useCallback(async () => {
    const days = period.days;
    const [chart, sum, feat, month] = await Promise.all([
      getUsageByPeriod(days),
      getUsageSummary(days),
      getUsageByFeature(days),
      getCurrentMonthCost(),
    ]);
    setChartData(chart);
    setSummary(sum);
    setFeatures(groupFeatures(feat));
    setMonthCost(month);
  }, [period.days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      updateSetting("aiMonthlyBudget" as keyof typeof settings, val as never);
    }
    setEditingBudget(false);
  };

  const grouped = groupFeatures(features.length > 0 ? features : []);
  const averageCost = summary.totalCost / Math.max(chartData.length, 1);

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Budget */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <AiBudgetCard
            monthCost={monthCost}
            budget={budget}
            editing={editingBudget}
            budgetInput={budgetInput}
            onToggleEdit={() => {
              setBudgetInput(String(budget));
              setEditingBudget(!editingBudget);
            }}
            onInputChange={setBudgetInput}
            onSave={handleSaveBudget}
          />
        </Animated.View>

        {/* Period selector */}
        <Animated.View entering={FadeInUp.delay(50).duration(300)}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              borderRadius: 10,
              borderCurve: "continuous",
              padding: 3,
              gap: 2,
            }}
          >
            {PERIODS.map((p, i) => (
              <Pressable
                key={p.label}
                onPress={() => setPeriodIdx(i)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  alignItems: "center",
                  backgroundColor:
                    i === periodIdx ? colors.accentLight : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 12,
                    fontWeight: i === periodIdx ? "600" : "500",
                    color: i === periodIdx ? colors.accent : colors.textMuted,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Chart */}
        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <AiUsageChart data={chartData} averageCost={averageCost} />
        </Animated.View>

        {/* Summary */}
        <Animated.View entering={FadeInUp.delay(150).duration(300)}>
          <AiUsageSummaryRow summary={summary} />
        </Animated.View>

        {/* Breakdown */}
        {grouped.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(300)}>
            <AiUsageBreakdown features={grouped} />
          </Animated.View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: "Uso AI" }} />
    </>
  );
}
