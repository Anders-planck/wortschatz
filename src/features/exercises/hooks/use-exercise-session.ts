import { useState, useCallback } from "react";
import type {
  Exercise,
  ExerciseResult,
  ExerciseType,
  SessionPhase,
} from "../types";
import { EXERCISE_TYPE_LABELS } from "../types";
import { generateExercises } from "../services/exercise-generator";
import {
  submitReview,
} from "@/features/review/hooks/use-spaced-repetition";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { Word } from "@/features/dictionary/types";
import { logStudySession } from "@/features/review/services/study-sessions-repository";
import {
  type PrerequisiteReason,
  isPrerequisiteError,
} from "@/features/shared/types/prerequisites";
import {
  hapticMedium,
  hapticSuccess,
} from "@/features/shared/hooks/use-haptics";

interface ExerciseSession {
  phase: SessionPhase;
  exercises: Exercise[];
  currentIndex: number;
  results: ExerciseResult[];
  allWords: Word[];
  startTime: number | null;
  currentExercise: Exercise | null;
  correctCount: number;
  errorCount: number;
  durationSeconds: number;
  prerequisiteReason: PrerequisiteReason | null;
  start: (type: ExerciseType) => Promise<void>;
  submit: (userAnswer: string) => Promise<void>;
  advance: () => Promise<void>;
  skip: () => Promise<void>;
  retryErrors: () => void;
  retry: () => Promise<void>;
}

export function useExerciseSession(): ExerciseSession {
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [lastType, setLastType] = useState<ExerciseType>("mix");
  const [prerequisiteReason, setPrerequisiteReason] =
    useState<PrerequisiteReason | null>(null);

  const start = useCallback(async (type: ExerciseType) => {
    setLastType(type);
    setPhase("loading");
    setCurrentIndex(0);
    setResults([]);
    setExercises([]);
    setAllWords([]);
    setStartTime(null);
    setEndTime(null);
    setPrerequisiteReason(null);

    try {
      const [generated, words] = await Promise.all([
        generateExercises(type),
        getAllWords(),
      ]);
      setExercises(generated);
      setAllWords(words);
      setStartTime(Date.now());
      setPhase("active");
    } catch (error: unknown) {
      if (isPrerequisiteError(error) && error.reason !== "generation_failed") {
        setPrerequisiteReason(error.reason);
        setPhase("blocked");
      } else {
        setPrerequisiteReason("generation_failed");
        setPhase("error");
      }
    }
  }, []);

  const finishSession = useCallback(
    async (finalResults: ExerciseResult[]) => {
      if (finalResults.length === 0) return;

      try {
        await logStudySession({
          activityType: "exercise",
          label: EXERCISE_TYPE_LABELS[lastType],
          itemCount: finalResults.length,
          correctCount: finalResults.filter((result) => result.isCorrect).length,
          durationSeconds: startTime
            ? Math.round((Date.now() - startTime) / 1000)
            : 0,
        });
      } catch {
        // Keep summary UX responsive even if session logging fails
      }
    },
    [lastType, startTime],
  );

  const findWordForExercise = useCallback(
    (exercise: Exercise, words: Word[]): Word | undefined => {
      return words.find(
        (w) => w.term.toLowerCase() === exercise.wordTerm.toLowerCase(),
      );
    },
    [],
  );

  const submit = useCallback(
    async (userAnswer: string) => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      const correctAnswer =
        exercise.type === "cases"
          ? exercise.correctArticle
          : exercise.type === "fill"
            ? exercise.answer
            : exercise.sentence;

      const isCorrect =
        userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      const result: ExerciseResult = {
        exercise,
        userAnswer,
        isCorrect,
      };

      setResults((prev) => [...prev, result]);

      if (isCorrect) {
        hapticSuccess();
      } else {
        hapticMedium();
      }

      const word = findWordForExercise(exercise, allWords);
      if (word) {
        try {
          await submitReview(
            word.term,
            word.reviewScore,
            isCorrect ? 2 : 0,
            word.id != null
              ? {
                  wordId: word.id,
                  activityType: "exercise",
                  exerciseType: exercise.type as "fill" | "dictation" | "cases",
                }
              : undefined,
            word,
          );
        } catch {
          // Continue session even if DB update fails
        }
      }
    },
    [exercises, currentIndex, allWords, findWordForExercise],
  );

  const advance = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= exercises.length) {
      setEndTime(Date.now());
      await finishSession(results);
      setPhase("summary");
      hapticSuccess();
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, exercises.length, finishSession, results]);

  const skip = useCallback(async () => {
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    const result: ExerciseResult = {
      exercise,
      userAnswer: "",
      isCorrect: false,
    };

    const newResults = [...results, result];
    setResults(newResults);

    const word = findWordForExercise(exercise, allWords);
    if (word) {
      try {
        await submitReview(
          word.term,
          word.reviewScore,
          0,
          word.id != null
            ? {
                wordId: word.id,
                activityType: "exercise",
                exerciseType: exercise.type as "fill" | "dictation" | "cases",
              }
            : undefined,
          word,
        );
      } catch {
        // Continue session even if DB update fails
      }
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= exercises.length) {
      setEndTime(Date.now());
      await finishSession(newResults);
      setPhase("summary");
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [
    allWords,
    currentIndex,
    exercises,
    findWordForExercise,
    finishSession,
    results,
  ]);

  const retryErrors = useCallback(() => {
    const failed = results.filter((r) => !r.isCorrect).map((r) => r.exercise);

    if (failed.length === 0) return;

    setExercises(failed);
    setCurrentIndex(0);
    setResults([]);
    setStartTime(Date.now());
    setEndTime(null);
    setPhase("active");
  }, [results]);

  const retry = useCallback(async () => {
    await start(lastType);
  }, [lastType, start]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const errorCount = results.filter((r) => !r.isCorrect).length;
  const durationSeconds =
    startTime !== null
      ? Math.round(((endTime ?? Date.now()) - startTime) / 1000)
      : 0;

  return {
    phase,
    exercises,
    currentIndex,
    results,
    allWords,
    startTime,
    currentExercise: exercises[currentIndex] ?? null,
    correctCount,
    errorCount,
    durationSeconds,
    prerequisiteReason,
    start,
    submit,
    advance,
    skip,
    retryErrors,
    retry,
  };
}
