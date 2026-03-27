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

```sql
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder.fill',  -- SF Symbol name
  color TEXT NOT NULL DEFAULT '#D4A44A',      -- hex accent color
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

### New SQLite table: `collection_words` (junction)

```sql
CREATE TABLE collection_words (
  collection_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, word_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);
CREATE INDEX idx_cw_collection ON collection_words(collection_id);
CREATE INDEX idx_cw_word ON collection_words(word_id);
```

### Queries needed

- `getCollections()` — all collections with word count and mastery %
- `getCollectionWords(collectionId)` — words in a collection with review data
- `getCollectionsForWord(wordId)` — which collections a word belongs to
- `getUnorganizedWords()` — words not in any collection
- `addWordToCollection(collectionId, wordId)`
- `removeWordFromCollection(collectionId, wordId)`
- `createCollection(name, icon, color)`
- `deleteCollection(collectionId)`
- `updateCollection(collectionId, updates)`

## Screens & Navigation

### 1. Vocabulary tab — Collections view

**Route**: `(vocabulary)/index.tsx` (existing, extended)

- Add `SegmentedControl` toggle: "Tutte (N)" | "Collezioni"
- When "Collezioni" is active, show bento grid of collection cards
- First card is `featured` (full width) if the user has a recently active collection
- Each card shows: SF Symbol icon, name, word count, AI badge, progress bar (mastery %)
- Last cell is dashed "+" to create new
- `+` button in header toolbar opens create sheet

**Native components**: `SegmentedControl`, `Stack.Toolbar`

### 2. Collection detail

**Route**: `(vocabulary)/collection/[id].tsx` (new)

- Header: collection name + toolbar buttons (play=review, ellipsis=menu)
- Mastery progress card (percentage + mini bar chart)
- FlatList of words with type-color bar, term, translation
- AI suggestion block at bottom with word chips (tap to add)
- Swipe-to-delete on word rows

**Native components**: `Stack.Toolbar`, `FlatList`, swipe actions

### 3. Add to collection sheet

**Route**: `(vocabulary)/add-to-collection.tsx` (new, formSheet)

- Triggered from word detail toolbar button `folder.badge.plus`
- Shows list of existing collections with checkmarks for membership
- "Crea nuova lista" dashed row at bottom
- Multi-select: a word can belong to multiple collections

**Native components**: `formSheet` presentation, `sheetAllowedDetents: [0.5, 1.0]`

### 4. Create collection sheet

**Route**: `(vocabulary)/create-collection.tsx` (new, formSheet)

- TextInput for name
- SF Symbol picker grid (8-12 common icons)
- Color picker (6 accent colors from theme)
- Toggle "Popola con AI" (Switch)
- Cancel / Create buttons

**Native components**: `formSheet`, `TextInput`, `Switch`

### 5. AI triage screen

**Route**: `(vocabulary)/organize.tsx` (new)

- Accessible from vocabulary toolbar button `sparkles`
- Header: "N parole non organizzate"
- AI analyzes unorganized words and proposes 3-5 category groupings
- Each group shows: suggested name + icon, word chips
- Actions per group: "Crea lista" (accent) or "Ignora" (ghost)
- Uses Gemini to generate groupings

**Native components**: `Stack` screen

### 6. Collection-scoped review

**Existing**: `(review)/session.tsx` (extended)

- Accept optional `collectionId` param
- When present, `getWordsForReview` filters to collection words only
- Session progress label shows collection name
- Triggered from collection detail "Ripassa questa lista" button

## Context Menu (Long Press)

On collection cards in the bento grid:

```tsx
<Link.Menu>
  <Link.MenuAction title="Ripassa" icon="play.fill" onPress={...} />
  <Link.MenuAction title="Rinomina" icon="pencil" onPress={...} />
  <Link.MenuAction title="Condividi" icon="square.and.arrow.up" onPress={...} />
  <Link.MenuAction title="Elimina" icon="trash" destructive onPress={...} />
</Link.Menu>
```

## AI Integration

### Triage prompt (Gemini)

Input: list of unorganized words with type, gender, category, translations.

Output: 3-5 groupings, each with:
- `name`: suggested collection name (German)
- `icon`: SF Symbol name suggestion
- `words`: array of word terms that fit this group
- `reason`: one-line explanation in Italian

### Auto-populate prompt (Gemini)

Input: collection name + all user's saved words.

Output: array of word terms from the user's vocabulary that fit the collection theme.

## Feature Directory Structure

```
src/features/collections/
  components/
    collection-card.tsx       — bento grid card
    collection-grid.tsx       — bento grid layout
    collection-word-list.tsx  — FlatList inside collection
    ai-suggestion-block.tsx   — AI word chip suggestions
    sf-icon-picker.tsx        — icon selector grid
    color-picker.tsx          — color selector row
  hooks/
    use-collections.ts        — CRUD + queries
    use-ai-triage.ts          — Gemini triage logic
  services/
    collections-repository.ts — SQLite queries
    ai-collections-service.ts — Gemini prompts
  types.ts                    — Collection, CollectionWord interfaces
```

## Error Handling

- AI triage fails (no network): show "Nessuna connessione" with retry button
- Empty collections: show empty state with "Aggiungi parole" prompt
- Delete collection: confirmation alert, words are NOT deleted (only the association)
- Duplicate word in collection: silently ignore (PRIMARY KEY constraint)

## Acceptance Criteria

- [ ] SegmentedControl toggles between flat list and collection grid
- [ ] Bento grid with featured card, progress bars, AI badges
- [ ] Long press context menu on collection cards
- [ ] Create collection with name, SF Symbol icon, color
- [ ] "Popola con AI" toggle auto-suggests words from vocabulary
- [ ] Add word to collection from word detail toolbar
- [ ] AI triage proposes categories for unorganized words
- [ ] Collection-scoped review sessions
- [ ] Collections persist in SQLite across app restarts
- [ ] All screens respect dark mode theme
- [ ] All icons are SF Symbols via expo-image
