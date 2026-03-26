import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("learn-lang.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE COLLATE NOCASE,
      type TEXT NOT NULL,
      gender TEXT,
      plural TEXT,
      translations TEXT NOT NULL DEFAULT '[]',
      forms TEXT,
      examples TEXT,
      usage_context TEXT,
      audio_url TEXT,
      raw_wiktionary TEXT,
      searched_at TEXT NOT NULL,
      review_score INTEGER NOT NULL DEFAULT 0,
      next_review TEXT,
      category TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_words_term ON words (term COLLATE NOCASE);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_words_next_review ON words (next_review);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}
