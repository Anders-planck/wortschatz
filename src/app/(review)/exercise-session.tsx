import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useExerciseSession } from "@/features/exercises/hooks/use-exercise-session";
import type { ExerciseType } from "@/features/exercises/types";
import { ExerciseProgress } from "@/features/exercises/components/exercise-progress";
import { ExerciseFeedback } from "@/features/exercises/components/exercise-feedback";
import { ExerciseSummary } from "@/features/exercises/components/exercise-summary";
import { FillBlankView } from "@/features/exercises/components/fill-blank-exercise";
import { DictationView } from "@/features/exercises/components/dictation-exercise";
import { CaseQuizView } from "@/features/exercises/components/case-quiz-exercise";

const TITLE_MAP: Record<ExerciseType, string> = {
  fill: "Completa",
  dictation: "Dettato",
  cases: "Articoli & Casi",
  mix: "Mix intelligente",
};

export default function ExerciseSessionScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const { exerciseType } = useLocalSearchParams<{
    exerciseType: ExerciseType;
  }>();

  const type: ExerciseType = exerciseType ?? "mix";
  const session = useExerciseSession();
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    session.start(type);
  }, []);

  const handleSubmit = async (answer: string) => {
    await session.submit(answer);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    session.advance();
  };

  const handleSkip = async () => {
    setShowFeedback(false);
    await session.skip();
  };

  const title = TITLE_MAP[type] ?? "Esercizi";

  if (session.phase === "loading") {
    return (
      <>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            backgroundColor: colors.bg,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            Generazione esercizi...
          </Text>
        </View>
        <Stack.Screen options={{ title }} />
      </>
    );
  }

  if (session.phase === "summary") {
    return (
      <>
        <ExerciseSummary
          results={session.results}
          correctCount={session.correctCount}
          errorCount={session.errorCount}
          durationSeconds={session.durationSeconds}
          onRetryErrors={session.retryErrors}
          onClose={() => router.back()}
        />
        <Stack.Screen options={{ title }} />
      </>
    );
  }

  const exercise = session.currentExercise;
  if (!exercise) return null;

  // The last submitted result (shown in feedback banner)
  const lastResult = showFeedback
    ? session.results[session.results.length - 1]
    : null;

  let correctAnswer: string;
  let hint: string | undefined;

  if (exercise.type === "fill") {
    correctAnswer = exercise.answer;
    hint = exercise.hint;
  } else if (exercise.type === "cases") {
    correctAnswer = exercise.correctArticle;
    hint = exercise.explanation;
  } else {
    correctAnswer = exercise.sentence;
    hint = undefined;
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ExerciseProgress
          total={session.exercises.length}
          current={session.currentIndex}
          results={session.results}
        />

        {exercise.type === "fill" && (
          <FillBlankView
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}

        {exercise.type === "dictation" && (
          <DictationView
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}

        {exercise.type === "cases" && (
          <CaseQuizView
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}

        {lastResult != null && (
          <ExerciseFeedback
            isCorrect={lastResult.isCorrect}
            correctAnswer={correctAnswer}
            hint={hint}
            onContinue={handleContinue}
          />
        )}
      </View>
      <Stack.Screen options={{ title }} />
    </>
  );
}
