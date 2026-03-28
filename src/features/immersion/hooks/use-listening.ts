import { useState, useCallback } from "react";
import { generateListeningExercises } from "../services/immersion-ai-service";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { ListeningExercise } from "../types";

type Phase = "loading" | "listening" | "answering" | "result" | "summary";

export function useListening() {
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const currentExercise = exercises[currentIndex] ?? null;

  const start = useCallback(async (level: string) => {
    setPhase("loading");
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowTranscript(false);

    try {
      const words = await getAllWords(undefined, 12);
      const shuffled = words.sort(() => Math.random() - 0.5);
      const terms = shuffled
        .slice(0, Math.min(8, words.length))
        .map((w) => w.term);

      if (terms.length < 3) {
        throw new Error("Not enough vocabulary");
      }

      const generated = await generateListeningExercises(terms, level);
      setExercises(generated);
      setPhase("listening");
    } catch {
      setPhase("summary");
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

  const next = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= exercises.length) {
      setPhase("summary");
    } else {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setShowTranscript(false);
      setPhase("listening");
    }
  }, [currentIndex, exercises.length]);

  return {
    phase,
    currentExercise,
    currentIndex,
    total: exercises.length,
    selectedAnswer,
    correctCount,
    showTranscript,
    start,
    answer,
    toggleTranscript,
    next,
  };
}
