import { getDatabase } from "@/features/shared/db/database";
import type { ChatMessage } from "../types";

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
