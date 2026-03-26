import { getDatabase } from "@/features/shared/db/database";
import { getWordCount } from "@/features/shared/db/words-repository";

const MASTERY_LEVELS = [
  "Padroneggiato",
  "Buono",
  "In progresso",
  "Da ripassare",
  "Difficile",
] as const;

export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export interface WordStats {
  totalWords: number;
  byType: { type: string; count: number }[];
  masteryDistribution: { level: MasteryLevel; count: number }[];
  averageScore: number;
  wordsReviewedToday: number;
  totalReviews: number;
  monthlyActivity: { day: string; count: number }[];
}

export async function getDetailedStats(): Promise<WordStats> {
  const db = await getDatabase();

  const [totalWords, byTypeRows, avgRow, masteryRows, todayRow, monthlyRows] =
    await Promise.all([
      getWordCount(),
      db.getAllAsync<{ type: string; count: number }>(
        "SELECT type, COUNT(*) as count FROM words GROUP BY type ORDER BY count DESC",
      ),
      db.getFirstAsync<{ avg: number; reviewed: number }>(
        `SELECT
          COALESCE(AVG(review_score), 0) as avg,
          COUNT(CASE WHEN review_score != 0 THEN 1 END) as reviewed
        FROM words`,
      ),
      db.getAllAsync<{ level: string; count: number }>(
        `SELECT
          CASE
            WHEN review_score <= -3 THEN 'Difficile'
            WHEN review_score <= 0 THEN 'Da ripassare'
            WHEN review_score <= 3 THEN 'In progresso'
            WHEN review_score <= 6 THEN 'Buono'
            ELSE 'Padroneggiato'
          END as level,
          COUNT(*) as count
        FROM words
        GROUP BY level`,
      ),
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM words
         WHERE DATE(searched_at, 'localtime') = DATE('now', 'localtime')`,
      ),
      db.getAllAsync<{ day: string; count: number }>(
        `SELECT DATE(searched_at, 'localtime') as day, COUNT(*) as count
         FROM words
         WHERE DATE(searched_at, 'localtime') >= DATE('now', '-30 days', 'localtime')
         GROUP BY day
         ORDER BY day ASC`,
      ),
    ]);

  const masteryMap = new Map(masteryRows.map((r) => [r.level, r.count]));
  const masteryDistribution = MASTERY_LEVELS.map((level) => ({
    level,
    count: masteryMap.get(level) ?? 0,
  })).filter((m) => m.count > 0);

  return {
    totalWords,
    byType: byTypeRows,
    masteryDistribution,
    averageScore: Math.round((avgRow?.avg ?? 0) * 10) / 10,
    wordsReviewedToday: todayRow?.count ?? 0,
    totalReviews: avgRow?.reviewed ?? 0,
    monthlyActivity: monthlyRows,
  };
}
