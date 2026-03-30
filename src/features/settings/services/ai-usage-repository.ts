import { getDatabase } from "@/features/shared/db/database";
import { toLocalDateStr } from "@/features/shared/utils/date";

export interface UsageDayPoint {
  date: string;
  cost: number;
}

export interface UsageSummary {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
}

export interface FeatureUsage {
  feature: string;
  cost: number;
  tokens: number;
  calls: number;
}

function daysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalDateStr(d);
}

function monthStartLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getUsageByPeriod(
  days: number | null,
): Promise<UsageDayPoint[]> {
  const db = await getDatabase();
  const where =
    days != null ? `WHERE date(created_at) >= '${daysAgoLocal(days)}'` : "";

  const rows = await db.getAllAsync<{ day: string; cost: number }>(
    `SELECT date(created_at) as day, SUM(cost_usd) as cost
     FROM ai_usage_log ${where}
     GROUP BY day ORDER BY day ASC`,
  );

  return rows.map((r) => ({ date: r.day, cost: r.cost }));
}

export async function getUsageSummary(
  days: number | null,
): Promise<UsageSummary> {
  const db = await getDatabase();
  const where =
    days != null ? `WHERE date(created_at) >= '${daysAgoLocal(days)}'` : "";

  const row = await db.getFirstAsync<{
    total_cost: number;
    total_tokens: number;
    total_calls: number;
  }>(
    `SELECT
       COALESCE(SUM(cost_usd), 0) as total_cost,
       COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
       COUNT(*) as total_calls
     FROM ai_usage_log ${where}`,
  );

  return {
    totalCost: row?.total_cost ?? 0,
    totalTokens: row?.total_tokens ?? 0,
    totalCalls: row?.total_calls ?? 0,
  };
}

export async function getUsageByFeature(
  days: number | null,
): Promise<FeatureUsage[]> {
  const db = await getDatabase();
  const where =
    days != null ? `WHERE date(created_at) >= '${daysAgoLocal(days)}'` : "";

  const rows = await db.getAllAsync<{
    feature: string;
    cost: number;
    tokens: number;
    calls: number;
  }>(
    `SELECT
       feature,
       SUM(cost_usd) as cost,
       SUM(input_tokens + output_tokens) as tokens,
       COUNT(*) as calls
     FROM ai_usage_log ${where}
     GROUP BY feature ORDER BY cost DESC`,
  );

  return rows;
}

export async function getCurrentMonthCost(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cost: number }>(
    `SELECT COALESCE(SUM(cost_usd), 0) as cost
     FROM ai_usage_log
     WHERE date(created_at) >= '${monthStartLocal()}'`,
  );
  return row?.cost ?? 0;
}
