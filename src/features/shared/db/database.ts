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

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'folder.fill',
      color TEXT NOT NULL DEFAULT '#D4A44A',
      is_ai_generated INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collection_words (
      collection_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (collection_id, word_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_cw_collection ON collection_words(collection_id);`,
  );
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_cw_word ON collection_words(word_id);`,
  );

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      exercise_type TEXT,
      response INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      score_before INTEGER NOT NULL,
      score_after INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);`,
  );
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_activity_word ON activity_log(word_id);`,
  );

  return db;
}
