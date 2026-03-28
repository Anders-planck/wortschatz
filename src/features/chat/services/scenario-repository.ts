import { getDatabase } from "@/features/shared/db/database";
import type { Scenario } from "../types";

interface ScenarioRow {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  is_default: number;
  created_at: string;
}

function rowToScenario(row: ScenarioRow): Scenario & { isDefault: boolean } {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    level: row.level,
    isDefault: row.is_default === 1,
  };
}

export async function getAllScenarios(): Promise<
  (Scenario & { isDefault: boolean })[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ScenarioRow>(
    "SELECT * FROM chat_scenarios ORDER BY is_default DESC, created_at ASC",
  );
  return rows.map(rowToScenario);
}

export async function createScenario(data: {
  title: string;
  description: string;
  icon: string;
  level: string;
}): Promise<string> {
  const db = await getDatabase();
  const id =
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) +
    "-" +
    Date.now().toString(36);

  await db.runAsync(
    `INSERT INTO chat_scenarios (id, title, description, icon, level, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      data.title,
      data.description,
      data.icon,
      data.level,
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function deleteScenario(id: string): Promise<void> {
  const db = await getDatabase();
  // Cascade: delete all conversations for this scenario
  await db.runAsync("DELETE FROM chat_sessions WHERE scenario = ?", [id]);
  await db.runAsync("DELETE FROM chat_scenarios WHERE id = ?", [id]);
}

export async function deleteScenarios(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(", ");
  // Cascade: delete all conversations for these scenarios
  await db.runAsync(
    `DELETE FROM chat_sessions WHERE scenario IN (${placeholders})`,
    ids,
  );
  await db.runAsync(
    `DELETE FROM chat_scenarios WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function getScenarioById(
  id: string,
): Promise<(Scenario & { isDefault: boolean }) | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ScenarioRow>(
    "SELECT * FROM chat_scenarios WHERE id = ?",
    [id],
  );
  return row ? rowToScenario(row) : null;
}
