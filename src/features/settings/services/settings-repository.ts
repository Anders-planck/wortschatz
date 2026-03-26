import { getDatabase } from "@/features/shared/db/database";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function getAppSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM settings",
  );

  const settings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (row.key in settings) {
      try {
        (settings as Record<string, unknown>)[row.key] = JSON.parse(row.value);
      } catch {
        // Keep default on parse error
      }
    }
  }

  return settings;
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await setSetting(key, JSON.stringify(value));
}

export async function getSpeechRate(): Promise<number> {
  const raw = await getSetting("speechRate");
  if (raw === null) return DEFAULT_SETTINGS.speechRate;
  try {
    const rate = JSON.parse(raw);
    return typeof rate === "number" ? rate : DEFAULT_SETTINGS.speechRate;
  } catch {
    return DEFAULT_SETTINGS.speechRate;
  }
}
