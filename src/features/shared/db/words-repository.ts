import type { Word } from "@/features/dictionary/types";
import { getDatabase } from "./database";

export interface WordRow {
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
  sr_due: string | null;
  sr_stability: number;
  sr_difficulty: number;
  sr_elapsed_days: number;
  sr_scheduled_days: number;
  sr_reps: number;
  sr_lapses: number;
  sr_state: number;
  sr_last_review: string | null;
}

function parseJsonSafe<T>(value: string | null, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function rowToWord(row: WordRow): Word {
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
    srDue: row.sr_due,
    srStability: row.sr_stability ?? 0,
    srDifficulty: row.sr_difficulty ?? 0,
    srElapsedDays: row.sr_elapsed_days ?? 0,
    srScheduledDays: row.sr_scheduled_days ?? 0,
    srReps: row.sr_reps ?? 0,
    srLapses: row.sr_lapses ?? 0,
    srState: row.sr_state ?? 0,
    srLastReview: row.sr_last_review,
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
     WHERE sr_due IS NULL OR sr_due <= ?
     ORDER BY
       CASE sr_state
         WHEN 0 THEN 0
         WHEN 1 THEN 1
         WHEN 3 THEN 2
         WHEN 2 THEN 3
       END,
       sr_due ASC
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

export async function updateFsrsCard(
  term: string,
  card: {
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: number;
    last_review: string | null;
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE words SET
       sr_due = ?, sr_stability = ?, sr_difficulty = ?,
       sr_elapsed_days = ?, sr_scheduled_days = ?,
       sr_reps = ?, sr_lapses = ?, sr_state = ?, sr_last_review = ?
     WHERE term = ? COLLATE NOCASE`,
    [
      card.due,
      card.stability,
      card.difficulty,
      card.elapsed_days,
      card.scheduled_days,
      card.reps,
      card.lapses,
      card.state,
      card.last_review,
      term,
    ],
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
