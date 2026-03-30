# Forecast UX Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the review forecast by FSRS card state, show intervals on response buttons, and add a "next session" hint for learning cards.

**Architecture:** Add a `getReviewForecastBreakdown()` query to the forecast repository, pipe it through the dashboard hook to two UI components (ReviewForecast, TodaySessionCard). Separately, compute interval previews in the review session hook and pass them to ResponseButtons.

**Tech Stack:** React Native, Expo, ts-fsrs, expo-sqlite, expo-symbols

---

### Task 1: Add `getReviewForecastBreakdown()` to forecast repository

**Files:**
- Modify: `src/features/review/services/forecast-repository.ts`

- [ ] **Step 1: Add the ForecastBreakdown type and query function**

Add this after the existing `ForecastDay` interface and `getReviewForecast` function in `forecast-repository.ts`:

```typescript
export interface ForecastBreakdown {
  ready: number;
  learning: number;
  newCount: number;
  nextLearningDue: string | null;
}

export async function getReviewForecastBreakdown(): Promise<ForecastBreakdown> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const [readyRow, learningRow, newRow, nextDueRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words
       WHERE sr_due IS NOT NULL AND sr_due <= ? AND sr_state IN (2, 3)`,
      [now],
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words
       WHERE sr_state = 1 AND sr_due > ?`,
      [now],
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM words WHERE sr_due IS NULL`,
    ),
    db.getFirstAsync<{ due: string }>(
      `SELECT sr_due as due FROM words
       WHERE sr_state = 1 AND sr_due > ?
       ORDER BY sr_due ASC LIMIT 1`,
      [now],
    ),
  ]);

  return {
    ready: readyRow?.count ?? 0,
    learning: learningRow?.count ?? 0,
    newCount: newRow?.count ?? 0,
    nextLearningDue: nextDueRow?.due ?? null,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/features/review/services/forecast-repository.ts
git commit -m "feat(review): add getReviewForecastBreakdown query"
```

---

### Task 2: Wire breakdown data through dashboard hook

**Files:**
- Modify: `src/features/review/hooks/use-review-dashboard.ts`

- [ ] **Step 1: Import and add state for breakdown**

In `use-review-dashboard.ts`, add the import:

```typescript
import {
  getReviewForecast,
  getReviewForecastBreakdown,
  type ForecastBreakdown,
} from "@/features/review/services/forecast-repository";
```

Remove the existing single import of `getReviewForecast` and `type ForecastDay`.

Add to the `DashboardData` interface:

```typescript
breakdown: ForecastBreakdown;
```

Add state:

```typescript
const [breakdown, setBreakdown] = useState<ForecastBreakdown>({
  ready: 0,
  learning: 0,
  newCount: 0,
  nextLearningDue: null,
});
```

- [ ] **Step 2: Fetch breakdown in refresh()**

Add `getReviewForecastBreakdown()` to the `Promise.all` array in `refresh()`. The existing array has 7 items — add it as the 8th:

```typescript
const [
  reviewWords,
  tricky,
  count,
  weekly,
  currentStreak,
  todayCount,
  forecastData,
  breakdownData,
] = await Promise.all([
  getWordsForReview(12),
  getTrickyWords(8),
  getWordCount(),
  getWeeklyActivityFromLog(),
  getStudyStreak(),
  getActivityToday(),
  getReviewForecast(),
  getReviewForecastBreakdown(),
]);
```

Add after the existing setters:

```typescript
setBreakdown(breakdownData);
```

Add `breakdown` to the return object.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/features/review/hooks/use-review-dashboard.ts
git commit -m "feat(review): wire forecast breakdown through dashboard hook"
```

---

### Task 3: Add state chips and next-session hint to ReviewForecast

**Files:**
- Modify: `src/features/review/components/review-forecast.tsx`

- [ ] **Step 1: Update props and add formatTimeUntil helper**

Replace the entire `review-forecast.tsx` with:

```typescript
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { toLocalDateStr } from "@/features/shared/utils/date";
import type {
  ForecastDay,
  ForecastBreakdown,
} from "../services/forecast-repository";

interface ReviewForecastProps {
  forecast: ForecastDay[];
  breakdown: ForecastBreakdown;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

const STATE_COLORS = {
  ready: { bg: "#EDF5ED", text: "#4A9A4A" },
  learning: { bg: "#FDF3E6", text: "#D4944A" },
  new: { bg: "#E8F0F8", text: "#7A9EC0" },
};

function getColor(
  count: number,
  colors: {
    textGhost: string;
    success: string;
    accent: string;
    danger: string;
  },
): string {
  if (count === 0) return colors.textGhost;
  if (count <= 5) return colors.success;
  if (count <= 15) return colors.accent;
  return colors.danger;
}

function formatTimeUntil(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (diffMs < 60_000) return "<1 min";
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  return `${hours}h`;
}

export function ReviewForecast({
  forecast,
  breakdown,
}: ReviewForecastProps) {
  const { colors, textStyles } = useAppTheme();

  const today = new Date();
  const days: {
    label: string;
    date: string;
    count: number;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const dayOfWeek = d.getDay();
    const found = forecast.find((f) => f.date === dateStr);
    days.push({
      label: i === 0 ? "Oggi" : DAY_LABELS[dayOfWeek],
      date: dateStr,
      count: found?.count ?? 0,
      isToday: i === 0,
    });
  }

  const totalUpcoming = days.reduce((sum, d) => sum + d.count, 0);

  const chips = [
    { count: breakdown.ready, label: "pronte", color: STATE_COLORS.ready },
    { count: breakdown.learning, label: "in corso", color: STATE_COLORS.learning },
    { count: breakdown.newCount, label: "nuove", color: STATE_COLORS.new },
  ].filter((c) => c.count > 0);

  return (
    <Animated.View entering={FadeInUp.delay(60).duration(300)}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 18,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
            Prossime review
          </Text>
          <Text
            style={[
              textStyles.mono,
              {
                fontSize: 12,
                color: colors.textMuted,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {totalUpcoming} parole
          </Text>
        </View>

        {/* State breakdown chips */}
        {chips.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {chips.map((chip) => (
              <View
                key={chip.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: chip.color.bg,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: chip.color.text,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 11,
                    fontWeight: "600",
                    color: chip.color.text,
                  }}
                >
                  {chip.count} {chip.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 7-day forecast grid */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {days.map((day) => {
            const color = getColor(day.count, colors);
            return (
              <View
                key={day.date}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderCurve: "continuous",
                  backgroundColor: day.isToday
                    ? colors.accentLight
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 9,
                    fontWeight: "600",
                    color: day.isToday ? colors.accent : colors.textGhost,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {day.label}
                </Text>
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 16,
                    fontWeight: "600",
                    color,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {day.count}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Next session hint */}
        {breakdown.learning > 0 && breakdown.nextLearningDue && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              padding: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderCurve: "continuous",
              backgroundColor: STATE_COLORS.learning.bg,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: STATE_COLORS.learning.text,
                opacity: 0.7,
              }}
            />
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                fontWeight: "500",
                color: STATE_COLORS.learning.text,
                flex: 1,
              }}
            >
              Prossima sessione tra {formatTimeUntil(breakdown.nextLearningDue)}{" "}
              — {breakdown.learning}{" "}
              {breakdown.learning === 1 ? "parola" : "parole"} in apprendimento
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Update the parent page to pass breakdown**

In `src/app/(review)/index.tsx`, destructure `breakdown` from the hook:

```typescript
const {
  wordsToReview,
  trickyWords,
  totalCount,
  weeklyActivity,
  streak,
  forecast,
  breakdown,
} = useReviewDashboard();
```

And pass it to the component:

```tsx
<ReviewForecast forecast={forecast} breakdown={breakdown} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/features/review/components/review-forecast.tsx src/app/\(review\)/index.tsx
git commit -m "feat(review): add state chips and next-session hint to forecast"
```

---

### Task 4: Add state breakdown to TodaySessionCard

**Files:**
- Modify: `src/features/review/components/today-session-card.tsx`
- Modify: `src/app/(review)/index.tsx`

- [ ] **Step 1: Update TodaySessionCard props and rendering**

Replace the entire `today-session-card.tsx` with:

```typescript
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface TodaySessionCardProps {
  wordCount: number;
  readyCount: number;
  newCount: number;
  onStart: () => void;
}

const DOT_COLORS = {
  ready: "#4A9A4A",
  new: "#7A9EC0",
};

export function TodaySessionCard({
  wordCount,
  readyCount,
  newCount,
  onStart,
}: TodaySessionCardProps) {
  const { colors, textStyles } = useAppTheme();
  const dots = [
    ...Array.from({ length: readyCount }, () => "ready" as const),
    ...Array.from({ length: newCount }, () => "new" as const),
  ];

  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 8,
        borderCurve: "continuous",
        padding: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={[textStyles.heading, { fontSize: 14, letterSpacing: 0 }]}>
          Oggi
        </Text>
        <Text
          style={[
            textStyles.mono,
            { fontSize: 10, fontVariant: ["tabular-nums"] },
          ]}
        >
          {wordCount} parole
        </Text>
      </View>

      {wordCount > 0 && (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {readyCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: DOT_COLORS.ready,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 10,
                    fontWeight: "500",
                    color: DOT_COLORS.ready,
                  }}
                >
                  {readyCount} pronte
                </Text>
              </View>
            )}
            {newCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: DOT_COLORS.new,
                  }}
                />
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 10,
                    fontWeight: "500",
                    color: DOT_COLORS.new,
                  }}
                >
                  {newCount} nuove
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
            {dots.map((type, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: DOT_COLORS[type],
                  opacity: 0.25,
                }}
              />
            ))}
          </View>
        </>
      )}

      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          backgroundColor: colors.textPrimary,
          borderRadius: 4,
          borderCurve: "continuous",
          paddingVertical: 10,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={[
            textStyles.body,
            { fontSize: 13, fontWeight: "500", color: colors.card },
          ]}
        >
          {wordCount === 0 ? "Nessuna parola da ripassare" : "Inizia sessione"}
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Update parent to pass new props**

In `src/app/(review)/index.tsx`, update the `TodaySessionCard` usage:

```tsx
<TodaySessionCard
  wordCount={wordsToReview.length}
  readyCount={breakdown.ready}
  newCount={breakdown.newCount}
  onStart={() => router.push("/(review)/session")}
/>
```

Note: `readyCount` here counts review/relearning cards due now. The `newCount` counts never-reviewed words. The `wordCount` is the total from `getWordsForReview(12)` which is capped at 12 per session. The breakdown counts may exceed wordCount since the session is limited to 12 — the dots array uses the breakdown counts but the header shows the session word count. This is intentional: dots show the full picture, the header shows the session size.

Actually, the dots should match the session size. Let me fix: use `Math.min(readyCount, wordCount)` for ready dots and fill the rest with new. Simpler: just pass wordCount and let the parent compute. But the spec says to show "N pronte · N nuove" based on what's in the session. Since `getWordsForReview` orders by state (new first, then learning, then review), the session words are a mix. The simplest correct approach: show the breakdown counts as-is (they represent the full picture), and cap the dots to wordCount.

Update the dots construction in the component to cap at wordCount:

```typescript
const readyCapped = Math.min(readyCount, wordCount);
const newCapped = Math.min(newCount, wordCount - readyCapped);
const dots = [
  ...Array.from({ length: readyCapped }, () => "ready" as const),
  ...Array.from({ length: newCapped }, () => "new" as const),
];
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/features/review/components/today-session-card.tsx src/app/\(review\)/index.tsx
git commit -m "feat(review): add state breakdown to today session card"
```

---

### Task 5: Add interval previews to response buttons

**Files:**
- Modify: `src/features/review/hooks/use-spaced-repetition.ts`
- Modify: `src/features/review/components/response-buttons.tsx`
- Modify: `src/features/review/hooks/use-review-session.ts`
- Modify: `src/app/(review)/session.tsx`

- [ ] **Step 1: Add formatInterval and previewIntervals to use-spaced-repetition.ts**

Add these two exports at the bottom of `src/features/review/hooks/use-spaced-repetition.ts`:

```typescript
export function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days > 30) return `${Math.round(days / 30)}M`;
  return `${days}g`;
}

export function previewIntervals(word?: Word): string[] {
  const now = new Date();
  const card = word ? wordToFsrsCardInput(word) : createEmptyCard(now);
  const scheduling = f.repeat(card, now);

  return ([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]).map(
    (grade) => formatInterval(scheduling[grade].card.due, now),
  );
}
```

- [ ] **Step 2: Expose intervals from use-review-session.ts**

In `src/features/review/hooks/use-review-session.ts`, add the import:

```typescript
import { submitReview, previewIntervals, type ActivityContext } from "./use-spaced-repetition";
```

Add to the `ReviewSession` interface:

```typescript
intervals: string[];
```

Compute intervals from currentWord. Add before the return statement:

```typescript
const intervals = words[currentIndex]
  ? previewIntervals(words[currentIndex])
  : [];
```

Add `intervals` to the return object.

- [ ] **Step 3: Update ResponseButtons to show intervals**

Replace the entire `src/features/review/components/response-buttons.tsx` with:

```typescript
import { Pressable, Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { hapticMedium } from "@/features/shared/hooks/use-haptics";

type Response = 0 | 1 | 2 | 3;

interface ButtonConfig {
  label: string;
  icon: string;
  color: string;
}

interface ResponseButtonsProps {
  onRespond: (response: Response) => void;
  intervals?: string[];
}

export function ResponseButtons({
  onRespond,
  intervals = [],
}: ResponseButtonsProps) {
  const { colors, textStyles } = useAppTheme();

  const BUTTONS: Record<Response, ButtonConfig> = {
    0: {
      label: "Again",
      icon: "arrow.counterclockwise",
      color: colors.danger,
    },
    1: {
      label: "Hard",
      icon: "tortoise",
      color: colors.textTertiary,
    },
    2: {
      label: "Good",
      icon: "checkmark",
      color: colors.accent,
    },
    3: {
      label: "Easy",
      icon: "bolt",
      color: colors.success,
    },
  };

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      {([0, 1, 2, 3] as Response[]).map((response) => {
        const config = BUTTONS[response];
        const interval = intervals[response];
        return (
          <Pressable
            key={response}
            onPress={() => {
              hapticMedium();
              onRespond(response);
            }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              gap: 6,
              paddingVertical: 12,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={config.icon as SFSymbol}
              size={22}
              tintColor={config.color}
              resizeMode="scaleAspectFit"
            />
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                fontWeight: "600",
                color: config.color,
                letterSpacing: 0.5,
              }}
            >
              {config.label}
            </Text>
            {interval && (
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 11,
                  fontWeight: "700",
                  color: config.color,
                  opacity: 0.7,
                }}
              >
                {interval}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Pass intervals in session.tsx**

In `src/app/(review)/session.tsx`, find where `<ResponseButtons>` is rendered and add the `intervals` prop. The session hook now returns `intervals`, so destructure it:

```typescript
const { ..., intervals } = useReviewSession(collectionId);
```

And pass it:

```tsx
<ResponseButtons onRespond={respond} intervals={intervals} />
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/features/review/hooks/use-spaced-repetition.ts \
  src/features/review/hooks/use-review-session.ts \
  src/features/review/components/response-buttons.tsx \
  src/app/\(review\)/session.tsx
git commit -m "feat(review): show FSRS interval previews on response buttons"
```

---

### Task 6: Clean up mockup file

**Files:**
- Delete: `mockup-forecast.html`

- [ ] **Step 1: Remove the mockup file**

```bash
rm mockup-forecast.html
git add mockup-forecast.html
git commit -m "chore: remove forecast mockup file"
```
