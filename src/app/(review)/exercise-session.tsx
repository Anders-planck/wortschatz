import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { PrerequisiteState } from "@/features/shared/components/prerequisite-state";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useExerciseSession } from "@/features/exercises/hooks/use-exercise-session";
import {
  EXERCISE_TYPE_LABELS,
  type ExerciseType,
} from "@/features/exercises/types";
import { ExerciseProgress } from "@/features/exercises/components/exercise-progress";
import { ExerciseFeedback } from "@/features/exercises/components/exercise-feedback";
import { ExerciseSummary } from "@/features/exercises/components/exercise-summary";
import { FillBlankView } from "@/features/exercises/components/fill-blank-exercise";
import { DictationView } from "@/features/exercises/components/dictation-exercise";
import { CaseQuizView } from "@/features/exercises/components/case-quiz-exercise";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (answer: string) => {
    await session.submit(answer);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    void session.advance();
  };

  const handleSkip = async () => {
    setShowFeedback(false);
    await session.skip();
  };

  const title = EXERCISE_TYPE_LABELS[type] ?? "Esercizi";
  const blockedContent: Record<string, { title: string; description: string }> = {
    needs_vocabulary: {
      title: "Aggiungi un po' di vocabolario",
      description:
        type === "mix"
          ? "Salva qualche parola prima di iniziare il mix di esercizi."
          : "Salva almeno una parola nel vocabolario per iniziare questo esercizio.",
    },
    needs_example_words: {
      title: "Servono parole con esempi",
      description:
        "Il dettato usa parole che hanno gia una frase di esempio. Cerca e salva altre parole con contesto.",
    },
    needs_gendered_nouns: {
      title: "Servono sostantivi con articolo",
      description:
        "Questo quiz richiede almeno un sostantivo con genere salvato nel vocabolario.",
    },
  };

  if (session.phase === "loading") {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            Generazione esercizi...
          </Text>
        </ScrollView>
        <Stack.Screen options={{ title }} />
      </>
    );
  }

  if (session.phase === "summary") {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ExerciseSummary
            results={session.results}
            correctCount={session.correctCount}
            errorCount={session.errorCount}
            durationSeconds={session.durationSeconds}
            onRetryErrors={session.retryErrors}
            onClose={() => router.back()}
          />
        </ScrollView>
        <Stack.Screen options={{ title }} />
      </>
    );
  }

  if (session.phase === "blocked" && session.prerequisiteReason) {
    const content = blockedContent[session.prerequisiteReason];
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <PrerequisiteState
            icon="book.closed"
            title={content.title}
            description={content.description}
            primaryLabel="Cerca parole"
            onPrimaryPress={() => router.replace("/(search)")}
            secondaryLabel="Torna indietro"
            onSecondaryPress={() => router.back()}
          />
        </ScrollView>
        <Stack.Screen options={{ title }} />
      </>
    );
  }

  if (session.phase === "error") {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <PrerequisiteState
            icon="exclamationmark.triangle"
            title="Impossibile preparare gli esercizi"
            description="La generazione non e andata a buon fine. Riprova tra un attimo."
            primaryLabel="Riprova"
            onPrimaryPress={() => void session.retry()}
            secondaryLabel="Torna indietro"
            onSecondaryPress={() => router.back()}
          />
        </ScrollView>
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ExerciseProgress
          total={session.exercises.length}
          current={session.currentIndex}
          results={session.results}
          startTime={session.startTime}
        />

        {exercise.type === "fill" && (
          <FillBlankView
            key={session.currentIndex}
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}

        {exercise.type === "dictation" && (
          <DictationView
            key={session.currentIndex}
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}

        {exercise.type === "cases" && (
          <CaseQuizView
            key={session.currentIndex}
            exercise={exercise}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={showFeedback}
          />
        )}
      </ScrollView>

      {lastResult != null && (
        <ExerciseFeedback
          isCorrect={lastResult.isCorrect}
          correctAnswer={correctAnswer}
          hint={hint}
          onContinue={handleContinue}
        />
      )}
      <Stack.Screen options={{ title }} />
    </>
  );
}
