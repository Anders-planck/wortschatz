import { getDatabase } from "@/features/shared/db/database";

export type AiFeature =
  | "chat"
  | "exercises"
  | "readings"
  | "listening"
  | "enrichment"
  | "synonyms"
  | "word_family"
  | "collections";

const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash-lite": {
    input: 0.075 / 1_000_000,
    output: 0.3 / 1_000_000,
  },
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = DEFAULT_MODEL,
): number {
  const pricing = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  return inputTokens * pricing.input + outputTokens * pricing.output;
}

async function logUsage(
  feature: AiFeature,
  inputTokens: number,
  outputTokens: number,
  model: string,
): Promise<void> {
  try {
    const cost = calculateCost(inputTokens, outputTokens, model);
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO ai_usage_log (feature, input_tokens, output_tokens, cost_usd, model, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        feature,
        inputTokens,
        outputTokens,
        cost,
        model,
        new Date().toISOString(),
      ],
    );
  } catch {
    // Non-blocking — usage tracking should never break AI calls
  }
}

/**
 * Wraps a generateText call to track usage.
 * AI SDK v6 exposes usage via getter (not enumerable) with fields:
 *   inputTokens, outputTokens, totalTokens
 * Also available as result.totalUsage for multi-step calls.
 */
export async function trackAiCall<T>(
  feature: AiFeature,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();

  // AI SDK v6: usage is a getter, access directly via property name
  // totalUsage is the enumerable version that includes all steps
  const r = result as {
    usage?: Record<string, unknown>;
    totalUsage?: Record<string, unknown>;
  };
  const usage = r.usage ?? r.totalUsage;

  if (usage) {
    const input = (usage.inputTokens as number) ?? 0;
    const output = (usage.outputTokens as number) ?? 0;
    if (input > 0 || output > 0) {
      logUsage(feature, input, output, DEFAULT_MODEL);
    }
  }

  return result;
}

/**
 * Wraps a streamText result to track usage after streaming completes.
 * stream.usage resolves when stream finishes with LanguageModelUsage.
 */
export function trackAiStream<T extends { usage: PromiseLike<unknown> }>(
  feature: AiFeature,
  stream: T,
): T {
  Promise.resolve(stream.usage)
    .then((usage: unknown) => {
      const u = usage as Record<string, unknown> | undefined;
      if (!u) return;
      const input = (u.inputTokens as number) ?? 0;
      const output = (u.outputTokens as number) ?? 0;
      if (input > 0 || output > 0) {
        logUsage(feature, input, output, DEFAULT_MODEL);
      }
    })
    .catch(() => {
      // Non-blocking
    });

  return stream;
}
