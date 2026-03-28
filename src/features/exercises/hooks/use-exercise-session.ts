import { useState, useCallback } from "react";
import type {
  Exercise,
  ExerciseResult,
  ExerciseType,
  SessionPhase,
} from "../types";
import { generateExercises } from "../services/exercise-generator";
import {
  submitReview,
  type ActivityContext,
} from "@/features/review/hooks/use-spaced-repetition";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { Word } from "@/features/dictionary/types";
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
  start: (type: ExerciseType) => Promise<void>;
  submit: (userAnswer: string) => Promise<void>;
  advance: () => void;
  skip: () => Promise<void>;
  retryErrors: () => void;
}

export function useExerciseSession(): ExerciseSession {
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const start = useCallback(async (type: ExerciseType) => {
    setPhase("loading");
    setCurrentIndex(0);
    setResults([]);
    setEndTime(null);

    try {
      const [generated, words] = await Promise.all([
        generateExercises(type),
        getAllWords(),
      ]);
      setExercises(generated);
      setAllWords(words);
      setStartTime(Date.now());
      setPhase("active");
    } catch {
      setPhase("summary");
    }
  }, []);

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
          );
        } catch {
          // Continue session even if DB update fails
        }
      }
    },
    [exercises, currentIndex, allWords, findWordForExercise],
  );

  const advance = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= exercises.length) {
      setEndTime(Date.now());
      setPhase("summary");
      hapticSuccess();
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, exercises.length]);

  const skip = useCallback(async () => {
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    const result: ExerciseResult = {
      exercise,
      userAnswer: "",
      isCorrect: false,
    };

    setResults((prev) => [...prev, result]);

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
        );
      } catch {
        // Continue session even if DB update fails
      }
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= exercises.length) {
      setEndTime(Date.now());
      setPhase("summary");
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [exercises, currentIndex, allWords, findWordForExercise]);

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
    start,
    submit,
    advance,
    skip,
    retryErrors,
  };
}
