import { useState, useCallback } from "react";

import type { Word } from "@/features/dictionary/types";
import { getWordsForReview } from "@/features/shared/db/words-repository";
import { getWordsForReviewByCollection } from "@/features/shared/db/collections-repository";
import { submitReview, type ActivityContext } from "./use-spaced-repetition";
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
  total: number;
  isLoading: boolean;
  startSession: () => Promise<void>;
  reveal: () => void;
  respond: (response: Response) => Promise<void>;
}

export function useReviewSession(collectionId?: number): ReviewSession {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    } catch {
      setWords([]);
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
        setIsComplete(true);
        hapticSuccess();
      } else {
        setCurrentIndex(currentIndex + 1);
        setIsRevealed(false);
      }
    },
    [currentIndex, words, responses],
  );

  return {
    words,
    currentIndex,
    currentWord: words[currentIndex] ?? null,
    isRevealed,
    isComplete,
    responses,
    total: words.length,
    isLoading,
    startSession,
    reveal,
    respond,
  };
}
