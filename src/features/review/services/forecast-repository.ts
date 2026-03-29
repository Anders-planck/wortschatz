import { getDatabase } from "@/features/shared/db/database";

export interface ForecastDay {
  date: string;
  count: number;
}

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getReviewForecast(
  days: number = 7,
): Promise<ForecastDay[]> {
  const db = await getDatabase();
  const today = localDateStr();

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
