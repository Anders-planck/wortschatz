# WortSchatz — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Mockups:** `.superpowers/brainstorm/4121-1774475381/wortschatz-plex-outfit.html`

## Problem

LEO (dict.leo.org/tedesco-italiano) is an excellent dictionary but a terrible learning tool. It gives 528 results for "machen" with no hierarchy, no personal tracking, and its vocabulary trainer is disconnected from the lookup flow. The gap: looking up a word and actually learning it are two separate activities.

## Solution

WortSchatz is a mobile-first smart dictionary for learning German from Italian. Every search automatically builds a personal vocabulary. An AI layer enriches words with contextual examples and usage notes. A lightweight tutor proposes spaced repetition reviews.

## Core Principles

1. **Simplification first** — show essential info immediately, details on demand
2. **Zero-friction vocabulary** — every search is auto-saved
3. **Context over translation** — know HOW to use a word, not just what it means
4. **Tutor, not teacher** — proactive but respectful, the user controls the pace

## Architecture

### Approach: Hybrid (Wiktionary + LLM)

```
[Search Input]
     ↓
[SQLite Cache] → hit? → show card instantly
     ↓ miss
[Wiktionary REST API]  ──────→ structured data (gender, plural, conjugation, translations)
[Gemini Flash via AI SDK] ──→ examples, context, clickable word data (streaming)
     ↓
[Card composes in 2 phases]
  Phase 1 (~200ms): Wiktionary data renders
  Phase 2 (~1-2s): AI content streams in
     ↓
[Auto-save to SQLite]
     ↓
[Next lookup: instant from cache]
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Expo SDK 54, React Native 0.81 |
| Router | Expo Router 6 (file-based, typed) |
| Navigation | NativeTabs (`expo-router/unstable-native-tabs`) — NOT JS Tabs |
| Icons | SF Symbols via `expo-symbols` SymbolView |
| Animations | react-native-reanimated 4 (FadeIn/FadeOut, layout transitions) |
| Haptics | expo-haptics (conditional on iOS) |
| AI | Vercel AI SDK → Gemini 2.0 Flash |
| Storage | expo-sqlite (full SQLite + localStorage polyfill for prefs) |
| Language | TypeScript 5.9, strict |
| Architecture | New Architecture + React Compiler |

### Database Schema (SQLite)

```sql
words
├── id            INTEGER PRIMARY KEY AUTOINCREMENT
├── term          TEXT NOT NULL (indexed, unique)
├── type          TEXT NOT NULL  -- "noun" | "verb" | "preposition" | "adjective" | "adverb"
├── gender        TEXT           -- "der" | "die" | "das" | null
├── plural        TEXT           -- nullable
├── translations  TEXT NOT NULL  -- JSON: ["tavolo", "scrivania"]
├── forms         TEXT           -- JSON: conjugations/declensions
├── examples      TEXT           -- JSON: [{sentence, translation, words: [{word, meaning}]}]
├── usage_context TEXT           -- AI-generated usage explanation
├── audio_url     TEXT           -- nullable
├── raw_wiktionary TEXT          -- JSON: raw data for future use
├── searched_at   TEXT NOT NULL  -- ISO datetime
├── review_score  INTEGER DEFAULT 0
├── next_review   TEXT           -- ISO datetime, nullable
├── category      TEXT           -- AI-assigned: "furniture", "emotion", "movement"...
└── created_at    TEXT NOT NULL  -- ISO datetime
```

### Data Flow: Cost Estimate

| Model | Cost/search | 1000 unique words | Annual (2000-5000) |
|-------|------------|-------------------|-------------------|
| Gemini 2.0 Flash | ~$0.0002 | ~$0.20 | $0.40 - $1.00 |

Cache eliminates repeat lookups. Realistic annual cost: under $1.

## Screens

### Navigation: NativeTabs (3 tabs)

Uses `NativeTabs` from `expo-router/unstable-native-tabs` for native iOS tab bar (liquid glass on iOS 26+).

```
app/
  _layout.tsx                — NativeTabs (root)
  (search)/
    _layout.tsx              — Stack (search tab)
    index.tsx                — Search screen (headerSearchBarOptions)
    word/[term].tsx          — Word card detail
  (vocabulary)/
    _layout.tsx              — Stack (vocabulary tab)
    index.tsx                — Vocabulary list
    word/[term].tsx          — Word card detail (shared)
  (review)/
    _layout.tsx              — Stack (review tab)
    index.tsx                — Review dashboard
    session.tsx              — Active review session
```

```tsx
// app/_layout.tsx
<NativeTabs minimizeBehavior="onScrollDown">
  <NativeTabs.Trigger name="(search)" role="search">
    <Icon sf="magnifyingglass" />
    <Label>Cerca</Label>
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="(vocabulary)">
    <Icon sf="list.bullet" />
    <Label>Parole</Label>
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="(review)">
    <Icon sf="arrow.counterclockwise" />
    <Label>Ripasso</Label>
  </NativeTabs.Trigger>
</NativeTabs>
```

| Tab | SF Symbol | Role | Purpose |
|-----|-----------|------|---------|
| Cerca | magnifyingglass | search | Search + word cards |
| Parole | list.bullet | — | Personal vocabulary list |
| Ripasso | arrow.counterclockwise | — | Review dashboard + sessions |

### Native UI Guidelines (from building-native-ui skill)

- **Tabs**: NativeTabs, never JS Tabs. Search tab last with `role="search"`
- **Headers**: Set via Stack.Screen options, not custom text. Use `headerLargeTitle: true`
- **Search**: Use `headerSearchBarOptions` on Stack.Screen, not custom input
- **ScrollView**: Always `contentInsetAdjustmentBehavior="automatic"` as first child
- **Icons**: SymbolView from expo-symbols, never FontAwesome/Ionicons
- **Styling**: Inline styles, never StyleSheet.create unless reusing. `borderCurve: 'continuous'` on rounded corners
- **Shadows**: CSS `boxShadow`, never legacy RN shadow props
- **Platform**: `process.env.EXPO_OS` not `Platform.OS`
- **Storage**: `expo-sqlite` for words DB, `expo-sqlite/localStorage` polyfill for preferences
- **Animations**: Reanimated v4. FadeIn/FadeOut on state changes, staggered list items, layout transitions
- **Links**: Use `<Link>` with `<Link.Preview />` for peek previews on word cards
- **Text**: `selectable` prop on translations and examples

### 1. Home / Splash

- App title "WortSchatz" in Outfit 700
- Organic warm blobs (peach #E8B98A, ochre #D4A87C, dusty rose #D4AAA0)
- Subtitle in Ubuntu Sans Mono
- Transitions to Search on tap

### 2. Search

- Uses native `headerSearchBarOptions` (not custom input) — integrates with iOS search bar UX
- `headerLargeTitle: true` with "Cerca" title
- When not searching: shows recent searches with gender dot indicator
- Each recent item: word (Outfit 600) + short translation (Plex 300)
- Tap recent → navigates to `word/[term]`
- Search is debounced (300ms) before hitting Wiktionary/cache
- Empty state when no results: "Nessun risultato per [term]"

### 3. Word Cards (adaptive by type)

#### Noun Card
- Gender color strip (28×3px) at top
- Word in Outfit 700 34px
- Phonetic + type in Ubuntu Sans Mono
- Gender + plural in mono
- Translation in IBM Plex Sans
- Declension table (N/A/D/G × singular/plural)
- Example sentence with clickable words (ochre highlight)
- Italian translation
- Context box (cream background, border-radius 6px)

#### Verb Card
- No gender strip
- Word in Outfit 700 34px
- Präteritum + Perfekt in mono italic
- Present tense conjugation grid (2 columns)
- "Governs" section with Akk/Dat pills
- Example + context

#### Preposition Card
- Word in Outfit 700 34px
- "Wechselpräposition" label in mono
- Cases section: Akk and Dat each with pill, example, translation
- Context box

### 4. Vocabulary List

- Title "My Words" in Outfit 600
- Filter chips: All / Nouns / Verbs / Prep. (Ubuntu Sans Mono, 4px radius)
- List items with color-coded left bar (4×28px):
  - der: #C4A96A (ochre)
  - die: #D4AAA0 (dusty rose)
  - das: #8DB58A (sage)
  - verbs: #B0A8D0 (lavender)
  - prepositions: #A8C0D0 (muted blue)
- Word in Outfit 600, translation in Plex Sans 300
- Default sort: chronological (newest first)

### 5. Review — Dashboard

- Greeting with streak counter
- Today's session card: dot progress (colored = done, gray = pending), "Start session" button
- Tricky words: cards showing words missed most, with reason labels
- Weekly activity: bar chart by day

### 6. Review — Session (Question)

- Minimal header: "4 / 12" counter + exit
- Segmented progress bar (colored segments per completed word)
- Word centered at 42px Outfit 700, maximum breathing room
- Gender micro-dot above word
- "Tap to reveal" dashed box
- 4 response buttons (Anki-style): Again / Hard / Good / Easy

### 7. Review — Session (Revealed)

- Same header + progress
- Word + phonetic + gender info centered
- Divider
- Translation centered
- Governs section (if applicable)
- Example sentence with clickable words
- Context box
- Same 4 response buttons at bottom

## Design System

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| `--serif` (display) | Outfit | 600-700 | Word titles, headings, list names, stat numbers |
| `--sans` (body) | IBM Plex Sans | 300-500 | Translations, examples, context, buttons |
| `--mono` (data) | Ubuntu Sans Mono | 400-600 | Section labels, phonetics, metadata, tabs, filters, counters |

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | #F0EDE6 | Page background (cream) |
| `--card` | #FFFFFF | Card/phone background |
| `--cream` | #FAF8F4 | Context boxes, stat cards, review cards |
| `--text` | #2C2C2C | Primary text |
| `--text-2` | #5C5650 | Secondary text (translations) |
| `--text-3` | #8A8078 | Tertiary (context body) |
| `--text-4` | #A09890 | Quaternary (definitions) |
| `--text-5` | #B5AFA8 | Muted (hints, phonetics) |
| `--text-6` | #C5BFB5 | Ghost (section titles, placeholders) |
| `--border` | #E8E4DD | Borders, inputs |
| `--border-light` | #F0EDE8 | Dividers, list separators |
| `--der` | #C4A96A | Masculine gender (ochre) |
| `--die` | #D4AAA0 | Feminine gender (dusty rose) |
| `--das` | #8DB58A | Neuter gender (sage) |
| `--verb` | #B0A8D0 | Verb indicator (lavender) |
| `--prep` | #A8C0D0 | Preposition indicator (muted blue) |
| `--akk-bg` | #F0E8D8 | Akkusativ pill background |
| `--akk-text` | #8A7A5A | Akkusativ pill text |
| `--dat-bg` | #E0ECD8 | Dativ pill background |
| `--dat-text` | #5A7A50 | Dativ pill text |

### Spacing & Radii

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| Phone radius | 32px |
| Dividers | 1px gradient (border → transparent) |
| Gender strip | 28×3px, radius 2px |
| Gender dot | 7×7px circle |
| Vocab color bar | 4×28px, radius 2px |

### Interaction Patterns

- **Clickable words in examples**: ochre gradient highlight (transparent 58% → rgba(196,169,106,0.18) 58%), tap opens mini-card popup
- **Search input**: 1.5px border, Outfit font for typed text
- **Buttons**: 1.5px border, 4px radius, never filled (border color for semantics)
- **Cards stream in**: Wiktionary data renders immediately, AI sections fade in via reanimated
- **Haptic feedback**: light impact on tab switches (existing HapticTab component)

## Data Sources

### Layer 1: Wiktionary REST API (free, immediate)

Provides: gender, plural, translations (DE→IT), declension/conjugation tables, phonetic transcription, audio URL.

Parsing required: Wiktionary's structured data needs extraction logic per word type.

### Layer 2: Gemini 2.0 Flash via Vercel AI SDK (streaming)

Provides: 2-3 contextual example sentences, usage explanation, word-by-word translations for clickable words, automatic category tagging.

Prompt includes: word + type + Wiktionary data as context → structured JSON output (Zod schema).

### Caching Strategy

- First lookup: network → compose → save to SQLite
- Subsequent lookups: SQLite → instant display
- Offline: all previously searched words work without network

## Spaced Repetition

Simple SM-2 variant:
- `review_score`: 0-5 scale
- `next_review`: calculated from score + interval
- 4 response buttons map to score adjustments
- Dashboard surfaces words due for review + tricky words (lowest scores)

## Implementation Notes

### Word Card as Shared Route

`word/[term].tsx` is shared across search and vocabulary tabs via array route pattern `(search,vocabulary)`. Both tabs can push to the same word card detail screen.

### AI Streaming Pattern

Use Vercel AI SDK `useChat` or `streamText` with Zod schema for structured output:

```tsx
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const WordContextSchema = z.object({
  examples: z.array(z.object({
    sentence: z.string(),
    translation: z.string(),
    words: z.array(z.object({ word: z.string(), meaning: z.string() })),
  })),
  usageContext: z.string(),
  category: z.string(),
});
```

### Animations

- Word card sections: `FadeInUp.delay(index * 50)` staggered
- AI content streaming: `FadeIn.duration(300)` as sections populate
- Review card flip: custom shared value animation
- List items: `FadeInUp` entering, `FadeOutUp` exiting, `LinearTransition` layout

### Haptics

- Tab switches: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Review button press: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- Word saved notification: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

## Out of Scope (v1)

- Cloud sync / multi-device
- Voice input / OCR
- Custom word lists / folders
- Social features
- Offline-first new lookups (requires network for uncached words)
- Dark mode (future, system-level via Expo)
- iPad/tablet layout
