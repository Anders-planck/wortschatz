import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import type { Word } from "@/features/dictionary/types";
import {
  getWordsForReview,
  getTrickyWords,
  getWordCount,
} from "@/features/shared/db/words-repository";
import {
  getStudyStreak,
  getWeeklyActivityFromLog,
  getActivityToday,
} from "@/features/review/services/activity-repository";
import {
  getReviewForecast,
  type ForecastDay,
} from "@/features/review/services/forecast-repository";

interface DashboardData {
  wordsToReview: Word[];
  trickyWords: Word[];
  totalCount: number;
  weeklyActivity: number[];
  streak: number;
  activitiesToday: number;
  forecast: ForecastDay[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useReviewDashboard(): DashboardData {
  const [wordsToReview, setWordsToReview] = useState<Word[]>([]);
  const [trickyWords, setTrickyWords] = useState<Word[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [streak, setStreak] = useState(0);
  const [activitiesToday, setActivitiesToday] = useState(0);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        reviewWords,
        tricky,
        count,
        weekly,
        currentStreak,
        todayCount,
        forecastData,
      ] = await Promise.all([
        getWordsForReview(12),
        getTrickyWords(8),
        getWordCount(),
        getWeeklyActivityFromLog(),
        getStudyStreak(),
        getActivityToday(),
        getReviewForecast(),
      ]);
      setWordsToReview(reviewWords);
      setTrickyWords(tricky);
      setTotalCount(count);
      setWeeklyActivity(weekly);
      setStreak(currentStreak);
      setActivitiesToday(todayCount);
      setForecast(forecastData);
    } catch {
      // Silent failure — dashboard shows empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    wordsToReview,
    trickyWords,
    totalCount,
    weeklyActivity,
    streak,
    activitiesToday,
    forecast,
    isLoading,
    refresh,
  };
}
