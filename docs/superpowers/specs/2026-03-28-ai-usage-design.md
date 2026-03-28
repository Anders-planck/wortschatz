# WortSchatz — AI Usage Tracking

## Overview

Track all Gemini AI API usage (tokens, cost, call count) per feature, display in a dedicated settings page with trend charts, feature breakdown, and configurable monthly budget with alerts.

## Problem

The app makes ~10 different AI calls (enrichment, exercises, chat, readings, listening, word families, synonyms, collections) but discards `result.usage` data. Users have no visibility into how much AI they're consuming or spending.

## Solution

### Architecture: Centralized Middleware (Approach A)

A single `trackAiCall(feature, fn)` wrapper intercepts every AI call, extracts `result.usage` (tokens), calculates cost, and persists to SQLite. All 10 AI functions get wrapped — one line change each.

### Data Model

New SQLite table:

```sql
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature TEXT NOT NULL,        -- 'chat' | 'exercises' | 'readings' | 'listening' | 'enrichment' | 'synonyms' | 'word_family' | 'collections'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,       -- calculated from token counts × price
  model TEXT NOT NULL,           -- 'gemini-2.5-flash-lite'
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature);
```

New settings key: `ai_monthly_budget` (number, default 5.00 USD).

### Middleware: `trackAiCall`

Location: `src/features/shared/services/ai-usage-tracker.ts`

```typescript
type AiFeature = 'chat' | 'exercises' | 'readings' | 'listening' | 'enrichment' | 'synonyms' | 'word_family' | 'collections';

// For generateText calls
async function trackAiCall<T>(feature: AiFeature, fn: () => Promise<GenerateTextResult<T>>): Promise<GenerateTextResult<T>>;

// For streamText calls — logs after stream completes
function trackAiStream(feature: AiFeature, stream: StreamTextResult): StreamTextResult;
```

**For `generateText`:** Wraps the call, extracts `result.usage`, calculates cost, INSERT into `ai_usage_log`, returns original result unchanged.

**For `streamText`:** Returns the stream as-is (no latency impact). Attaches a `.then()` on `stream.usage` Promise to log after streaming completes.

### Cost Calculation

Gemini 2.5 Flash Lite pricing (per 1M tokens):
- Input: $0.075
- Output: $0.30

```typescript
const PRICING = {
  'gemini-2.5-flash-lite': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
};
```

### AI Call Sites to Wrap (10 functions)

| File | Function | Feature Key |
|------|----------|-------------|
| `dictionary/services/ai-context-service.ts` | `generateWordContext` | `enrichment` |
| `exercises/services/exercise-generator.ts` | `generateFillBlank` | `exercises` |
| `exercises/services/exercise-generator.ts` | `generateCaseQuiz` | `exercises` |
| `chat/services/chat-service.ts` | `streamChatResponse` | `chat` |
| `collections/services/ai-collections-service.ts` | `triageWords` | `collections` |
| `collections/services/ai-collections-service.ts` | `autoPopulateCollection` | `collections` |
| `immersion/services/immersion-ai-service.ts` | `generateWordFamily` | `word_family` |
| `immersion/services/immersion-ai-service.ts` | `generateSynonymsAntonyms` | `synonyms` |
| `immersion/services/immersion-ai-service.ts` | `generateReading` | `readings` |
| `immersion/services/immersion-ai-service.ts` | `generateListeningExercises` | `listening` |

### Usage Repository

Location: `src/features/settings/services/ai-usage-repository.ts`

Functions:
- `logUsage(entry)` — INSERT single row
- `getUsageByPeriod(days)` — daily aggregated cost for chart
- `getUsageSummary(days)` — total cost, tokens, calls for period
- `getUsageByFeature(days)` — per-feature breakdown
- `getCurrentMonthCost()` — sum cost_usd WHERE created_at in current month
- `getTotalUsage()` — all-time totals

### Settings Page

Route: `src/app/(settings)/ai-usage.tsx`

Entry point: new row in existing settings page with SymbolView `cpu` icon, navigates to ai-usage screen.

#### Sections (top to bottom):

1. **Budget bar** — monthly budget progress with "Modifica" link to change budget. Progress bar turns `danger` color when over budget. Shows remaining amount.

2. **Segmented control** — 7g / 30g / Tutto. Controls the period for chart + summary + breakdown below.

3. **Trend chart** — SVG area chart showing daily cost over selected period. Same style as existing `react-native-svg` charts in stats page.

4. **Summary row** — 3 mini stat cards: Costo ($), Token (formatted K/M), Chiamate (count).

5. **Feature breakdown** — list of 6 feature groups (Chat, Esercizi, Lettura, Ascolto, Vocabolario, Collezioni) each with:
   - Feature icon (SymbolView)
   - Proportional bar (width relative to highest-cost feature)
   - Cost + token count + call count

Feature grouping:
- "Vocabolario" = enrichment + synonyms + word_family (combined)
- Others map 1:1

### Budget Alert

When `getCurrentMonthCost() > ai_monthly_budget`:
- Budget bar turns `danger` color
- Remaining text shows negative amount in red
- No blocking — just visual warning (AI calls continue)

### Feature Directory

```
src/features/settings/
  services/
    ai-usage-repository.ts    -- query functions
  components/
    ai-usage-chart.tsx         -- SVG trend chart
    ai-usage-summary.tsx       -- 3 stat cards
    ai-usage-breakdown.tsx     -- feature list with bars
    ai-budget-card.tsx         -- budget progress

src/features/shared/
  services/
    ai-usage-tracker.ts        -- trackAiCall / trackAiStream middleware

src/app/(settings)/
  ai-usage.tsx                 -- route
```

## Acceptance Criteria

- [ ] Every AI call logs tokens + cost to `ai_usage_log`
- [ ] Settings page shows "Uso AI" row that opens usage page
- [ ] Budget card shows current month spend vs budget
- [ ] Budget bar turns red when over budget
- [ ] Segmented control switches chart + summary + breakdown period
- [ ] Trend chart shows daily cost with area fill
- [ ] Summary shows total cost, tokens, calls for period
- [ ] Feature breakdown shows per-feature cost with proportional bars
- [ ] Budget is editable from the usage page
- [ ] `npx tsc --noEmit` passes
