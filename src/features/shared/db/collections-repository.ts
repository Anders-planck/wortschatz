import type { Word } from "@/features/dictionary/types";
import type {
  Collection,
  CollectionWithStats,
} from "@/features/collections/types";
import { getDatabase } from "./database";
import { type WordRow, rowToWord } from "./words-repository";

interface CollectionRow {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_ai_generated: number;
  updated_at: string;
  created_at: string;
}

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isAiGenerated: row.is_ai_generated === 1,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export async function getCollections(): Promise<CollectionWithStats[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    CollectionRow & { word_count: number; avg_score: number | null }
  >(
    `SELECT c.*, COUNT(cw.word_id) as word_count, AVG(w.review_score) as avg_score
     FROM collections c
     LEFT JOIN collection_words cw ON cw.collection_id = c.id
     LEFT JOIN words w ON w.id = cw.word_id
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
  );
  return rows.map((row) => ({
    ...rowToCollection(row),
    wordCount: row.word_count,
    masteryPercent:
      row.avg_score !== null
        ? Math.round(
            Math.max(0, Math.min(100, ((row.avg_score + 5) / 15) * 100)),
          )
        : 0,
  }));
}

export async function getCollectionWords(
  collectionId: number,
): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     JOIN collection_words cw ON cw.word_id = w.id
     WHERE cw.collection_id = ?`,
    [collectionId],
  );
  return rows.map(rowToWord);
}

export async function getCollectionsForWord(
  wordId: number,
): Promise<Collection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CollectionRow>(
    `SELECT c.* FROM collections c
     JOIN collection_words cw ON cw.collection_id = c.id
     WHERE cw.word_id = ?`,
    [wordId],
  );
  return rows.map(rowToCollection);
}

export async function getUnorganizedWords(): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     WHERE w.id NOT IN (SELECT word_id FROM collection_words)`,
  );
  return rows.map(rowToWord);
}

export async function getUnorganizedCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words
     WHERE id NOT IN (SELECT word_id FROM collection_words)`,
  );
  return row?.count ?? 0;
}

export async function getWordsForReviewByCollection(
  collectionId: number,
  limit = 12,
): Promise<Word[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     JOIN collection_words cw ON cw.word_id = w.id
     WHERE cw.collection_id = ?
       AND (w.next_review IS NULL OR w.next_review <= ?)
     ORDER BY w.review_score ASC
     LIMIT ?`,
    [collectionId, now, limit],
  );
  return rows.map(rowToWord);
}

export async function addWordToCollection(
  collectionId: number,
  wordId: number,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO collection_words (collection_id, word_id, added_at)
     VALUES (?, ?, ?)`,
    [collectionId, wordId, now],
  );
  await db.runAsync(`UPDATE collections SET updated_at = ? WHERE id = ?`, [
    now,
    collectionId,
  ]);
}

export async function removeWordFromCollection(
  collectionId: number,
  wordId: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM collection_words WHERE collection_id = ? AND word_id = ?`,
    [collectionId, wordId],
  );
}

export async function createCollection(
  name: string,
  icon: string,
  color: string,
  isAiGenerated = false,
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO collections (name, icon, color, is_ai_generated, updated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, icon, color, isAiGenerated ? 1 : 0, now, now],
  );
  return result.lastInsertRowId;
}

export async function deleteCollection(collectionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM collection_words WHERE collection_id = ?`, [
    collectionId,
  ]);
  await db.runAsync(`DELETE FROM collections WHERE id = ?`, [collectionId]);
}

export async function deleteCollections(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(", ");
  await db.runAsync(
    `DELETE FROM collection_words WHERE collection_id IN (${placeholders})`,
    ids,
  );
  await db.runAsync(
    `DELETE FROM collections WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function updateCollection(
  collectionId: number,
  fields: { name?: string; icon?: string; color?: string },
): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const values: (string | number)[] = [];

  if (fields.name !== undefined) {
    setClauses.push("name = ?");
    values.push(fields.name);
  }
  if (fields.icon !== undefined) {
    setClauses.push("icon = ?");
    values.push(fields.icon);
  }
  if (fields.color !== undefined) {
    setClauses.push("color = ?");
    values.push(fields.color);
  }

  if (setClauses.length === 0) return;

  setClauses.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(collectionId);

  await db.runAsync(
    `UPDATE collections SET ${setClauses.join(", ")} WHERE id = ?`,
    values,
  );
}
