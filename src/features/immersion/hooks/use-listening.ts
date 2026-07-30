import { useState, useCallback } from "react";
import { generateListeningExercises } from "../services/immersion-ai-service";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { ListeningExercise } from "../types";
import { logStudySession } from "@/features/review/services/study-sessions-repository";
import type { PrerequisiteReason } from "@/features/shared/types/prerequisites";

type Phase =
  | "loading"
  | "listening"
  | "result"
  | "summary"
  | "blocked"
  | "error";

export function useListening() {
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastLevel, setLastLevel] = useState("B1");
  const [prerequisiteReason, setPrerequisiteReason] =
    useState<PrerequisiteReason | null>(null);

  const currentExercise = exercises[currentIndex] ?? null;

  const start = useCallback(async (level: string) => {
    setLastLevel(level);
    setPhase("loading");
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowTranscript(false);
    setStartTime(null);
    setPrerequisiteReason(null);

    try {
      const words = await getAllWords(undefined, 12);
      const shuffled = words.sort(() => Math.random() - 0.5);
      const terms = shuffled
        .slice(0, Math.min(8, words.length))
        .map((w) => w.term);

      if (terms.length < 3) {
        setExercises([]);
        setPrerequisiteReason("needs_vocabulary");
        setPhase("blocked");
        return;
      }

      const generated = await generateListeningExercises(terms, level);
      setExercises(generated);
      setStartTime(Date.now());
      setPhase("listening");
    } catch {
      setExercises([]);
      setPrerequisiteReason("generation_failed");
      setPhase("error");
    }
  }, []);

  const answer = useCallback(
    (index: number) => {
      if (!currentExercise || selectedAnswer !== null) return;
      setSelectedAnswer(index);
      if (index === currentExercise.correctIndex) {
        setCorrectCount((prev) => prev + 1);
      }
      setPhase("result");
    },
    [currentExercise, selectedAnswer],
  );

  const toggleTranscript = useCallback(() => {
    setShowTranscript((prev) => !prev);
  }, []);

  const next = useCallback(async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= exercises.length) {
      try {
        await logStudySession({
          activityType: "listening",
          label: "Ascolto",
          itemCount: exercises.length,
          correctCount,
          durationSeconds: startTime
            ? Math.round((Date.now() - startTime) / 1000)
            : 0,
        });
      } catch {
        // Summary should still render if logging fails
      }
      setPhase("summary");
    } else {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setShowTranscript(false);
      setPhase("listening");
    }
  }, [correctCount, currentIndex, exercises.length, startTime]);

  const retry = useCallback(async () => {
    await start(lastLevel);
  }, [lastLevel, start]);

  return {
    phase,
    currentExercise,
    currentIndex,
    total: exercises.length,
    selectedAnswer,
    correctCount,
    showTranscript,
    prerequisiteReason,
    start,
    answer,
    toggleTranscript,
    next,
    retry,
  };
}
