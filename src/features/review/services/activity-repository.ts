import { getDatabase } from "@/features/shared/db/database";

export interface ActivityEntry {
  wordId: number;
  activityType: "review" | "exercise";
  exerciseType?: "fill" | "dictation" | "cases";
  response: number;
  isCorrect: boolean;
  scoreBefore: number;
  scoreAfter: number;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO activity_log (word_id, activity_type, exercise_type, response, is_correct, score_before, score_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.wordId,
      entry.activityType,
      entry.exerciseType ?? null,
      entry.response,
      entry.isCorrect ? 1 : 0,
      entry.scoreBefore,
      entry.scoreAfter,
      new Date().toISOString(),
    ],
  );
}

export async function getActivityToday(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM activity_log
     WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')`,
  );
  return result?.count ?? 0;
}

export async function getActivityByDay(
  days: number,
): Promise<{ day: string; count: number }[]> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = toLocalDateStr(cutoff);

  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT DATE(created_at, 'localtime') as day, COUNT(*) as count
     FROM activity_log
     WHERE DATE(created_at, 'localtime') >= ?
     GROUP BY day
     ORDER BY day ASC`,
    [cutoffStr],
  );
  return rows;
}

export async function getStudyStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT DATE(created_at, 'localtime') as day
     FROM activity_log
     ORDER BY day DESC`,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = toLocalDateStr(expected);

    if (rows[i].day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getWeeklyActivityFromLog(): Promise<number[]> {
  const db = await getDatabase();

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const startStr = toLocalDateStr(start);

  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT DATE(created_at, 'localtime') as day, COUNT(*) as count
     FROM activity_log
     WHERE DATE(created_at, 'localtime') >= ?
     GROUP BY day`,
    [startStr],
  );

  const countByDay = new Map(rows.map((r) => [r.day, r.count]));
  const result: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(countByDay.get(toLocalDateStr(d)) ?? 0);
  }

  return result; // last 7 days ending today
}

export async function getExerciseStats(): Promise<
  { type: string; total: number; correct: number; accuracy: number }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    type: string;
    total: number;
    correct: number;
  }>(
    `SELECT exercise_type as type,
            COUNT(*) as total,
            SUM(is_correct) as correct
     FROM activity_log
     WHERE activity_type = 'exercise' AND exercise_type IS NOT NULL
     GROUP BY exercise_type`,
  );

  return rows.map((r) => ({
    type: r.type,
    total: r.total,
    correct: r.correct,
    accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
  }));
}

export async function getTotalStudyStats(): Promise<{
  totalReviews: number;
  totalExercises: number;
  overallAccuracy: number;
}> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{
    totalReviews: number;
    totalExercises: number;
    totalCorrect: number;
    totalAll: number;
  }>(
    `SELECT
       SUM(CASE WHEN activity_type = 'review' THEN 1 ELSE 0 END) as totalReviews,
       SUM(CASE WHEN activity_type = 'exercise' THEN 1 ELSE 0 END) as totalExercises,
       SUM(is_correct) as totalCorrect,
       COUNT(*) as totalAll
     FROM activity_log`,
  );

  const totalReviews = result?.totalReviews ?? 0;
  const totalExercises = result?.totalExercises ?? 0;
  const totalAll = result?.totalAll ?? 0;
  const totalCorrect = result?.totalCorrect ?? 0;
  const overallAccuracy =
    totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0;

  return { totalReviews, totalExercises, overallAccuracy };
}

export async function getRecentActivity(limit: number): Promise<
  {
    term: string;
    activityType: string;
    exerciseType: string | null;
    isCorrect: boolean;
    createdAt: string;
  }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    term: string;
    activity_type: string;
    exercise_type: string | null;
    is_correct: number;
    created_at: string;
  }>(
    `SELECT a.activity_type, a.exercise_type, a.is_correct, a.created_at, w.term
     FROM activity_log a JOIN words w ON a.word_id = w.id
     ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    term: r.term,
    activityType: r.activity_type,
    exerciseType: r.exercise_type,
    isCorrect: r.is_correct === 1,
    createdAt: r.created_at,
  }));
}

export async function getScoreTrend(
  days: number,
): Promise<{ day: string; avgScore: number }[]> {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = toLocalDateStr(startDate);

  const rows = await db.getAllAsync<{ day: string; avg_score: number }>(
    `SELECT DATE(created_at, 'localtime') as day,
            AVG(score_after) as avg_score
     FROM activity_log
     WHERE DATE(created_at, 'localtime') >= ?
     GROUP BY day
     ORDER BY day ASC`,
    [startStr],
  );

  return rows.map((r) => ({
    day: r.day,
    avgScore: Math.round(r.avg_score * 10) / 10,
  }));
}
