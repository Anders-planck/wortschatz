import { getDatabase } from "@/features/shared/db/database";
import { rollingWeekDays, toLocalDateStr } from "@/features/shared/utils/date";

export type StudySessionType =
  | "review"
  | "exercise"
  | "chat"
  | "reading"
  | "listening";

export interface StudySession {
  id: number;
  activityType: StudySessionType;
  label: string;
  itemCount: number;
  correctCount: number | null;
  durationSeconds: number;
  dateLocal: string;
  createdAt: string;
}

interface StudySessionRow {
  id: number;
  activity_type: StudySessionType;
  label: string;
  item_count: number;
  correct_count: number | null;
  duration_seconds: number;
  date_local: string;
  created_at: string;
}

function rowToStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    activityType: row.activity_type,
    label: row.label,
    itemCount: row.item_count,
    correctCount: row.correct_count,
    durationSeconds: row.duration_seconds,
    dateLocal: row.date_local,
    createdAt: row.created_at,
  };
}

export async function logStudySession(input: {
  activityType: StudySessionType;
  label: string;
  itemCount: number;
  correctCount?: number | null;
  durationSeconds: number;
  createdAt?: string;
}): Promise<number> {
  const db = await getDatabase();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const createdAtDate = new Date(createdAt);
  const result = await db.runAsync(
    `INSERT INTO study_sessions (
       activity_type,
       label,
       item_count,
       correct_count,
       duration_seconds,
       date_local,
       created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.activityType,
      input.label,
      input.itemCount,
      input.correctCount ?? null,
      input.durationSeconds,
      toLocalDateStr(createdAtDate),
      createdAt,
    ],
  );
  return result.lastInsertRowId;
}

export async function getStudyActivityToday(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM study_sessions WHERE date_local = ?`,
    [toLocalDateStr(new Date())],
  );
  return row?.count ?? 0;
}

export async function getStudyActivityByDay(
  days: number,
): Promise<{ day: string; count: number }[]> {
  const db = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT date_local as day, COUNT(*) as count
     FROM study_sessions
     WHERE date_local >= ?
     GROUP BY date_local
     ORDER BY date_local ASC`,
    [toLocalDateStr(cutoff)],
  );
  return rows;
}

export async function getWeeklyStudyActivity(): Promise<number[]> {
  const rows = await getStudyActivityByDay(6);
  const countByDay = new Map(rows.map((row) => [row.day, row.count]));
  return rollingWeekDays().map(({ dateStr }) => countByDay.get(dateStr) ?? 0);
}

export async function getStudyStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date_local as day
     FROM study_sessions
     WHERE date_local != ''
     ORDER BY date_local DESC
     LIMIT 365`,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < rows.length; index++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - index);
    if (rows[index].day === toLocalDateStr(expected)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getLastStudyDate(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ date_local: string }>(
    `SELECT date_local
     FROM study_sessions
     WHERE date_local != ''
     ORDER BY date_local DESC, created_at DESC
     LIMIT 1`,
  );
  return row?.date_local ?? null;
}

export async function getRecentStudySessions(
  limit: number,
): Promise<StudySession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StudySessionRow>(
    `SELECT *
     FROM study_sessions
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map(rowToStudySession);
}
