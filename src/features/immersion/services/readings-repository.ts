import { getDatabase } from "@/features/shared/db/database";
import type { SavedReading } from "../types";

export async function saveReading(data: {
  title: string;
  level: string;
  content: string;
  wordTranslations: Record<string, string>;
}): Promise<number> {
  const db = await getDatabase();
  const wordCount = data.content.split(/\s+/).length;
  const result = await db.runAsync(
    `INSERT INTO readings (title, level, content, word_translations, word_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.level,
      data.content,
      JSON.stringify(data.wordTranslations),
      wordCount,
      new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

export async function getReadings(limit: number = 20): Promise<SavedReading[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    level: string;
    content: string;
    word_translations: string;
    word_count: number;
    created_at: string;
  }>("SELECT * FROM readings ORDER BY created_at DESC LIMIT ?", [limit]);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    level: r.level,
    content: r.content,
    wordTranslations: JSON.parse(r.word_translations) as Record<string, string>,
    wordCount: r.word_count,
    createdAt: r.created_at,
  }));
}

export async function getReadingById(id: number): Promise<SavedReading | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    title: string;
    level: string;
    content: string;
    word_translations: string;
    word_count: number;
    created_at: string;
  }>("SELECT * FROM readings WHERE id = ?", [id]);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    level: row.level,
    content: row.content,
    wordTranslations: JSON.parse(row.word_translations) as Record<
      string,
      string
    >,
    wordCount: row.word_count,
    createdAt: row.created_at,
  };
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM readings WHERE id = ?", [id]);
}
