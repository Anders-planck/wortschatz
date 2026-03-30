# Forecast UX Improvement — Design Spec

## Problem

The "PROSSIME REVIEW" forecast card on the Ripasso dashboard shows a single count per day (e.g., "OGGI 20, MAR 0, MER 0..."). After a review session, the count barely changes because FSRS schedules learning-phase cards for minutes later (still "today"). Users see no progress and don't understand why future days remain at 0.

The root cause: the forecast conflates three fundamentally different card populations into one number.

## Solution

Split the forecast by FSRS card state, show intervals on response buttons, and add a "next session" hint for learning cards.

## Changes

### 1. Forecast Card — State Breakdown Chips

Add colored chips above the 7-day grid showing today's composition:

| Chip | FSRS States | Color | Condition |
|------|-------------|-------|-----------|
| **N pronte** | sr_state=2 with sr_due <= now, OR sr_state=3 with sr_due <= now | `success` (#4A9A4A) | sr_due <= now AND state in (2,3) |
| **N in corso** | sr_state=1 with sr_due > now (intraday learning) | amber (#D4944A) | sr_state=1 AND sr_due > now AND DATE(sr_due)=today |
| **N nuove** | sr_due IS NULL (never reviewed) | blue (#7A9EC0) | sr_due IS NULL |

Chips only render when their count > 0.

**Data source**: New query `getReviewForecastBreakdown()` in `forecast-repository.ts`:

```sql
-- Ready now (review + relearning cards due)
SELECT COUNT(*) FROM words WHERE sr_due IS NOT NULL AND sr_due <= ? AND sr_state IN (2, 3)

-- Learning (due later today)
SELECT COUNT(*) FROM words WHERE sr_state = 1 AND sr_due > ? AND DATE(sr_due, 'localtime') = DATE('now', 'localtime')

-- New (never reviewed)
SELECT COUNT(*) FROM words WHERE sr_due IS NULL
```

### 2. Forecast Card — Next Session Hint

When learning cards exist (in-corso count > 0), show a hint below the forecast grid:

```
[pulse dot] Prossima sessione tra 12 min — 9 parole in apprendimento
```

**Calculation**: Find the earliest `sr_due` where `sr_state = 1 AND sr_due > now`. Compute the diff from now in minutes. Display "tra X min" or "tra X ore".

This replaces the confusing "all today, nothing tomorrow" with actionable information: come back in N minutes.

### 3. Today Session Card — State-Colored Breakdown

Replace "11 words" with "8 pronte · 3 nuove":

- Count ready words: `sr_due <= now AND sr_state IN (2, 3)` + `sr_due <= now AND sr_state IN (0, 1)`
- Count new words: `sr_due IS NULL`
- Progress dots colored by state (green for ready, blue for new)

### 4. Response Buttons — Show Intervals

During a review session, each response button shows the resulting interval:

```
[ Ancora ]  [ Difficile ]  [ Bene ]  [ Facile ]
[   1m   ]  [    6m     ]  [  10m ]  [   4g   ]
```

**Implementation**: Before rendering buttons, call `f.repeat(card, now)` from ts-fsrs to preview all 4 scheduling outcomes. Extract `newCard.due` from each and compute the human-readable interval:

```typescript
function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}g`;
}
```

This is the single highest-value UX addition per SRS research — every major app (Anki, RemNote, WaniKani) shows this.

## Files to Modify

| File | Change |
|------|--------|
| `src/features/review/services/forecast-repository.ts` | Add `getReviewForecastBreakdown()` returning `{ ready, learning, newCount, nextLearningDue }` |
| `src/features/review/hooks/use-review-dashboard.ts` | Fetch breakdown data alongside existing forecast |
| `src/features/review/components/review-forecast.tsx` | Add state chips, next-session hint |
| `src/features/review/components/today-session-card.tsx` | Show "N pronte · N nuove" breakdown, colored dots |
| `src/features/review/components/response-buttons.tsx` | Add interval labels below button icons |
| `src/features/review/hooks/use-review-session.ts` | Compute interval previews via `f.repeat()` |

## Files NOT Modified

- `activity-repository.ts` — no changes, activity logging is separate
- `database.ts` — no schema changes needed, all data already in `words` table
- `stats-card.tsx` — stats page is independent, not in scope

## Type Changes

```typescript
// New type in forecast-repository.ts
interface ForecastBreakdown {
  ready: number;        // review/relearning cards due now
  learning: number;     // learning cards due later today
  newCount: number;     // never reviewed
  nextLearningDue: string | null;  // ISO string of earliest learning card due
}

// Extended props for ResponseButtons
interface ResponseButtonsProps {
  onResponse: (response: Response) => void;
  disabled?: boolean;
  intervals?: string[];  // ["1m", "6m", "10m", "4g"]
}

// Extended props for TodaySessionCard
interface TodaySessionCardProps {
  wordCount: number;
  readyCount: number;
  newCount: number;
  onStart: () => void;
}
```

## Edge Cases

- **No learning cards**: Hide the "next session" hint entirely
- **All cards are new**: Show only the blue "N nuove" chip
- **Learning card due in < 1 min**: Show "tra <1 min"
- **Empty word list**: Show existing empty state, no chips
- **Intervals > 30 days**: Show "1M" (mesi) for > 30g

## Visual Reference

Mockup: `mockup-forecast.html` in project root (delete after implementation).
