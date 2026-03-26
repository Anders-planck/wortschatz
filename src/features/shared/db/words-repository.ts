import type { Word } from "@/features/dictionary/types";
import { getDatabase } from "./database";

interface WordRow {
  id: number;
  term: string;
  type: string;
  gender: string | null;
  plural: string | null;
  translations: string;
  forms: string | null;
  examples: string | null;
  usage_context: string | null;
  audio_url: string | null;
  raw_wiktionary: string | null;
  searched_at: string;
  review_score: number;
  next_review: string | null;
  category: string | null;
  created_at: string;
}

function parseJsonSafe<T>(value: string | null, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    term: row.term,
    type: row.type as Word["type"],
    gender: row.gender as Word["gender"],
    plural: row.plural,
    translations: parseJsonSafe<string[]>(row.translations, []),
    forms: parseJsonSafe<Record<string, unknown> | null>(row.forms, null),
    examples: parseJsonSafe<Word["examples"]>(row.examples, null),
    usageContext: row.usage_context,
    audioUrl: row.audio_url,
    rawWiktionary: parseJsonSafe<Record<string, unknown> | null>(
      row.raw_wiktionary,
      null,
    ),
    searchedAt: row.searched_at,
    reviewScore: row.review_score,
    nextReview: row.next_review,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function getWordByTerm(term: string): Promise<Word | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WordRow>(
    "SELECT * FROM words WHERE term = ? COLLATE NOCASE",
    [term],
  );
  return row ? rowToWord(row) : null;
}

export async function insertWord(word: Omit<Word, "id">): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR REPLACE INTO words (
      term, type, gender, plural, translations, forms, examples,
      usage_context, audio_url, raw_wiktionary, searched_at,
      review_score, next_review, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      word.term,
      word.type,
      word.gender,
      word.plural,
      JSON.stringify(word.translations),
      word.forms ? JSON.stringify(word.forms) : null,
      word.examples ? JSON.stringify(word.examples) : null,
      word.usageContext,
      word.audioUrl,
      word.rawWiktionary ? JSON.stringify(word.rawWiktionary) : null,
      word.searchedAt,
      word.reviewScore ?? 0,
      word.nextReview,
      word.category,
      word.createdAt,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateWordAIContent(
  term: string,
  data: {
    examples: unknown[];
    usageContext: string;
    category: string;
    gender?: string | null;
    plural?: string | null;
    translationsIt?: string[];
    forms?: Record<string, unknown>;
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE words SET examples = ?, usage_context = ?, category = ?, gender = COALESCE(?, gender), plural = COALESCE(?, plural), translations = COALESCE(?, translations), forms = COALESCE(?, forms) WHERE term = ? COLLATE NOCASE`,
    [
      JSON.stringify(data.examples),
      data.usageContext,
      data.category,
      data.gender ?? null,
      data.plural ?? null,
      data.translationsIt ? JSON.stringify(data.translationsIt) : null,
      data.forms ? JSON.stringify(data.forms) : null,
      term,
    ],
  );
}

export async function getAllWords(
  filter?: { type?: string },
  limit = 200,
): Promise<Word[]> {
  const db = await getDatabase();
  if (filter?.type) {
    const rows = await db.getAllAsync<WordRow>(
      "SELECT * FROM words WHERE type = ? ORDER BY created_at DESC LIMIT ?",
      [filter.type, limit],
    );
    return rows.map(rowToWord);
  }
  const rows = await db.getAllAsync<WordRow>(
    "SELECT * FROM words ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
  return rows.map(rowToWord);
}

export async function getWordsForReview(limit = 20): Promise<Word[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT * FROM words
     WHERE next_review IS NULL OR next_review <= ?
     ORDER BY review_score ASC, searched_at DESC
     LIMIT ?`,
    [now, limit],
  );
  return rows.map(rowToWord);
}

export async function getTrickyWords(limit = 20): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT * FROM words
     WHERE review_score < 0
     ORDER BY review_score ASC
     LIMIT ?`,
    [limit],
  );
  return rows.map(rowToWord);
}

export async function updateReviewScore(
  term: string,
  score: number,
  nextReview: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE words SET review_score = ?, next_review = ? WHERE term = ? COLLATE NOCASE`,
    [score, nextReview, term],
  );
}

export async function getWordCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM words",
  );
  return result?.count ?? 0;
}

export async function deleteWord(term: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM words WHERE term = ? COLLATE NOCASE", [term]);
}

export async function getRecentWords(limit = 10): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    "SELECT * FROM words ORDER BY searched_at DESC LIMIT ?",
    [limit],
  );
  return rows.map(rowToWord);
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getWeeklyActivity(): Promise<number[]> {
  const db = await getDatabase();

  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0, Sunday=6
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = toLocalDateStr(monday);

  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT DATE(searched_at, 'localtime') as day, COUNT(*) as count
     FROM words
     WHERE DATE(searched_at, 'localtime') >= ?
     GROUP BY day`,
    [mondayStr],
  );

  const countByDay = new Map(rows.map((r) => [r.day, r.count]));
  const result: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result.push(countByDay.get(toLocalDateStr(d)) ?? 0);
  }

  return result; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

export async function getStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT DATE(searched_at, 'localtime') as day
     FROM words
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

export async function updateAudioUrl(
  term: string,
  audioUrl: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE words SET audio_url = ? WHERE term = ? COLLATE NOCASE",
    [audioUrl, term],
  );
}

export async function getAudioUrl(term: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ audio_url: string | null }>(
    "SELECT audio_url FROM words WHERE term = ? COLLATE NOCASE",
    [term],
  );
  return row?.audio_url ?? null;
}
