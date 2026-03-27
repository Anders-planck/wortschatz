# WortSchatz — Fase 1: Collezioni & Liste

## Overview

Add a collection/list system to organize vocabulary into thematic groups (manual + AI-assisted). Users can create custom lists (e.g., "Verbi d'azione", "Lavoro"), the AI can auto-triage unorganized words into suggested categories, and each collection supports dedicated review sessions.

## Problem

All 24+ saved words sit in a flat list filtered only by word type. There's no way to group words by topic, context, or learning goal. Users studying for a job interview can't isolate work-related vocabulary from everyday words.

## Solution

A collection system with three creation paths:
1. **Manual** — user creates a list, names it, picks an SF Symbol icon
2. **AI-assisted** — when creating a list, toggle "Popola con AI" to auto-fill from existing vocabulary
3. **AI triage** — dedicated screen that analyzes unorganized words and proposes category groupings

## Data Model

### New SQLite table: `collections`

Tables are added to `getDatabase()` in `database.ts` alongside existing `CREATE TABLE IF NOT EXISTS` statements.

```sql
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder.fill',
  color TEXT NOT NULL DEFAULT '#D4A44A',
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

- `name` is not unique — users can have multiple lists with the same name
- `icon` stores an SF Symbol name (e.g., `bolt.fill`, `briefcase.fill`)
- `is_ai_generated` is cosmetic — controls the "AI" badge display. AI-generated collections can be freely edited/renamed
- `updated_at` is set on creation and updated when words are added/removed. Used to determine "recently active" for featured card

### New SQLite table: `collection_words` (junction)

```sql
CREATE TABLE IF NOT EXISTS collection_words (
  collection_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, word_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cw_collection ON collection_words(collection_id);
CREATE INDEX IF NOT EXISTS idx_cw_word ON collection_words(word_id);
```

Deleting a word from the vocabulary cascades to remove it from all collections (word counts update automatically).

### Mastery % formula

Mastery percentage for a collection = average of per-word mastery, where each word's mastery is:

```
wordMastery = clamp((review_score + 5) / 15 * 100, 0, 100)
```

Score range is -5 to 10. At -5 → 0%, at 10 → 100%. This is computed in the query via SQL `AVG()`.

### Queries needed

- `getCollections()` — all collections with word count and mastery %, ordered by `updated_at DESC`
- `getCollectionWords(collectionId)` — words in a collection with review data
- `getCollectionsForWord(wordId)` — which collections a word belongs to
- `getUnorganizedWords()` — words not in any collection
- `getWordsForReviewByCollection(collectionId, limit)` — extends existing `getWordsForReview` for scoped sessions
- `addWordToCollection(collectionId, wordId)` — also updates `collections.updated_at`
- `removeWordFromCollection(collectionId, wordId)`
- `createCollection(name, icon, color, isAiGenerated?)`
- `deleteCollection(collectionId)`
- `updateCollection(collectionId, { name?, icon?, color? })`

Repository location: `src/features/shared/db/collections-repository.ts` (follows existing pattern where all repos live in `shared/db/`).

## Screens & Navigation

### Layout changes

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

### 1. Vocabulary tab — Collections view

**Route**: `(vocabulary)/index.tsx` (existing, extended)

- Add `SegmentedControl` toggle: "Tutte (N)" | "Collezioni"
- When "Collezioni" is active, show bento grid of collection cards
- First card is `featured` (full width) = collection with most recent `updated_at`
- Each card shows: SF Symbol icon, name, word count, AI badge (if `is_ai_generated`), progress bar (mastery %)
- Last cell is dashed "+" to create new
- Toolbar: `sparkles` button → AI triage, `plus` button → create collection

### 2. Collection detail

**Route**: `(vocabulary)/collection/[id].tsx` (new)

- Header: collection name + toolbar buttons (`play.fill` = review, `ellipsis` = menu)
- Mastery progress card (percentage + mini bar chart)
- FlatList of words with type-color bar, term, translation
- AI suggestion block at bottom with word chips (tap to add)
- Swipe-to-delete on word rows

### 3. Add to collection sheet

**Route**: `(vocabulary)/add-to-collection.tsx` (new, formSheet)

- Triggered from word detail toolbar button `folder.badge.plus`
- Passes `wordId` as route param
- Shows list of existing collections with checkmarks for current membership
- "Crea nuova lista" dashed row at bottom → pushes create-collection sheet
- Multi-select: a word can belong to multiple collections

### 4. Create collection sheet

**Route**: `(vocabulary)/create-collection.tsx` (new, formSheet)

- `TextInput` for name
- SF Symbol picker grid (preset icons: `bolt.fill`, `briefcase.fill`, `airplane`, `sun.max.fill`, `house.fill`, `fork.knife`, `book.fill`, `key.fill`, `heart.fill`, `star.fill`, `flag.fill`, `folder.fill`)
- Color picker (6 colors from theme: accent, der, die, das, verb, prep)
- `Switch` toggle "Popola con AI" — when enabled, after creation calls Gemini to suggest words from existing vocabulary
- Cancel / Create buttons
- Loading state while AI populates (spinner on Create button)

### 5. AI triage screen

**Route**: `(vocabulary)/organize.tsx` (new)

- Accessible from vocabulary toolbar button `sparkles`
- If zero unorganized words: show "Tutte le parole sono organizzate!" empty state with checkmark
- Loading state: spinner while Gemini analyzes (3-5s)
- Header: "N parole non organizzate"
- AI proposes 3-5 category groupings
- Each group shows: suggested name + SF Symbol icon, word chips
- Actions per group: "Crea lista" (accent) or "Ignora" (ghost)

### 6. Collection-scoped review

**Existing**: `(review)/session.tsx` (extended)

- `useReviewSession` hook refactored to accept optional `collectionId` parameter
- When present, `getWordsForReviewByCollection(collectionId)` replaces `getWordsForReview()`
- Session progress label shows collection name
- Triggered from collection detail toolbar `play.fill` button via `router.push({ pathname: "/(review)/session", params: { collectionId } })`

## Context Menu (Long Press)

On collection cards in the bento grid:

```tsx
<Link.Menu>
  <Link.MenuAction title="Ripassa" icon="play.fill" onPress={startReview} />
  <Link.MenuAction title="Rinomina" icon="pencil" onPress={showRenameAlert} />
  <Link.MenuAction title="Elimina" icon="trash" destructive onPress={confirmDelete} />
</Link.Menu>
```

"Condividi" removed from v1 scope — not enough value to justify the implementation.

## AI Integration

### Triage prompt (Gemini)

Input: list of unorganized words with type, gender, category, translations.

Output (structured via Zod schema): 3-5 groupings, each with:
- `name`: suggested collection name (German)
- `icon`: SF Symbol name from the preset list
- `words`: array of word terms that fit this group
- `reason`: one-line explanation in Italian

### Auto-populate prompt (Gemini)

Input: collection name + all user's saved words (term, type, category).

Output: array of word terms from the user's vocabulary that fit the collection theme.

Both prompts use `generateText` with `Output.object` and Zod schemas, matching the existing `ai-context-service.ts` pattern.

## Feature Directory Structure

```
src/features/collections/
  components/
    collection-card.tsx
    collection-grid.tsx
    collection-word-list.tsx
    ai-suggestion-block.tsx
    sf-icon-picker.tsx
    color-picker.tsx
  hooks/
    use-collections.ts
    use-ai-triage.ts
  services/
    ai-collections-service.ts
  types.ts

src/features/shared/db/
  collections-repository.ts  (follows existing repo pattern)
```

## Error Handling

- AI triage/populate fails (no network): show "Nessuna connessione" with retry button, loading spinner stops
- Empty collections: show empty state with "Cerca una parola e aggiungila qui" prompt
- Delete collection: system Alert confirmation, words are NOT deleted (only the junction rows)
- Duplicate word in collection: silently ignore (PRIMARY KEY constraint handles this)
- Zero unorganized words: triage screen shows success empty state, not an error
- Word deletion cascade: deleting a word from vocabulary automatically removes it from all collections

## Acceptance Criteria

- [ ] SegmentedControl toggles between flat list and collection grid
- [ ] Bento grid with featured card, progress bars, AI badges
- [ ] Long press context menu on collection cards (Ripassa, Rinomina, Elimina)
- [ ] Create collection with name, SF Symbol icon picker, color picker
- [ ] "Popola con AI" toggle auto-suggests words from vocabulary on creation
- [ ] Add word to collection(s) from word detail toolbar (`folder.badge.plus`)
- [ ] AI triage proposes categories for unorganized words
- [ ] AI triage shows empty state when all words are organized
- [ ] Collection-scoped review sessions via `collectionId` param
- [ ] `useReviewSession` accepts optional `collectionId` to filter words
- [ ] Collections persist in SQLite with `updated_at` tracking
- [ ] Deleting a word cascades to remove it from all collections
- [ ] All screens respect dark/light mode theme
- [ ] All icons are SF Symbols via `expo-image` with `source="sf:name"`
- [ ] Loading states for AI operations (triage, auto-populate)
- [ ] New routes registered in `(vocabulary)/_layout.tsx` with correct presentation options
