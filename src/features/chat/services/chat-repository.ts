import { getDatabase } from "@/features/shared/db/database";
import type { ChatMessage } from "../types";

export interface SavedChatSession {
  id: number;
  scenario: string;
  messagesCount: number;
  correctionsCount: number;
  durationSeconds: number;
  createdAt: string;
}

export async function saveChatSession(data: {
  scenario: string;
  messages: ChatMessage[];
  correctionsCount: number;
  correctCount: number;
  newWords: string[];
  durationSeconds: number;
}): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO chat_sessions (scenario, messages, corrections_count, correct_count, new_words, duration_seconds, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.scenario,
      JSON.stringify(data.messages),
      data.correctionsCount,
      data.correctCount,
      JSON.stringify(data.newWords),
      data.durationSeconds,
      new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

export async function getRecentChatSessions(
  limit: number = 10,
): Promise<SavedChatSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    scenario: string;
    messages: string;
    corrections_count: number;
    duration_seconds: number;
    created_at: string;
  }>(
    `SELECT id, scenario, messages, corrections_count, duration_seconds, created_at
     FROM chat_sessions
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((r) => {
    let messagesCount = 0;
    try {
      messagesCount = (JSON.parse(r.messages) as unknown[]).length;
    } catch {
      // ignore
    }
    return {
      id: r.id,
      scenario: r.scenario,
      messagesCount,
      correctionsCount: r.corrections_count,
      durationSeconds: r.duration_seconds,
      createdAt: r.created_at,
    };
  });
}

export async function getChatSessionsByScenario(
  scenarioId: string,
): Promise<SavedChatSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    scenario: string;
    messages: string;
    corrections_count: number;
    duration_seconds: number;
    created_at: string;
  }>(
    `SELECT id, scenario, messages, corrections_count, duration_seconds, created_at
     FROM chat_sessions
     WHERE scenario = ?
     ORDER BY created_at DESC`,
    [scenarioId],
  );

  return rows.map((r) => {
    let messagesCount = 0;
    try {
      messagesCount = (JSON.parse(r.messages) as unknown[]).length;
    } catch {
      // ignore
    }
    return {
      id: r.id,
      scenario: r.scenario,
      messagesCount,
      correctionsCount: r.corrections_count,
      durationSeconds: r.duration_seconds,
      createdAt: r.created_at,
    };
  });
}

export async function getChatSessionMessages(
  id: number,
): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ messages: string }>(
    "SELECT messages FROM chat_sessions WHERE id = ?",
    [id],
  );
  if (!row) return [];
  try {
    return JSON.parse(row.messages) as ChatMessage[];
  } catch {
    return [];
  }
}

export async function deleteChatSession(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM chat_sessions WHERE id = ?", [id]);
}
