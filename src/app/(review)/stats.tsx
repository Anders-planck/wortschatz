import { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import { useThemeColors } from "@/features/shared/theme/theme-context";
import { StatsCard } from "@/features/review/components/stats-card";
import { useSettings } from "@/features/settings/hooks/use-settings";
import {
  getDetailedStats,
  type WordStats,
} from "@/features/review/services/stats-repository";
import { getStudyStreak } from "@/features/review/services/activity-repository";

export default function StatsScreen() {
  const colors = useThemeColors();
  const [stats, setStats] = useState<WordStats | null>(null);
  const [streak, setStreak] = useState(0);
  const { settings } = useSettings();

  useFocusEffect(
    useCallback(() => {
      Promise.all([getDetailedStats(), getStudyStreak()]).then(([s, str]) => {
        setStats(s);
        setStreak(str);
      });
    }, []),
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        {stats && (
          <StatsCard
            stats={stats}
            dailyGoal={settings.dailyGoal}
            streak={streak}
          />
        )}
      </ScrollView>

      <Stack.Screen options={{ title: "Statistiche" }} />
    </>
  );
}
