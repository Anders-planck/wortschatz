# WortSchatz — FSRS Spaced Repetition + Review Forecast

## Overview

Replace the custom score-based spaced repetition with FSRS (Free Spaced Repetition Scheduler) via `ts-fsrs`, and add a 7-day review forecast to the dashboard.

## Problem

The current SR system uses a simple score (-5 to 10) with 4 fixed intervals (1h/8h/24h/72h) and a crude multiplier. No ease factor, no repetition tracking, no forgetting curve. Words come back too early or too late — inefficient for reaching B2 in 12 months.

## Solution

### Dependency

`ts-fsrs` — TypeScript implementation of FSRS, the algorithm that replaced SM-2 in Anki. 20-30% fewer reviews for the same retention. Supports Bun/ESM.

### DB Schema Changes

Add 9 columns to `words` table:

```sql
ALTER TABLE words ADD COLUMN sr_due TEXT;
ALTER TABLE words ADD COLUMN sr_stability REAL NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_difficulty REAL NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_elapsed_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_scheduled_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_reps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_lapses INTEGER NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_state INTEGER NOT NULL DEFAULT 0;
ALTER TABLE words ADD COLUMN sr_last_review TEXT;
```

`review_score` and `next_review` remain for backward compatibility (stats, tricky words display). `sr_due` replaces `next_review` for scheduling.

### FSRS Integration

Location: `src/features/review/hooks/use-spaced-repetition.ts`

Replace `calculateNextReview()` with FSRS:

```typescript
import { fsrs, generatorParameters, Rating, Card, State } from "ts-fsrs";

const params = generatorParameters({ maximum_interval: 365 });
const f = fsrs(params);

// On review response:
const card: Card = wordToFsrsCard(word);  // map DB fields → FSRS Card
const now = new Date();
const scheduling = f.repeat(card, now);
const result = scheduling[rating];        // Rating.Again/Hard/Good/Easy
const newCard = result.card;
// Save newCard fields back to DB
```

Rating mapping (unchanged UI):
- Again button → `Rating.Again` (1)
- Hard button → `Rating.Hard` (2)
- Good button → `Rating.Good` (3)
- Easy button → `Rating.Easy` (4)

### Word Selection Query

Replace current query in `words-repository.ts`:

```sql
SELECT * FROM words
WHERE sr_due IS NULL OR sr_due <= ?
ORDER BY
  CASE sr_state
    WHEN 0 THEN 0  -- New words first
    WHEN 1 THEN 1  -- Learning
    WHEN 3 THEN 2  -- Relearning
    WHEN 2 THEN 3  -- Review
  END,
  sr_due ASC
LIMIT ?
```

Priority: New → Learning → Relearning → Review, then by due date.

### Migration

Existing words (review_score set, sr_state = 0) are treated as new cards on first FSRS review. No data migration needed — FSRS handles new cards naturally.

### Review Forecast

New component: `src/features/review/components/review-forecast.tsx`

Query:
```sql
SELECT DATE(sr_due) as day, COUNT(*) as count
FROM words
WHERE sr_due IS NOT NULL AND DATE(sr_due) <= DATE('now', '+7 days')
GROUP BY day ORDER BY day
```

UI: 7 horizontal cells (today + 6 days). Each cell shows:
- Day label (Lun/Mar/Mer/...)
- Word count number
- Color intensity: 0 = ghost, 1-5 = success, 6-15 = accent, 16+ = danger

Position: dashboard, between WeeklyChart and TodaySessionCard.

### Backward Compatibility

`review_score` continues to be updated in parallel:
- Again: -2
- Hard: -1
- Good: +1
- Easy: +2

This keeps tricky words list (score < 0) and stats working.

## Files to Modify

- `package.json` — add `ts-fsrs`
- `src/features/shared/db/database.ts` — ALTER TABLE for sr_* columns
- `src/features/shared/db/words-repository.ts` — new query using sr_due, helper to map Word ↔ FSRS Card
- `src/features/review/hooks/use-spaced-repetition.ts` — replace algorithm with ts-fsrs
- `src/features/review/hooks/use-review-dashboard.ts` — add forecast query
- `src/app/(review)/index.tsx` — add ReviewForecast component

## Files to Create

- `src/features/review/components/review-forecast.tsx` — forecast UI
- `src/features/review/services/forecast-repository.ts` — forecast query

## What Does NOT Change

- Review card UI — same 4 buttons (Again/Hard/Good/Easy)
- Session flow — same batch (12 words), reveal, respond
- Activity logging — same activity_log INSERT
- Stats page — same data sources
- Tricky words — still based on review_score

## Acceptance Criteria

- [ ] `ts-fsrs` installed and working with Bun/Expo
- [ ] FSRS Card state persisted in 9 new columns
- [ ] Review scheduling uses FSRS intervals instead of fixed multipliers
- [ ] Words selected by sr_due with priority ordering
- [ ] Review forecast shows next 7 days in dashboard
- [ ] review_score still updated for backward compat
- [ ] Existing words work as new FSRS cards on first review
- [ ] `npx tsc --noEmit` passes
