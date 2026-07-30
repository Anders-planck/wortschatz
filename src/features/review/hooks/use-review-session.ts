import { useState, useCallback } from "react";

import type { Word } from "@/features/dictionary/types";
import { getWordsForReview } from "@/features/shared/db/words-repository";
import { getWordsForReviewByCollection } from "@/features/shared/db/collections-repository";
import { logStudySession } from "@/features/review/services/study-sessions-repository";
import {
  submitReview,
  previewIntervals,
} from "./use-spaced-repetition";
import {
  hapticMedium,
  hapticSuccess,
} from "@/features/shared/hooks/use-haptics";

type Response = 0 | 1 | 2 | 3;

interface ReviewSession {
  words: Word[];
  currentIndex: number;
  currentWord: Word | null;
  isRevealed: boolean;
  isComplete: boolean;
  responses: Response[];
  intervals: string[];
  total: number;
  isLoading: boolean;
  startTime: number | null;
  startSession: () => Promise<void>;
  reveal: () => void;
  respond: (response: Response) => Promise<void>;
}

export function useReviewSession(
  collectionId?: number,
  sessionLabel: string = "Ripasso",
): ReviewSession {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const reviewWords = collectionId
        ? await getWordsForReviewByCollection(collectionId, 12)
        : await getWordsForReview(12);
      setWords(reviewWords);
      setCurrentIndex(0);
      setIsRevealed(false);
      setIsComplete(false);
      setResponses([]);
      setStartTime(reviewWords.length > 0 ? Date.now() : null);
    } catch {
      setWords([]);
      setStartTime(null);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  const reveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const respond = useCallback(
    async (response: Response) => {
      if (currentIndex >= words.length) return;

      const word = words[currentIndex];
      hapticMedium();

      try {
        await submitReview(
          word.term,
          word.reviewScore,
          response,
          word.id != null
            ? { wordId: word.id, activityType: "review" }
            : undefined,
          word,
        );
      } catch {
        // Continue session even if DB update fails
      }

      const newResponses = [...responses, response];
      setResponses(newResponses);

      if (currentIndex + 1 >= words.length) {
        try {
          await logStudySession({
            activityType: "review",
            label: sessionLabel,
            itemCount: newResponses.length,
            correctCount: newResponses.filter((value) => value >= 2).length,
            durationSeconds: startTime
              ? Math.round((Date.now() - startTime) / 1000)
              : 0,
          });
        } catch {
          // Session completion should not fail on study logging
        }
        setIsComplete(true);
        hapticSuccess();
      } else {
        setCurrentIndex(currentIndex + 1);
        setIsRevealed(false);
      }
    },
    [currentIndex, responses, sessionLabel, startTime, words],
  );

  const intervals = words[currentIndex]
    ? previewIntervals(words[currentIndex])
    : [];

  return {
    words,
    currentIndex,
    currentWord: words[currentIndex] ?? null,
    isRevealed,
    isComplete,
    responses,
    intervals,
    total: words.length,
    isLoading,
    startTime,
    startSession,
    reveal,
    respond,
  };
}
