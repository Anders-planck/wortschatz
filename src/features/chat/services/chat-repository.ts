import { getDatabase } from "@/features/shared/db/database";
import type { ChatMessage } from "../types";

export interface SavedChatSession {
  id: number;
  scenario: string;
  messagesCount: number;
  correctionsCount: number;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export async function saveChatSession(data: {
  id?: number;
  scenario: string;
  messages: ChatMessage[];
  correctionsCount: number;
  correctCount: number;
  newWords: string[];
  durationSeconds: number;
}): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (data.id != null) {
    await db.runAsync(
      `UPDATE chat_sessions
       SET scenario = ?,
           messages = ?,
           corrections_count = ?,
           correct_count = ?,
           new_words = ?,
           duration_seconds = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        data.scenario,
        JSON.stringify(data.messages),
        data.correctionsCount,
        data.correctCount,
        JSON.stringify(data.newWords),
        data.durationSeconds,
        now,
        data.id,
      ],
    );
    return data.id;
  }

  const result = await db.runAsync(
    `INSERT INTO chat_sessions (
       scenario,
       messages,
       corrections_count,
       correct_count,
       new_words,
       duration_seconds,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.scenario,
      JSON.stringify(data.messages),
      data.correctionsCount,
      data.correctCount,
      JSON.stringify(data.newWords),
      data.durationSeconds,
      now,
      now,
    ],
  );
  return result.lastInsertRowId;
}

function parseMessages(raw: string): ChatMessage[] {
  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function parseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function getRecentChatSessions(
  limit: number = 10,
): Promise<SavedChatSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    scenario: string;
    messages_count: number;
    corrections_count: number;
    duration_seconds: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT
       id,
       scenario,
       json_array_length(messages) as messages_count,
       corrections_count,
       duration_seconds,
       created_at,
       updated_at
     FROM chat_sessions
     ORDER BY updated_at DESC, created_at DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    id: r.id,
    scenario: r.scenario,
    messagesCount: r.messages_count,
    correctionsCount: r.corrections_count,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getChatSessionsByScenario(
  scenarioId: string,
): Promise<SavedChatSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    scenario: string;
    messages_count: number;
    corrections_count: number;
    duration_seconds: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT
       id,
       scenario,
       json_array_length(messages) as messages_count,
       corrections_count,
       duration_seconds,
       created_at,
       updated_at
     FROM chat_sessions
     WHERE scenario = ?
     ORDER BY updated_at DESC, created_at DESC`,
    [scenarioId],
  );

  return rows.map((r) => ({
    id: r.id,
    scenario: r.scenario,
    messagesCount: r.messages_count,
    correctionsCount: r.corrections_count,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getChatSession(id: number): Promise<{
  id: number;
  scenario: string;
  messages: ChatMessage[];
  correctionsCount: number;
  correctCount: number;
  newWords: string[];
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    scenario: string;
    messages: string;
    corrections_count: number;
    correct_count: number;
    new_words: string;
    duration_seconds: number;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT
       id,
       scenario,
       messages,
       corrections_count,
       correct_count,
       new_words,
       duration_seconds,
       created_at,
       updated_at
     FROM chat_sessions
     WHERE id = ?`,
    [id],
  );
  if (!row) return null;

  return {
    id: row.id,
    scenario: row.scenario,
    messages: parseMessages(row.messages),
    correctionsCount: row.corrections_count,
    correctCount: row.correct_count,
    newWords: parseStringArray(row.new_words),
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteChatSession(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM chat_sessions WHERE id = ?", [id]);
}

export async function deleteChatSessions(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(", ");
  await db.runAsync(
    `DELETE FROM chat_sessions WHERE id IN (${placeholders})`,
    ids,
  );
}
