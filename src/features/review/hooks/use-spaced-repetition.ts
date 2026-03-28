import {
  fsrs,
  generatorParameters,
  Rating,
  createEmptyCard,
  type Grade,
} from "ts-fsrs";
import {
  updateReviewScore,
  updateFsrsCard,
} from "@/features/shared/db/words-repository";
import { logActivity } from "@/features/review/services/activity-repository";
import type { Word } from "@/features/dictionary/types";

type Response = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

export interface ActivityContext {
  wordId: number;
  activityType: "review" | "exercise";
  exerciseType?: "fill" | "dictation" | "cases";
}

interface ReviewResult {
  newScore: number;
  nextReview: string;
}

const params = generatorParameters({ maximum_interval: 365 });
const f = fsrs(params);

const RESPONSE_TO_GRADE: Record<Response, Grade> = {
  0: Rating.Again,
  1: Rating.Hard,
  2: Rating.Good,
  3: Rating.Easy,
};

const SCORE_DELTA: Record<Response, number> = {
  0: -2,
  1: -1,
  2: 1,
  3: 2,
};

function wordToFsrsCardInput(word: Word) {
  if (!word.srDue && word.srReps === 0) {
    return createEmptyCard(new Date());
  }
  return createEmptyCard(
    word.srDue ? new Date(word.srDue) : new Date(),
    (card) => ({
      ...card,
      stability: word.srStability ?? 0,
      difficulty: word.srDifficulty ?? 0,
      elapsed_days: word.srElapsedDays ?? 0,
      scheduled_days: word.srScheduledDays ?? 0,
      reps: word.srReps ?? 0,
      lapses: word.srLapses ?? 0,
      state: word.srState ?? 0,
      last_review: word.srLastReview ? new Date(word.srLastReview) : undefined,
    }),
  );
}

export async function submitReview(
  term: string,
  currentScore: number,
  response: Response,
  activity?: ActivityContext,
  word?: Word,
): Promise<ReviewResult> {
  const now = new Date();
  const grade = RESPONSE_TO_GRADE[response];

  const card = word ? wordToFsrsCardInput(word) : createEmptyCard(now);
  const scheduling = f.repeat(card, now);
  const result = scheduling[grade];
  const newCard = result.card;

  const nextReview = newCard.due.toISOString();
  const scoreDelta = SCORE_DELTA[response];
  const newScore = Math.max(-5, Math.min(10, currentScore + scoreDelta));

  // Update both legacy score and FSRS card
  await updateReviewScore(term, newScore, nextReview);
  await updateFsrsCard(term, {
    due: nextReview,
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    elapsed_days: newCard.elapsed_days,
    scheduled_days: newCard.scheduled_days,
    reps: newCard.reps,
    lapses: newCard.lapses,
    state: newCard.state as number,
    last_review: newCard.last_review
      ? newCard.last_review instanceof Date
        ? newCard.last_review.toISOString()
        : String(newCard.last_review)
      : null,
  });

  if (activity) {
    try {
      await logActivity({
        wordId: activity.wordId,
        activityType: activity.activityType,
        exerciseType: activity.exerciseType,
        response,
        isCorrect: response >= 2,
        scoreBefore: currentScore,
        scoreAfter: newScore,
      });
    } catch {
      // Non-blocking: don't fail the review if logging fails
    }
  }

  return { newScore, nextReview };
}
