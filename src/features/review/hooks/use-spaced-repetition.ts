import { updateReviewScore } from "@/features/shared/db/words-repository";
import { logActivity } from "@/features/review/services/activity-repository";

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

const BASE_INTERVALS_MS: Record<Response, number> = {
  0: 1 * 60 * 60 * 1000, // Again: 1 hour
  1: 8 * 60 * 60 * 1000, // Hard: 8 hours
  2: 24 * 60 * 60 * 1000, // Good: 24 hours
  3: 72 * 60 * 60 * 1000, // Easy: 72 hours
};

function getScoreMultiplier(score: number): number {
  if (score <= 0) return 0.5;
  if (score <= 2) return 1;
  if (score <= 4) return 1.5;
  return 2;
}

export function calculateNextReview(
  currentScore: number,
  response: Response,
): ReviewResult {
  const scoreDelta =
    response === 0 ? -2 : response === 1 ? -1 : response === 2 ? 1 : 2;
  const newScore = Math.max(-5, Math.min(10, currentScore + scoreDelta));

  const baseInterval = BASE_INTERVALS_MS[response];
  const multiplier = getScoreMultiplier(newScore);
  const intervalMs = Math.round(baseInterval * multiplier);

  const nextReview = new Date(Date.now() + intervalMs).toISOString();

  return { newScore, nextReview };
}

export async function submitReview(
  term: string,
  currentScore: number,
  response: Response,
  activity?: ActivityContext,
): Promise<ReviewResult> {
  const result = calculateNextReview(currentScore, response);
  await updateReviewScore(term, result.newScore, result.nextReview);

  if (activity) {
    try {
      await logActivity({
        wordId: activity.wordId,
        activityType: activity.activityType,
        exerciseType: activity.exerciseType,
        response,
        isCorrect: response >= 2,
        scoreBefore: currentScore,
        scoreAfter: result.newScore,
      });
    } catch {
      // Non-blocking: don't fail the review if logging fails
    }
  }

  return result;
}
