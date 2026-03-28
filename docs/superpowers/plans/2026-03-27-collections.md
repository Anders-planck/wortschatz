# Collections & Lists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collection system for organizing vocabulary into thematic groups with manual creation, AI-assisted population, and collection-scoped review sessions.

**Architecture:** New `collections` and `collection_words` SQLite tables. Repository in `shared/db/`. Feature components in `src/features/collections/`. AI triage and auto-populate via Gemini. New routes in `(vocabulary)/` group with formSheet presentations.

**Tech Stack:** Expo Router, expo-sqlite, Gemini (via Vercel AI SDK + Zod), SegmentedControl, SF Symbols (expo-image), Reanimated

**Spec:** `docs/superpowers/specs/2026-03-27-collections-design.md`

---

### Task 1: Data model — types and database schema

**Files:**
- Create: `src/features/collections/types.ts`
- Modify: `src/features/shared/db/database.ts`

- [ ] **Step 1: Create collection types**

```typescript
// src/features/collections/types.ts
export interface Collection {
  id: number;
  name: string;
  icon: string;       // SF Symbol name
  color: string;      // hex
  isAiGenerated: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CollectionWithStats extends Collection {
  wordCount: number;
  masteryPercent: number;
}

export const COLLECTION_ICONS = [
  "bolt.fill", "briefcase.fill", "airplane", "sun.max.fill",
  "house.fill", "fork.knife", "book.fill", "key.fill",
  "heart.fill", "star.fill", "flag.fill", "folder.fill",
] as const;

export const COLLECTION_COLORS = [
  "#D4A44A", "#D4B97A", "#E0B8AE", "#9DC59A", "#C0B8E0", "#A8C0D0",
] as const;
```

- [ ] **Step 2: Add tables to database.ts**

Add after existing `settings` table creation in `getDatabase()`:

```typescript
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'folder.fill',
    color TEXT NOT NULL DEFAULT '#D4A44A',
    is_ai_generated INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS collection_words (
    collection_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (collection_id, word_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
  );
`);

await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cw_collection ON collection_words(collection_id);`);
await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cw_word ON collection_words(word_id);`);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/features/collections/types.ts src/features/shared/db/database.ts
git commit -m "feat(collections): add types and database schema"
```

---

### Task 2: Collections repository

**Files:**
- Create: `src/features/shared/db/collections-repository.ts`

- [ ] **Step 1: Create the repository with all query functions**

Follow the exact pattern from `words-repository.ts`: async functions, `getDatabase()`, typed rows, row-to-model mappers.

```typescript
// src/features/shared/db/collections-repository.ts
import { getDatabase } from "./database";
import type { Collection, CollectionWithStats } from "@/features/collections/types";

interface CollectionRow {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_ai_generated: number;
  updated_at: string;
  created_at: string;
}

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isAiGenerated: row.is_ai_generated === 1,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export async function getCollections(): Promise<CollectionWithStats[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CollectionRow & { word_count: number; avg_score: number }>(
    `SELECT c.*,
       COUNT(cw.word_id) as word_count,
       COALESCE(AVG(CLAMP_MASTERY(w.review_score)), 0) as avg_score
     FROM collections c
     LEFT JOIN collection_words cw ON c.id = cw.collection_id
     LEFT JOIN words w ON cw.word_id = w.id
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
  );
  // Note: SQLite doesn't have CLAMP_MASTERY, compute in JS
  // Rewrite with raw avg:
  const rawRows = await db.getAllAsync<CollectionRow & { word_count: number; avg_score: number | null }>(
    `SELECT c.*,
       COUNT(cw.word_id) as word_count,
       AVG(w.review_score) as avg_score
     FROM collections c
     LEFT JOIN collection_words cw ON c.id = cw.collection_id
     LEFT JOIN words w ON cw.word_id = w.id
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
  );
  return rawRows.map((row) => ({
    ...rowToCollection(row),
    wordCount: row.word_count,
    masteryPercent:
      row.avg_score !== null
        ? Math.round(Math.max(0, Math.min(100, ((row.avg_score + 5) / 15) * 100)))
        : 0,
  }));
}

export async function getCollectionWords(collectionId: number): Promise<Word[]> {
  const db = await getDatabase();
  // Import Word type and rowToWord from words-repository or inline
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     JOIN collection_words cw ON w.id = cw.word_id
     WHERE cw.collection_id = ?
     ORDER BY cw.added_at DESC`,
    [collectionId],
  );
  return rows.map(rowToWord);
}

export async function getCollectionsForWord(wordId: number): Promise<Collection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CollectionRow>(
    `SELECT c.* FROM collections c
     JOIN collection_words cw ON c.id = cw.collection_id
     WHERE cw.word_id = ?`,
    [wordId],
  );
  return rows.map(rowToCollection);
}

export async function getUnorganizedWords(): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     WHERE w.id NOT IN (SELECT word_id FROM collection_words)
     ORDER BY w.created_at DESC`,
  );
  return rows.map(rowToWord);
}

export async function getWordsForReviewByCollection(
  collectionId: number,
  limit = 12,
): Promise<Word[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     JOIN collection_words cw ON w.id = cw.word_id
     WHERE cw.collection_id = ?
       AND (w.next_review IS NULL OR w.next_review <= ?)
     ORDER BY w.review_score ASC, w.searched_at DESC
     LIMIT ?`,
    [collectionId, now, limit],
  );
  return rows.map(rowToWord);
}

export async function addWordToCollection(
  collectionId: number,
  wordId: number,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO collection_words (collection_id, word_id, added_at) VALUES (?, ?, ?)`,
    [collectionId, wordId, now],
  );
  await db.runAsync(
    `UPDATE collections SET updated_at = ? WHERE id = ?`,
    [now, collectionId],
  );
}

export async function removeWordFromCollection(
  collectionId: number,
  wordId: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM collection_words WHERE collection_id = ? AND word_id = ?`,
    [collectionId, wordId],
  );
}

export async function createCollection(
  name: string,
  icon: string,
  color: string,
  isAiGenerated = false,
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO collections (name, icon, color, is_ai_generated, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, icon, color, isAiGenerated ? 1 : 0, now, now],
  );
  return result.lastInsertRowId;
}

export async function deleteCollection(collectionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM collections WHERE id = ?`, [collectionId]);
}

export async function updateCollection(
  collectionId: number,
  updates: { name?: string; icon?: string; color?: string },
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.icon !== undefined) { fields.push("icon = ?"); values.push(updates.icon); }
  if (updates.color !== undefined) { fields.push("color = ?"); values.push(updates.color); }

  values.push(collectionId);
  await db.runAsync(`UPDATE collections SET ${fields.join(", ")} WHERE id = ?`, values);
}
```

**Note:** This file needs to import `Word` type and `rowToWord` function. Since `rowToWord` and `WordRow` are not exported from `words-repository.ts`, either export them or duplicate the row mapping. The cleanest approach: export `rowToWord` and `WordRow` from `words-repository.ts`.

- [ ] **Step 2: Export `rowToWord` and `WordRow` from words-repository.ts**

In `src/features/shared/db/words-repository.ts`, change the existing `interface WordRow` and `function rowToWord` from private to exported:

```typescript
// Change from:
interface WordRow { ... }
function rowToWord(row: WordRow): Word { ... }

// To:
export interface WordRow { ... }
export function rowToWord(row: WordRow): Word { ... }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/features/shared/db/collections-repository.ts src/features/shared/db/words-repository.ts
git commit -m "feat(collections): add collections repository with all queries"
```

---

### Task 3: AI collections service

**Files:**
- Create: `src/features/collections/services/ai-collections-service.ts`

- [ ] **Step 1: Create the AI service**

Follow `ai-context-service.ts` pattern: `generateText` + `Output.object` + Zod schema.

```typescript
// src/features/collections/services/ai-collections-service.ts
import { z } from "zod";
import { generateText, Output } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import type { Word } from "@/features/dictionary/types";

const TriageGroupSchema = z.object({
  name: z.string(),
  icon: z.string(),
  words: z.array(z.string()),
  reason: z.string(),
});

const TriageResultSchema = z.object({
  groups: z.array(TriageGroupSchema),
});

export type TriageGroup = z.infer<typeof TriageGroupSchema>;

export async function triageWords(words: Word[]): Promise<TriageGroup[]> {
  const wordList = words
    .map((w) => `${w.term} (${w.type}${w.gender ? `, ${w.gender}` : ""}) — ${w.translations.join(", ")}`)
    .join("\n");

  const result = await generateText({
    model: google("gemini-2.5-flash-lite"),
    output: Output.object({ schema: TriageResultSchema }),
    prompt: `You are organizing German vocabulary words into thematic groups.

Words:
${wordList}

Create 3-5 thematic groups. For each group:
- "name": a German name for the category (e.g., "Essen & Trinken", "Arbeit")
- "icon": an SF Symbol name from this list: bolt.fill, briefcase.fill, airplane, sun.max.fill, house.fill, fork.knife, book.fill, key.fill, heart.fill, star.fill, flag.fill, folder.fill
- "words": array of word terms that fit this group
- "reason": one-line explanation in Italian of why these words go together

Each word should appear in at most one group. Prioritize groups with 3+ words.`,
  });

  if (!result.object) throw new Error("AI triage returned empty result");
  return result.object.groups;
}

const AutoPopulateSchema = z.object({
  words: z.array(z.string()),
});

export async function autoPopulateCollection(
  collectionName: string,
  allWords: Word[],
): Promise<string[]> {
  const wordList = allWords
    .map((w) => `${w.term} (${w.type}) — ${w.translations.join(", ")}`)
    .join("\n");

  const result = await generateText({
    model: google("gemini-2.5-flash-lite"),
    output: Output.object({ schema: AutoPopulateSchema }),
    prompt: `From this vocabulary list, select all words that fit the collection "${collectionName}".

Words:
${wordList}

Return only the "term" values of words that match the theme "${collectionName}". Be selective — only include words that clearly fit.`,
  });

  if (!result.object) return [];
  return result.object.words;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/collections/services/ai-collections-service.ts
git commit -m "feat(collections): add AI triage and auto-populate service"
```

---

### Task 4: Collections hook

**Files:**
- Create: `src/features/collections/hooks/use-collections.ts`

- [ ] **Step 1: Create the collections hook**

Follow `use-vocabulary.ts` pattern: useState, useCallback, useFocusEffect.

```typescript
// src/features/collections/hooks/use-collections.ts
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import type { CollectionWithStats } from "../types";
import { getCollections } from "@/features/shared/db/collections-repository";

export function useCollections() {
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getCollections();
      setCollections(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { collections, isLoading, refresh: load };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/collections/hooks/use-collections.ts
git commit -m "feat(collections): add useCollections hook"
```

---

### Task 5: Collection components — card, grid, icon picker, color picker

**Files:**
- Create: `src/features/collections/components/collection-card.tsx`
- Create: `src/features/collections/components/collection-grid.tsx`
- Create: `src/features/collections/components/sf-icon-picker.tsx`
- Create: `src/features/collections/components/color-picker.tsx`

- [ ] **Step 1: Create CollectionCard**

A single bento card with SF Symbol icon, name, count, AI badge, progress bar. Wrapped in `Link` with `Link.Menu` for context menu (Ripassa, Rinomina, Elimina).

Use `expo-image` with `source="sf:icon"` for SF Symbols. Follow `vocabulary-item.tsx` pattern for Link.Menu.

- [ ] **Step 2: Create CollectionGrid**

Bento grid layout: first card `featured` (full width), rest 2-column. Last cell is dashed "+" button. Uses `FlatList` with 2-column `numColumns` (or manual grid via Views).

- [ ] **Step 3: Create SfIconPicker**

Grid of 12 SF Symbol icons. Each is a tappable `Pressable` with `Image source="sf:name"`. Selected icon has accent border.

- [ ] **Step 4: Create ColorPicker**

Row of 6 color circles from `COLLECTION_COLORS`. Selected has accent border.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/features/collections/components/
git commit -m "feat(collections): add card, grid, icon picker, color picker components"
```

---

### Task 6: Vocabulary screen — SegmentedControl toggle

**Files:**
- Modify: `src/app/(vocabulary)/index.tsx`
- Modify: `src/features/vocabulary/components/filter-chips.tsx`

- [ ] **Step 1: Add SegmentedControl to vocabulary screen**

Add a top-level `SegmentedControl` with values `["Tutte (N)", "Collezioni"]`. When index 0, show existing FlatList. When index 1, show `CollectionGrid`.

Add toolbar buttons: `sparkles` → organize, `plus` → create collection.

- [ ] **Step 2: Verify it works visually**

Run app, navigate to Parole tab, toggle between "Tutte" and "Collezioni".

- [ ] **Step 3: Commit**

```bash
git add src/app/(vocabulary)/index.tsx
git commit -m "feat(collections): add segmented toggle to vocabulary tab"
```

---

### Task 7: New routes — collection detail, add-to-collection, create-collection, organize

**Files:**
- Create: `src/app/(vocabulary)/collection/[id].tsx`
- Create: `src/app/(vocabulary)/add-to-collection.tsx`
- Create: `src/app/(vocabulary)/create-collection.tsx`
- Create: `src/app/(vocabulary)/organize.tsx`
- Modify: `src/app/(vocabulary)/_layout.tsx`

- [ ] **Step 1: Register routes in layout**

Add to `(vocabulary)/_layout.tsx`:

```tsx
<Stack.Screen name="collection/[id]" />
<Stack.Screen
  name="add-to-collection"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
  }}
/>
<Stack.Screen
  name="create-collection"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.75, 1.0],
  }}
/>
<Stack.Screen name="organize" />
```

- [ ] **Step 2: Create collection detail screen**

`collection/[id].tsx`: Header with name + toolbar (play, ellipsis). Mastery card. Word FlatList. AI suggestion block at bottom.

- [ ] **Step 3: Create add-to-collection screen**

`add-to-collection.tsx`: FormSheet showing list of collections with checkmarks. Receives `wordId` as route param. Toggle membership with `addWordToCollection`/`removeWordFromCollection`.

- [ ] **Step 4: Create create-collection screen**

`create-collection.tsx`: FormSheet with TextInput (name), SfIconPicker, ColorPicker, Switch ("Popola con AI"). On create: `createCollection()` then optionally `autoPopulateCollection()` + `addWordToCollection()` for each matched word.

- [ ] **Step 5: Create AI organize screen**

`organize.tsx`: Stack screen. Calls `getUnorganizedWords()`. If empty, show success state. Otherwise call `triageWords()` with loading spinner. Render groups with word chips and "Crea lista" / "Ignora" buttons.

- [ ] **Step 6: Verify all routes compile and navigate**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add src/app/(vocabulary)/
git commit -m "feat(collections): add detail, add-to, create, organize screens"
```

---

### Task 8: Word detail toolbar — "Add to collection" button

**Files:**
- Modify: `src/app/(search)/word/[term].tsx`
- Modify: `src/app/(vocabulary)/word/[term].tsx`

- [ ] **Step 1: Add `folder.badge.plus` toolbar button**

In both word detail screens, add a toolbar button next to the existing declension button:

```tsx
<Stack.Toolbar placement="right">
  {isNoun && (
    <Stack.Toolbar.Button
      icon="tablecells"
      onPress={() => router.push({ pathname: "/declension/[term]", params: { term: word.term } })}
    />
  )}
  {word && (
    <Stack.Toolbar.Button
      icon="folder.badge.plus"
      onPress={() => router.push({ pathname: "/add-to-collection", params: { wordId: String(word.id) } })}
    />
  )}
</Stack.Toolbar>
```

**Note:** The `add-to-collection` route only exists in `(vocabulary)` group. For `(search)`, either add a duplicate route or navigate cross-tab. Simplest: add the same route to `(search)/_layout.tsx` too.

- [ ] **Step 2: Add add-to-collection route to search layout**

Copy the formSheet route config to `(search)/_layout.tsx`.

- [ ] **Step 3: Create the route file in search group**

Create `src/app/(search)/add-to-collection.tsx` — same content as the vocabulary version (can be extracted to a shared component).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/(search)/ src/app/(vocabulary)/
git commit -m "feat(collections): add folder.badge.plus toolbar to word detail screens"
```

---

### Task 9: Collection-scoped review sessions

**Files:**
- Modify: `src/features/review/hooks/use-review-session.ts`
- Modify: `src/app/(review)/session.tsx`

- [ ] **Step 1: Refactor useReviewSession to accept optional collectionId**

```typescript
export function useReviewSession(collectionId?: number): ReviewSession {
  // ...existing state...

  const startSession = useCallback(async () => {
    setIsLoading(true);
    const reviewWords = collectionId
      ? await getWordsForReviewByCollection(collectionId, 12)
      : await getWordsForReview(12);
    setWords(reviewWords);
    // ...rest of existing logic...
  }, [collectionId]);

  // ...rest unchanged...
}
```

Add import: `import { getWordsForReviewByCollection } from "@/features/shared/db/collections-repository";`

- [ ] **Step 2: Update session screen to read collectionId param**

In `session.tsx`, read the optional param:

```typescript
const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
const session = useReviewSession(collectionId ? Number(collectionId) : undefined);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/features/review/hooks/use-review-session.ts src/app/(review)/session.tsx
git commit -m "feat(collections): support collection-scoped review sessions"
```

---

### Task 10: Final integration and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Run linter**

Run: `npx expo lint`

- [ ] **Step 3: Fix any issues**

- [ ] **Step 4: Test the full flow manually**

1. Navigate to Parole → toggle to Collezioni → see empty grid with "+"
2. Tap "+" → create collection with name, icon, color
3. Toggle "Popola con AI" → verify loading state and word suggestions
4. Navigate to a word → tap `folder.badge.plus` → add to collection
5. Navigate to collection → see word list with mastery %
6. Tap play → verify collection-scoped review session
7. Long press collection card → context menu works
8. Tap `sparkles` → AI triage screen with word groupings
9. All screens work in dark mode

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(collections): complete collections & lists feature (phase 1)"
git push origin develop
```
