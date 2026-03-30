import { getDatabase } from "@/features/shared/db/database";
import { toLocalDateStr } from "@/features/shared/utils/date";

export interface ForecastDay {
  date: string;
  count: number;
}

export async function getReviewForecast(
  days: number = 7,
): Promise<ForecastDay[]> {
  const db = await getDatabase();
  const today = toLocalDateStr(new Date());

  // Words with sr_due set and due within range
  const scheduled = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT DATE(sr_due, 'localtime') as day, COUNT(*) as count
     FROM words
     WHERE sr_due IS NOT NULL AND DATE(sr_due, 'localtime') <= DATE('now', 'localtime', '+${days} days')
     GROUP BY day ORDER BY day ASC`,
  );

  // Words never reviewed (sr_due IS NULL) count as due today
  const newWords = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words WHERE sr_due IS NULL`,
  );
  const newCount = newWords?.count ?? 0;

  const result = scheduled.map((r) => ({ date: r.day, count: r.count }));

  if (newCount > 0) {
    const todayEntry = result.find((r) => r.date === today);
    if (todayEntry) {
      todayEntry.count += newCount;
    } else {
      result.unshift({ date: today, count: newCount });
    }
  }

  return result;
}

export interface ForecastBreakdown {
  ready: number;
  learning: number;
  newCount: number;
  nextLearningDue: string | null;
}

export async function getReviewForecastBreakdown(): Promise<ForecastBreakdown> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const [readyRow, learningRow, newRow, nextDueRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words
       WHERE sr_due IS NOT NULL AND sr_due <= ? AND sr_state IN (2, 3)`,
      [now],
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words
       WHERE sr_state = 1 AND sr_due > ?`,
      [now],
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words WHERE sr_due IS NULL`,
    ),
    db.getFirstAsync<{ due: string }>(
      `SELECT sr_due as due FROM words
       WHERE sr_state = 1 AND sr_due > ?
       ORDER BY sr_due ASC LIMIT 1`,
      [now],
    ),
  ]);

  return {
    ready: readyRow?.count ?? 0,
    learning: learningRow?.count ?? 0,
    newCount: newRow?.count ?? 0,
    nextLearningDue: nextDueRow?.due ?? null,
  };
}
