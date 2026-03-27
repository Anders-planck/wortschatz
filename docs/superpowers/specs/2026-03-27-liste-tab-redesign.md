# WortSchatz — Tab "Liste" Redesign

## Overview

Replace the current "Parole" tab (flat word list + collections toggle) with a collections-only tab renamed "Liste", using a manila folder card design. The flat word list is removed entirely — words are accessible via Search tab and collection detail pages.

## Problem

The "Parole" tab currently shows two stacked controls (SegmentedControl for Parole/Liste + FilterChips for word type) over a flat word list. With collections now implemented, the flat list is redundant — words are better discovered through thematic lists or search. The double-control UI feels cluttered and unfocused.

## Solution

### Tab Identity

- **Name**: "Liste" (was "Parole")
- **Icon**: `folder.fill` (was `list.bullet`)
- **Large title**: "Liste"

### Page Layout

- `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`
- Large title: `<Stack.Screen.Title large>Liste</Stack.Screen.Title>` (replaces "Parole")
- Toolbar (right, always rendered — no conditional): `sparkles` button (AI organize) + `plus` button (create list)
- Collection grid with manila folder card design
- No SegmentedControl, no filter chips, no stats

### Card Design — Manila Folder

Each collection is rendered as a manila folder with a colored tab:

**Anatomy:**
```
┌─────────────────┐
│ VERBI DI... ✦  │  ← colored tab (collection.color bg, dark text, uppercase, bold, sparkles if AI)
├─────────────────┴──────────────┐
│                                │  ← folder body (card bg)
│  ┌──────┐                     │     borderTopLeftRadius: 0
│  │  ⚡  │  24 parole · 78%   │     borderTopRightRadius: 12, borderBottom*: 12
│  └──────┘                     │     border-top: 3px solid collection.color
│  ░░░░░░░░████████░░░░░░░░░░  │  ← progress bar (collection.color)
│                                │
└────────────────────────────────┘
```

**React Native border radius:** Use decomposed properties since RN does not support shorthand:
- `borderTopLeftRadius: 0` (folder shape — body continues from tab)
- `borderTopRightRadius: 12`
- `borderBottomLeftRadius: 12`
- `borderBottomRightRadius: 12`

**Featured card (first collection):**
- Full width, horizontal layout
- Larger icon (44px container), larger tab (padding 4px 14px)
- Mastery % as a bold number on the right: `fontSize: 20, fontWeight: 700, fontFamily: Outfit, color: collection.color`

**Grid cards (remaining collections):**
- Two per row
- Smaller icon (36px container), smaller tab (padding 3px 10px)
- Vertical layout

**AI badge:** `sf:sparkles` icon (10px, `colors.accent`) rendered inside the folder tab, after the collection name

**Create new button:**
- Dashed border with folder shape: `borderTopLeftRadius: 0, borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10`
- Top margin to align with folder bodies in the same row
- Centered `+` icon in rounded square + "NUOVA" label (mono, uppercase)
- Appears in the last grid row

### Empty State

Rendered by the `EmptyState` component inside `collection-grid.tsx` (update existing, not new component).

When no collections exist:

- Large icon: `sf:folder.fill` (change from current `sf:tray.2.fill`) in tinted rounded square (72px, `borderRadius: 20`)
- Title: "Nessuna lista" (Outfit, 18px, heading style)
- Subtitle: "Organizza il vocabolario in liste tematiche per un ripasso mirato" (bodyLight, 14px, muted)
- Primary CTA: "Crea la prima lista" button (accent bg, white text, `sf:plus` icon)
- **New** Secondary CTA: "Organizza con AI" button (card bg, accent text, `sf:sparkles` icon) — routes to `/organize`, analyzes saved words and suggests themed lists

### What Gets Removed

| Item | File | Status |
|------|------|--------|
| Flat word list view | `(vocabulary)/index.tsx` viewMode 0 | Remove |
| SegmentedControl (Parole/Liste) | `(vocabulary)/index.tsx` | Remove |
| FilterChips component | `vocabulary/components/filter-chips.tsx` | Delete file |
| useVocabulary hook | `vocabulary/hooks/use-vocabulary.ts` | Keep (used by export) |
| VocabularyEmpty component | `vocabulary/components/vocabulary-empty.tsx` | Delete file |

**Kept unchanged:**
- `useVocabulary` hook and `getAllWords()` — used by export and AI organize
- `vocabulary-item.tsx` — used by `collection/[id].tsx` (collection detail page)

**Files unchanged (verified, no modifications needed):**
- `src/app/(vocabulary)/organize.tsx` — AI organize screen, still navigated via toolbar
- `src/app/(vocabulary)/create-collection.tsx` — create collection modal, still navigated via toolbar
- `src/app/(vocabulary)/collection/[id].tsx` — collection detail, still uses `VocabularyItem`
- `src/app/(vocabulary)/add-to-collection.tsx` — add word to collection modal

### Words Remain Accessible Via

- **Search tab**: find any word by typing
- **Collection detail page**: see all words in a list
- **Review tab**: words appear in review sessions
- **Word detail page**: accessible from search results and collection items

## Files to Modify

```
src/components/app-tabs.tsx              — rename tab, change icon
src/app/(vocabulary)/index.tsx           — rewrite: collections-only with folder cards
src/features/collections/components/
  collection-card.tsx                    — redesign: manila folder style
  collection-grid.tsx                    — update: empty state with AI CTA, folder layout
src/features/vocabulary/components/
  filter-chips.tsx                       — DELETE
  vocabulary-empty.tsx                   — DELETE
```

## Acceptance Criteria

- [ ] Tab renamed to "Liste" with `folder.fill` icon
- [ ] No SegmentedControl or filter chips on the page
- [ ] Collection cards use manila folder design (colored tab + body)
- [ ] Featured card (first) is full-width horizontal layout
- [ ] Grid cards are two per row with folder tabs
- [ ] AI badge shows sparkles icon (not text)
- [ ] Empty state has "Crea la prima lista" + "Organizza con AI" buttons
- [ ] Toolbar has sparkles + plus buttons (right placement)
- [ ] All existing collection functionality preserved (context menu, navigation, rename, delete)
- [ ] Both light and dark mode work correctly
- [ ] TypeScript compiles without errors
