import { Stack, useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { useReviewDashboard } from "@/features/review/hooks/use-review-dashboard";
import { DashboardGreeting } from "@/features/review/components/dashboard-greeting";
import { TodaySessionCard } from "@/features/review/components/today-session-card";
import { TrickyWordsList } from "@/features/review/components/tricky-words-list";
import { WeeklyChart } from "@/features/review/components/weekly-chart";

export default function ReviewScreen() {
  const router = useRouter();
  const { wordsToReview, trickyWords, totalCount, weeklyActivity, streak } =
    useReviewDashboard();

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 24 }}
        style={{ backgroundColor: colors.bg }}
      >
        <DashboardGreeting streak={streak} totalCount={totalCount} />
        <TodaySessionCard
          wordCount={wordsToReview.length}
          onStart={() => router.push("/(review)/session")}
        />
        <TrickyWordsList words={trickyWords} />
        <WeeklyChart data={weeklyActivity} />
      </ScrollView>

      <Stack.Screen.Title large>Ripasso</Stack.Screen.Title>
    </>
  );
}
