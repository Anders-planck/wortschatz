import { getDatabase } from "@/features/shared/db/database";

export interface ForecastDay {
  date: string;
  count: number;
}

export async function getReviewForecast(
  days: number = 7,
): Promise<ForecastDay[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT DATE(sr_due, 'localtime') as day, COUNT(*) as count
     FROM words
     WHERE sr_due IS NOT NULL AND DATE(sr_due, 'localtime') <= DATE('now', 'localtime', '+${days} days')
     GROUP BY day ORDER BY day ASC`,
  );
  return rows.map((r) => ({ date: r.day, count: r.count }));
}
