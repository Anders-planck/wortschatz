import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("learn-lang.db");

  // ── Schema DDL (batched) ──────────────────────────────────────────────────

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
      created_at TEXT NOT NULL,
      sr_due TEXT,
      sr_stability REAL NOT NULL DEFAULT 0,
      sr_difficulty REAL NOT NULL DEFAULT 0,
      sr_elapsed_days INTEGER NOT NULL DEFAULT 0,
      sr_scheduled_days INTEGER NOT NULL DEFAULT 0,
      sr_reps INTEGER NOT NULL DEFAULT 0,
      sr_lapses INTEGER NOT NULL DEFAULT 0,
      sr_state INTEGER NOT NULL DEFAULT 0,
      sr_last_review TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_words_term ON words (term COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_words_next_review ON words (next_review);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'folder.fill',
      color TEXT NOT NULL DEFAULT '#D4A44A',
      is_ai_generated INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_words (
      collection_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (collection_id, word_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cw_collection ON collection_words(collection_id);
    CREATE INDEX IF NOT EXISTS idx_cw_word ON collection_words(word_id);

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      exercise_type TEXT,
      response INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      score_before INTEGER NOT NULL,
      score_after INTEGER NOT NULL,
      date_local TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_word ON activity_log(word_id);
    CREATE INDEX IF NOT EXISTS idx_activity_date_local ON activity_log(date_local);

    CREATE TABLE IF NOT EXISTS ai_usage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      model TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature);

    CREATE TABLE IF NOT EXISTS chat_scenarios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'text.bubble',
      level TEXT NOT NULL DEFAULT 'Adaptive',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      content TEXT NOT NULL,
      word_translations TEXT NOT NULL DEFAULT '{}',
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      corrections_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      new_words TEXT NOT NULL DEFAULT '[]',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // ── Migrations ────────────────────────────────────────────────────────────

  // FSRS columns on words
  const srColumns = [
    "sr_due TEXT",
    "sr_stability REAL NOT NULL DEFAULT 0",
    "sr_difficulty REAL NOT NULL DEFAULT 0",
    "sr_elapsed_days INTEGER NOT NULL DEFAULT 0",
    "sr_scheduled_days INTEGER NOT NULL DEFAULT 0",
    "sr_reps INTEGER NOT NULL DEFAULT 0",
    "sr_lapses INTEGER NOT NULL DEFAULT 0",
    "sr_state INTEGER NOT NULL DEFAULT 0",
    "sr_last_review TEXT",
  ];
  await Promise.all(
    srColumns.map((col) =>
      db!.execAsync(`ALTER TABLE words ADD COLUMN ${col}`).catch(() => {}),
    ),
  );

  // date_local column on activity_log (migration for existing rows)
  try {
    await db.execAsync(
      "ALTER TABLE activity_log ADD COLUMN date_local TEXT NOT NULL DEFAULT ''",
    );
  } catch {
    // Column already exists
  }
  // Backfill empty date_local from created_at
  await db.runAsync(
    `UPDATE activity_log SET date_local = DATE(created_at, 'localtime') WHERE date_local = ''`,
  );

  // ── Seed default scenarios ────────────────────────────────────────────────

  const seeded = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'scenarios_seeded'",
  );
  if (!seeded) {
    const now = new Date().toISOString();
    await db.execAsync(`
      INSERT OR IGNORE INTO chat_scenarios (id, title, description, icon, level, is_default, created_at) VALUES
        ('free', 'Conversazione libera', 'Parla di qualsiasi argomento', 'text.bubble', 'Adaptive', 1, '${now}'),
        ('supermarket', 'Al supermercato', 'Fare la spesa, prezzi, prodotti', 'cart', 'A2', 1, '${now}'),
        ('job-interview', 'Colloquio di lavoro', 'Competenze, esperienza, domande', 'building.2', 'B1', 1, '${now}'),
        ('apartment', 'Cercare un appartamento', 'Affitto, stanze, quartiere', 'house', 'A2-B1', 1, '${now}'),
        ('doctor', 'Dal dottore', 'Sintomi, ricette, visite', 'cross.case', 'B1', 1, '${now}');
    `);
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES ('scenarios_seeded', '1')",
    );
  }

  return db;
}
