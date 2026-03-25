# WortSchatz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. MUST follow `.agents/skills/building-native-ui/` guidelines for all UI work.

**Goal:** Build a German-Italian smart dictionary app with adaptive word cards, auto-saved vocabulary, and spaced repetition review.

**Architecture:** Feature-based under `src/features/`. Expo Router with NativeTabs for navigation. SQLite for local persistence. Wiktionary API for structured data + Gemini Flash via Vercel AI SDK for contextual enrichment.

**Tech Stack:** Expo 54, React Native 0.81, NativeTabs, expo-sqlite, Vercel AI SDK, Gemini 2.0 Flash, Reanimated 4, TypeScript 5.9 strict.

**Spec:** `docs/superpowers/specs/2026-03-25-wortschatz-design.md`

---

## File Structure

```
app/
  _layout.tsx                          — NativeTabs root layout
  (search,vocabulary)/
    _layout.tsx                        — Shared Stack for search + vocabulary tabs
    index.tsx                          — anchor route (unused, redirects)
    search.tsx                         — Search screen with headerSearchBarOptions
    vocabulary.tsx                     — Vocabulary list screen
    word/[term].tsx                    — Word card detail (shared route)
  (review)/
    _layout.tsx                        — Stack for review tab
    index.tsx                          — Review dashboard
    session.tsx                        — Active review session

src/
  features/
    dictionary/
      components/
        word-card.tsx                  — Adaptive word card container
        noun-sections.tsx              — Noun-specific: declension, gender strip
        verb-sections.tsx              — Verb-specific: conjugation, governs
        preposition-sections.tsx       — Preposition-specific: cases with examples
        declension-table.tsx           — N/A/D/G grid
        conjugation-table.tsx          — 2-col present tense grid
        example-sentence.tsx           — Sentence with clickable words
        context-box.tsx                — AI context explanation
        case-pill.tsx                  — Akk/Dat/Gen pill
        gender-strip.tsx               — Colored top strip
      services/
        wiktionary-client.ts           — Wiktionary REST API + parsing
        ai-context-service.ts          — Gemini Flash structured generation
      hooks/
        use-word-lookup.ts             — Orchestrates cache → Wiktionary → AI
      schemas/
        word-schema.ts                 — Zod schemas (Word, WordContext, etc.)
      types.ts                         — TypeScript types for word data

    search/
      components/
        recent-searches.tsx            — Recent items list with gender dots
      hooks/
        use-search.ts                  — Debounced search + headerSearchBar bridge

    vocabulary/
      components/
        vocabulary-item.tsx            — Single row with color bar
        filter-chips.tsx               — Type filter row
      hooks/
        use-vocabulary.ts              — Read all words with filters

    review/
      components/
        dashboard-stats.tsx            — Stat cards + streak
        today-session-card.tsx         — Session CTA with dot progress
        tricky-words-list.tsx          — Worst-performing words
        weekly-chart.tsx               — 7-day bar chart
        review-card.tsx                — Flashcard (question + revealed states)
        session-progress.tsx           — Segmented progress bar
        response-buttons.tsx           — Again/Hard/Good/Easy
      hooks/
        use-review-session.ts          — Session state machine
        use-spaced-repetition.ts       — SM-2 scoring + next_review calc

  shared/
    db/
      database.ts                      — openDatabaseAsync + CREATE TABLE
      words-repository.ts              — CRUD: insert, getByTerm, getAll, update
    theme/
      colors.ts                        — All color tokens as const object
      typography.ts                    — Font families + text style helpers
    components/
      divider.tsx                      — Gradient 1px divider
      section-title.tsx                — Uppercase mono label
    hooks/
      use-haptics.ts                   — Conditional haptics helper
```

---

### Task 1: Project Restructure + Dependencies

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Modify: `tsconfig.json`
- Delete: `app/(tabs)/`, `app/modal.tsx`, `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/external-link.tsx`, `components/haptic-tab.tsx`, `components/ui/collapsible.tsx`, `components/ui/icon-symbol.tsx`, `components/ui/icon-symbol.ios.tsx`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `hooks/use-theme-color.ts`, `constants/theme.ts`
- Create: `src/shared/theme/colors.ts`
- Create: `src/shared/theme/typography.ts`
- Create: `src/shared/components/divider.tsx`
- Create: `src/shared/components/section-title.tsx`
- Create: `src/shared/hooks/use-haptics.ts`

- [ ] **Step 1: Install new dependencies**

```bash
cd /Users/anders/Desktop/works/perso/learn-lang
bun add expo-sqlite ai @ai-sdk/google zod
bun add -d expo-font
```

- [ ] **Step 2: Update tsconfig.json path aliases**

Add `@/src/*` alias alongside existing `@/*`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"],
      "@src/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 3: Update app.json**

Change name/slug and add fonts:

```json
{
  "expo": {
    "name": "WortSchatz",
    "slug": "wortschatz",
    "scheme": "wortschatz"
  }
}
```

Keep all other existing config (orientation, icons, plugins, experiments).

- [ ] **Step 4: Delete old template files**

```bash
rm -rf app/(tabs) app/modal.tsx
rm -rf components/ hooks/ constants/
```

- [ ] **Step 5: Create theme/colors.ts**

```ts
// src/shared/theme/colors.ts
export const colors = {
  bg: '#F0EDE6',
  card: '#FFFFFF',
  cream: '#FAF8F4',

  text: '#2C2C2C',
  text2: '#5C5650',
  text3: '#8A8078',
  text4: '#A09890',
  text5: '#B5AFA8',
  text6: '#C5BFB5',

  border: '#E8E4DD',
  borderLight: '#F0EDE8',

  der: '#C4A96A',
  die: '#D4AAA0',
  das: '#8DB58A',
  verb: '#B0A8D0',
  prep: '#A8C0D0',

  akkBg: '#F0E8D8',
  akkText: '#8A7A5A',
  datBg: '#E0ECD8',
  datText: '#5A7A50',
} as const;
```

- [ ] **Step 6: Create theme/typography.ts**

```ts
// src/shared/theme/typography.ts
export const fonts = {
  display: 'Outfit',
  body: 'IBM Plex Sans',
  mono: 'Ubuntu Sans Mono',
} as const;

export const textStyles = {
  word: { fontFamily: fonts.display, fontSize: 34, fontWeight: '700' as const, color: '#2C2C2C', letterSpacing: -1 },
  heading: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600' as const, color: '#2C2C2C', letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 15, fontWeight: '400' as const, color: '#5C5650' },
  bodyLight: { fontFamily: fonts.body, fontSize: 13, fontWeight: '300' as const, color: '#8A8078' },
  mono: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '500' as const, color: '#B5AFA8' },
  monoLabel: { fontFamily: fonts.mono, fontSize: 9, fontWeight: '600' as const, color: '#C5BFB5', letterSpacing: 1.5, textTransform: 'uppercase' as const },
} as const;
```

- [ ] **Step 7: Create shared components**

`src/shared/components/divider.tsx`:
```tsx
import { View } from 'react-native';
import { colors } from '@src/shared/theme/colors';

export function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.6,
        marginVertical: 14,
      }}
    />
  );
}
```

`src/shared/components/section-title.tsx`:
```tsx
import { Text, type TextProps } from 'react-native';
import { textStyles } from '@src/shared/theme/typography';

export function SectionTitle({ children, ...props }: TextProps) {
  return (
    <Text style={[textStyles.monoLabel, { marginBottom: 8 }]} {...props}>
      {children}
    </Text>
  );
}
```

- [ ] **Step 8: Create use-haptics hook**

```ts
// src/shared/hooks/use-haptics.ts
import * as Haptics from 'expo-haptics';

export function hapticLight() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function hapticMedium() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function hapticSuccess() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: restructure project, add deps, create theme + shared components"
```

---

### Task 2: Database Layer

**Files:**
- Create: `src/shared/db/database.ts`
- Create: `src/shared/db/words-repository.ts`
- Create: `src/features/dictionary/schemas/word-schema.ts`
- Create: `src/features/dictionary/types.ts`

- [ ] **Step 1: Create Zod schemas and types**

`src/features/dictionary/schemas/word-schema.ts`:
```ts
import { z } from 'zod';

export const WordTypeSchema = z.enum(['noun', 'verb', 'preposition', 'adjective', 'adverb']);
export const GenderSchema = z.enum(['der', 'die', 'das']);

export const ClickableWordSchema = z.object({
  word: z.string(),
  meaning: z.string(),
});

export const ExampleSchema = z.object({
  sentence: z.string(),
  translation: z.string(),
  words: z.array(ClickableWordSchema),
});

export const WordContextSchema = z.object({
  examples: z.array(ExampleSchema),
  usageContext: z.string(),
  category: z.string(),
});

export const WordSchema = z.object({
  id: z.number().optional(),
  term: z.string(),
  type: WordTypeSchema,
  gender: GenderSchema.nullable(),
  plural: z.string().nullable(),
  translations: z.array(z.string()),
  forms: z.record(z.string(), z.unknown()).nullable(),
  examples: z.array(ExampleSchema).nullable(),
  usageContext: z.string().nullable(),
  audioUrl: z.string().nullable(),
  rawWiktionary: z.record(z.string(), z.unknown()).nullable(),
  searchedAt: z.string(),
  reviewScore: z.number().default(0),
  nextReview: z.string().nullable(),
  category: z.string().nullable(),
  createdAt: z.string(),
});
```

`src/features/dictionary/types.ts`:
```ts
import type { z } from 'zod';
import type { WordSchema, WordTypeSchema, GenderSchema, ExampleSchema, WordContextSchema } from './schemas/word-schema';

export type WordType = z.infer<typeof WordTypeSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type WordContext = z.infer<typeof WordContextSchema>;
export type Word = z.infer<typeof WordSchema>;
```

- [ ] **Step 2: Create database initialization**

`src/shared/db/database.ts`:
```ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('wortschatz.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      gender TEXT,
      plural TEXT,
      translations TEXT NOT NULL,
      forms TEXT,
      examples TEXT,
      usage_context TEXT,
      audio_url TEXT,
      raw_wiktionary TEXT,
      searched_at TEXT NOT NULL,
      review_score INTEGER DEFAULT 0,
      next_review TEXT,
      category TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_words_term ON words(term);
    CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review);
  `);

  return db;
}
```

- [ ] **Step 3: Create words repository**

`src/shared/db/words-repository.ts`:
```ts
import { getDatabase } from './database';
import type { Word } from '@src/features/dictionary/types';

interface WordRow {
  id: number;
  term: string;
  type: string;
  gender: string | null;
  plural: string | null;
  translations: string;
  forms: string | null;
  examples: string | null;
  usage_context: string | null;
  audio_url: string | null;
  raw_wiktionary: string | null;
  searched_at: string;
  review_score: number;
  next_review: string | null;
  category: string | null;
  created_at: string;
}

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    term: row.term,
    type: row.type as Word['type'],
    gender: row.gender as Word['gender'],
    plural: row.plural,
    translations: JSON.parse(row.translations),
    forms: row.forms ? JSON.parse(row.forms) : null,
    examples: row.examples ? JSON.parse(row.examples) : null,
    usageContext: row.usage_context,
    audioUrl: row.audio_url,
    rawWiktionary: row.raw_wiktionary ? JSON.parse(row.raw_wiktionary) : null,
    searchedAt: row.searched_at,
    reviewScore: row.review_score,
    nextReview: row.next_review,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function getWordByTerm(term: string): Promise<Word | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WordRow>(
    'SELECT * FROM words WHERE term = ? COLLATE NOCASE',
    [term],
  );
  return row ? rowToWord(row) : null;
}

export async function insertWord(word: Omit<Word, 'id'>): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT OR REPLACE INTO words (term, type, gender, plural, translations, forms, examples, usage_context, audio_url, raw_wiktionary, searched_at, review_score, next_review, category, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      word.term,
      word.type,
      word.gender,
      word.plural,
      JSON.stringify(word.translations),
      word.forms ? JSON.stringify(word.forms) : null,
      word.examples ? JSON.stringify(word.examples) : null,
      word.usageContext,
      word.audioUrl,
      word.rawWiktionary ? JSON.stringify(word.rawWiktionary) : null,
      word.searchedAt,
      word.reviewScore,
      word.nextReview,
      word.category,
      word.createdAt || now,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateWordAIContent(
  term: string,
  examples: unknown[],
  usageContext: string,
  category: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE words SET examples = ?, usage_context = ?, category = ? WHERE term = ? COLLATE NOCASE',
    [JSON.stringify(examples), usageContext, category, term],
  );
}

export async function getAllWords(filter?: { type?: string }): Promise<Word[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM words ORDER BY searched_at DESC';
  const params: string[] = [];

  if (filter?.type) {
    query = 'SELECT * FROM words WHERE type = ? ORDER BY searched_at DESC';
    params.push(filter.type);
  }

  const rows = await db.getAllAsync<WordRow>(query, params);
  return rows.map(rowToWord);
}

export async function getWordsForReview(limit = 20): Promise<Word[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE next_review IS NULL OR next_review <= ? ORDER BY review_score ASC, searched_at DESC LIMIT ?',
    [now, limit],
  );
  return rows.map(rowToWord);
}

export async function getTrickyWords(limit = 5): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE review_score < 3 ORDER BY review_score ASC LIMIT ?',
    [limit],
  );
  return rows.map(rowToWord);
}

export async function updateReviewScore(
  term: string,
  score: number,
  nextReview: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE words SET review_score = ?, next_review = ? WHERE term = ? COLLATE NOCASE',
    [score, nextReview, term],
  );
}

export async function getWordCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words');
  return row?.count ?? 0;
}

export async function getRecentWords(limit = 20): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words ORDER BY searched_at DESC LIMIT ?',
    [limit],
  );
  return rows.map(rowToWord);
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): add SQLite database layer with words repository"
```

---

### Task 3: Dictionary Services (Wiktionary + AI)

**Files:**
- Create: `src/features/dictionary/services/wiktionary-client.ts`
- Create: `src/features/dictionary/services/ai-context-service.ts`
- Create: `src/features/dictionary/hooks/use-word-lookup.ts`

- [ ] **Step 1: Create Wiktionary client**

`src/features/dictionary/services/wiktionary-client.ts`:
```ts
import type { Word, WordType, Gender } from '../types';

interface WiktionaryPage {
  title: string;
  extract?: string;
  // Wiktionary REST API response shape
  [key: string]: unknown;
}

const WIKTIONARY_API = 'https://de.wiktionary.org/api/rest_v1';

export async function fetchFromWiktionary(term: string): Promise<Partial<Word> | null> {
  try {
    const response = await fetch(
      `${WIKTIONARY_API}/page/summary/${encodeURIComponent(term)}`,
    );

    if (!response.ok) return null;

    const data: WiktionaryPage = await response.json();

    // Parse the extract for gender, type, translations
    const parsed = parseWiktionaryData(term, data);
    return parsed;
  } catch {
    return null;
  }
}

function parseWiktionaryData(term: string, data: WiktionaryPage): Partial<Word> {
  const extract = data.extract ?? '';

  // Detect word type and gender from extract
  const type = detectWordType(extract);
  const gender = detectGender(extract);
  const plural = extractPlural(extract);

  return {
    term,
    type: type ?? 'noun',
    gender,
    plural,
    translations: [], // Will be enriched by AI or manual lookup
    rawWiktionary: data as Record<string, unknown>,
  };
}

function detectWordType(extract: string): WordType | null {
  const lower = extract.toLowerCase();
  if (lower.includes('verb')) return 'verb';
  if (lower.includes('substantiv') || lower.includes('nomen')) return 'noun';
  if (lower.includes('präposition')) return 'preposition';
  if (lower.includes('adjektiv')) return 'adjective';
  if (lower.includes('adverb')) return 'adverb';
  return null;
}

function detectGender(extract: string): Gender | null {
  if (extract.includes('Maskulinum') || extract.includes(', m')) return 'der';
  if (extract.includes('Femininum') || extract.includes(', f')) return 'die';
  if (extract.includes('Neutrum') || extract.includes(', n')) return 'das';
  return null;
}

function extractPlural(extract: string): string | null {
  const match = extract.match(/Plural[:\s]+(\S+)/i);
  return match?.[1] ?? null;
}
```

- [ ] **Step 2: Create AI context service**

`src/features/dictionary/services/ai-context-service.ts`:
```ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { WordContextSchema } from '../schemas/word-schema';
import type { WordContext, Word } from '../types';

export async function generateWordContext(
  word: Partial<Word>,
): Promise<WordContext> {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: WordContextSchema,
    prompt: buildPrompt(word),
  });

  return object;
}

function buildPrompt(word: Partial<Word>): string {
  const genderStr = word.gender ? ` (${word.gender})` : '';
  const typeStr = word.type ?? 'word';

  return `You are a German language tutor helping an Italian speaker learn German.

Word: "${word.term}"${genderStr}
Type: ${typeStr}
${word.plural ? `Plural: ${word.plural}` : ''}

Provide:
1. **examples**: 2-3 real-world example sentences in German with Italian translations. For each word in the sentence, provide its Italian meaning. Use natural, everyday German (B1 level).
2. **usageContext**: A short explanation (2-3 sentences) in English about WHEN and HOW to use this word. Include common mistakes or confusions with similar words. Be practical.
3. **category**: A single-word semantic category (e.g., "furniture", "emotion", "movement", "food").

For nouns: include the article in examples to reinforce gender.
For verbs: show which case they govern (Akkusativ/Dativ) in the examples.
For prepositions: show both cases they govern with examples if it's a Wechselpräposition.

Keep it concise and practical. This is for a mobile app card.`;
}
```

- [ ] **Step 3: Create use-word-lookup hook**

`src/features/dictionary/hooks/use-word-lookup.ts`:
```ts
import { useState, useCallback } from 'react';
import { getWordByTerm, insertWord, updateWordAIContent } from '@src/shared/db/words-repository';
import { fetchFromWiktionary } from '../services/wiktionary-client';
import { generateWordContext } from '../services/ai-context-service';
import type { Word } from '../types';

interface LookupState {
  word: Word | null;
  isLoading: boolean;
  isAILoading: boolean;
  error: string | null;
}

export function useWordLookup() {
  const [state, setState] = useState<LookupState>({
    word: null,
    isLoading: false,
    isAILoading: false,
    error: null,
  });

  const lookup = useCallback(async (term: string) => {
    setState({ word: null, isLoading: true, isAILoading: false, error: null });

    try {
      // Phase 0: Check cache
      const cached = await getWordByTerm(term);
      if (cached) {
        setState({ word: cached, isLoading: false, isAILoading: false, error: null });
        // Update searched_at
        return;
      }

      // Phase 1: Wiktionary (fast)
      const wiktData = await fetchFromWiktionary(term);
      const now = new Date().toISOString();
      const baseWord: Omit<Word, 'id'> = {
        term,
        type: wiktData?.type ?? 'noun',
        gender: wiktData?.gender ?? null,
        plural: wiktData?.plural ?? null,
        translations: wiktData?.translations ?? [],
        forms: null,
        examples: null,
        usageContext: null,
        audioUrl: null,
        rawWiktionary: wiktData?.rawWiktionary ?? null,
        searchedAt: now,
        reviewScore: 0,
        nextReview: null,
        category: null,
        createdAt: now,
      };

      const id = await insertWord(baseWord);
      const savedWord: Word = { ...baseWord, id };

      setState({ word: savedWord, isLoading: false, isAILoading: true, error: null });

      // Phase 2: AI enrichment (streaming, background)
      try {
        const context = await generateWordContext(baseWord);
        await updateWordAIContent(term, context.examples, context.usageContext, context.category);
        const enriched: Word = {
          ...savedWord,
          examples: context.examples,
          usageContext: context.usageContext,
          category: context.category,
        };
        setState({ word: enriched, isLoading: false, isAILoading: false, error: null });
      } catch {
        // AI failure is non-critical — word still usable
        setState(prev => ({ ...prev, isAILoading: false }));
      }
    } catch (err) {
      setState({ word: null, isLoading: false, isAILoading: false, error: 'Lookup failed' });
    }
  }, []);

  return { ...state, lookup };
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dictionary): add Wiktionary client, AI context service, word lookup hook"
```

---

### Task 4: Navigation Shell (NativeTabs + Stacks)

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(search,vocabulary)/_layout.tsx`
- Create: `app/(search,vocabulary)/search.tsx` (placeholder)
- Create: `app/(search,vocabulary)/vocabulary.tsx` (placeholder)
- Create: `app/(review)/_layout.tsx`
- Create: `app/(review)/index.tsx` (placeholder)

- [ ] **Step 1: Create root layout with NativeTabs**

`app/_layout.tsx`:
```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F0EDE6',
    card: '#FFFFFF',
    text: '#2C2C2C',
    border: '#E8E4DD',
    primary: '#C4A96A',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit': require('@/assets/fonts/Outfit-Variable.ttf'),
    'IBMPlexSans-Light': require('@/assets/fonts/IBMPlexSans-Light.ttf'),
    'IBMPlexSans-Regular': require('@/assets/fonts/IBMPlexSans-Regular.ttf'),
    'IBMPlexSans-Medium': require('@/assets/fonts/IBMPlexSans-Medium.ttf'),
    'UbuntuSansMono-Regular': require('@/assets/fonts/UbuntuSansMono-Regular.ttf'),
    'UbuntuSansMono-Medium': require('@/assets/fonts/UbuntuSansMono-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={theme}>
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="(search,vocabulary)" resetOnPress>
          <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
          <Label>Cerca</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search,vocabulary)" resetOnPress>
          <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
          <Label>Parole</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(review)">
          <Icon sf={{ default: 'arrow.counterclockwise', selected: 'arrow.counterclockwise' }} />
          <Label>Ripasso</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
```

Note: The exact NativeTabs structure for shared routes `(search,vocabulary)` needs validation. If array routes don't work with NativeTabs in SDK 54, fall back to separate tab groups with duplicated word/[term] route.

- [ ] **Step 2: Create shared stack layout**

`app/(search,vocabulary)/_layout.tsx`:
```tsx
import Stack from 'expo-router/stack';
import { PlatformColor } from 'react-native';

export const unstable_settings = {
  search: { anchor: 'search' },
  vocabulary: { anchor: 'vocabulary' },
};

export default function SharedLayout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1] ?? 'search';
  const titles: Record<string, string> = {
    search: 'Cerca',
    vocabulary: 'Parole',
  };

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: PlatformColor('label') },
        headerLargeTitle: true,
        headerBlurEffect: 'none',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name={screen} options={{ title: titles[screen] }} />
      <Stack.Screen
        name="word/[term]"
        options={{ headerLargeTitle: false, title: '' }}
      />
    </Stack>
  );
}
```

- [ ] **Step 3: Create placeholder screens**

`app/(search,vocabulary)/search.tsx`:
```tsx
import { ScrollView, Text, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { textStyles } from '@src/shared/theme/typography';

export default function SearchScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <Text style={textStyles.body}>Search coming soon...</Text>
    </ScrollView>
  );
}
```

`app/(search,vocabulary)/vocabulary.tsx`:
```tsx
import { ScrollView, Text } from 'react-native';
import { textStyles } from '@src/shared/theme/typography';

export default function VocabularyScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <Text style={textStyles.body}>Vocabulary coming soon...</Text>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Create review stack + placeholder**

`app/(review)/_layout.tsx`:
```tsx
import Stack from 'expo-router/stack';
import { PlatformColor } from 'react-native';

export default function ReviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: PlatformColor('label') },
        headerLargeTitle: true,
        headerBlurEffect: 'none',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ripasso' }} />
      <Stack.Screen
        name="session"
        options={{ headerLargeTitle: false, title: 'Session', presentation: 'modal' }}
      />
    </Stack>
  );
}
```

`app/(review)/index.tsx`:
```tsx
import { ScrollView, Text } from 'react-native';
import { textStyles } from '@src/shared/theme/typography';

export default function ReviewScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <Text style={textStyles.body}>Review dashboard coming soon...</Text>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Download fonts to assets/fonts/**

```bash
mkdir -p assets/fonts
# Download Outfit Variable, IBM Plex Sans (Light/Regular/Medium), Ubuntu Sans Mono (Regular/Medium)
# From Google Fonts — exact download commands depend on availability
```

- [ ] **Step 6: Test navigation works**

```bash
npx expo start
```

Verify: 3 tabs appear, switching works, large titles show.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(nav): add NativeTabs shell with 3 tabs and Stack layouts"
```

---

### Task 5: Word Card Components

**Files:**
- Create: `src/features/dictionary/components/gender-strip.tsx`
- Create: `src/features/dictionary/components/case-pill.tsx`
- Create: `src/features/dictionary/components/declension-table.tsx`
- Create: `src/features/dictionary/components/conjugation-table.tsx`
- Create: `src/features/dictionary/components/example-sentence.tsx`
- Create: `src/features/dictionary/components/context-box.tsx`
- Create: `src/features/dictionary/components/noun-sections.tsx`
- Create: `src/features/dictionary/components/verb-sections.tsx`
- Create: `src/features/dictionary/components/preposition-sections.tsx`
- Create: `src/features/dictionary/components/word-card.tsx`
- Create: `app/(search,vocabulary)/word/[term].tsx`

- [ ] **Step 1: Create atomic components**

`src/features/dictionary/components/gender-strip.tsx`:
```tsx
import { View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import type { Gender } from '../types';

const genderColors: Record<Gender, string> = {
  der: colors.der,
  die: colors.die,
  das: colors.das,
};

export function GenderStrip({ gender }: { gender: Gender }) {
  return (
    <View
      style={{
        width: 28,
        height: 3,
        borderRadius: 2,
        backgroundColor: genderColors[gender],
        marginBottom: 12,
      }}
    />
  );
}
```

`src/features/dictionary/components/case-pill.tsx`:
```tsx
import { Text, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';

type CaseType = 'akk' | 'dat' | 'gen' | 'nom';

const caseStyles: Record<CaseType, { bg: string; text: string }> = {
  akk: { bg: colors.akkBg, text: colors.akkText },
  dat: { bg: colors.datBg, text: colors.datText },
  gen: { bg: '#E8E0F0', text: '#6A5A8A' },
  nom: { bg: '#E8E8E0', text: '#6A6A5A' },
};

export function CasePill({ type, label }: { type: CaseType; label: string }) {
  const style = caseStyles[type];
  return (
    <View
      style={{
        backgroundColor: style.bg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderCurve: 'continuous',
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 9, fontWeight: '600', color: style.text }}>
        {label}
      </Text>
    </View>
  );
}
```

`src/features/dictionary/components/example-sentence.tsx`:
```tsx
import { Text, Pressable, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';
import type { Example } from '../types';

export function ExampleSentence({
  example,
  onWordPress,
}: {
  example: Example;
  onWordPress?: (word: string, meaning: string) => void;
}) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 22 }}>
        {'„'}
        {example.words.map((w, i) => (
          <Text
            key={i}
            onPress={() => onWordPress?.(w.word, w.meaning)}
            style={{
              backgroundColor: 'rgba(196,169,106,0.18)',
            }}
          >
            {w.word}
            {i < example.words.length - 1 ? ' ' : ''}
          </Text>
        ))}
        {'"'}
      </Text>
      <Text
        selectable
        style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: '300', color: colors.text5, marginTop: 4 }}
      >
        {example.translation}
      </Text>
    </View>
  );
}
```

`src/features/dictionary/components/context-box.tsx`:
```tsx
import { Text, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';

export function ContextBox({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 6,
        borderCurve: 'continuous',
        padding: 14,
      }}
    >
      <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: '300', color: colors.text3, lineHeight: 19 }}>
        {text}
      </Text>
    </View>
  );
}
```

`src/features/dictionary/components/declension-table.tsx`:
```tsx
import { Text, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';

interface DeclensionData {
  nominativ: [string, string];
  akkusativ: [string, string];
  dativ: [string, string];
  genitiv: [string, string];
}

export function DeclensionTable({ data }: { data: DeclensionData }) {
  const rows = [
    { label: 'N', values: data.nominativ },
    { label: 'A', values: data.akkusativ },
    { label: 'D', values: data.dativ },
    { label: 'G', values: data.genitiv },
  ];

  return (
    <View style={{ gap: 3 }}>
      {rows.map(row => (
        <View key={row.label} style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.text6, fontWeight: '600', width: 22 }}>
            {row.label}
          </Text>
          <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text2, flex: 1 }}>
            {row.values[0]}
          </Text>
          <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text2, flex: 1 }}>
            {row.values[1]}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

`src/features/dictionary/components/conjugation-table.tsx`:
```tsx
import { Text, View } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';

interface ConjugationData {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

export function ConjugationTable({ data }: { data: ConjugationData }) {
  const rows = [
    [data.ich, data.wir],
    [data.du, data.ihr],
    [data.er, data.sie],
  ];

  return (
    <View style={{ gap: 2 }}>
      {rows.map((pair, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 16 }}>
          <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text2, flex: 1 }}>
            {pair[0]}
          </Text>
          <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text2, flex: 1 }}>
            {pair[1]}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Create word card container + type sections**

`src/features/dictionary/components/word-card.tsx`:
```tsx
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '@src/shared/theme/colors';
import { textStyles, fonts } from '@src/shared/theme/typography';
import { Divider } from '@src/shared/components/divider';
import { SectionTitle } from '@src/shared/components/section-title';
import { GenderStrip } from './gender-strip';
import { ExampleSentence } from './example-sentence';
import { ContextBox } from './context-box';
import { NounSections } from './noun-sections';
import { VerbSections } from './verb-sections';
import { PrepositionSections } from './preposition-sections';
import type { Word } from '../types';

export function WordCard({
  word,
  isAILoading,
}: {
  word: Word;
  isAILoading?: boolean;
}) {
  return (
    <View style={{ gap: 0 }}>
      {/* Gender strip for nouns */}
      {word.gender && <GenderStrip gender={word.gender} />}

      {/* Word title */}
      <Text selectable style={textStyles.word}>{word.term}</Text>

      {/* Phonetic + type */}
      <Text style={[textStyles.mono, { marginTop: 3 }]}>
        {word.type === 'noun' ? 'Noun' : word.type === 'verb' ? 'Verb' : word.type}
      </Text>

      {/* Gender + plural for nouns */}
      {word.gender && (
        <Text style={[textStyles.mono, { marginTop: 2 }]}>
          <Text style={{ color: word.gender === 'der' ? colors.der : word.gender === 'die' ? colors.die : colors.das, fontWeight: '600' }}>
            {word.gender}
          </Text>
          {word.plural ? ` · pl. ${word.plural}` : ''}
        </Text>
      )}

      {/* Verb forms */}
      {word.type === 'verb' && word.forms && (
        <Text style={[textStyles.mono, { marginTop: 2, fontStyle: 'italic' }]}>
          {(word.forms as Record<string, string>).prateritum} · {(word.forms as Record<string, string>).perfekt}
        </Text>
      )}

      <Divider />

      {/* Translation */}
      <Text selectable style={textStyles.body}>{word.translations.join(', ')}</Text>

      <Divider />

      {/* Type-specific sections */}
      {word.type === 'noun' && <NounSections word={word} />}
      {word.type === 'verb' && <VerbSections word={word} />}
      {word.type === 'preposition' && <PrepositionSections word={word} />}

      {/* AI content (fades in) */}
      {word.examples && word.examples.length > 0 && (
        <Animated.View entering={FadeInUp.duration(300)}>
          <Divider />
          <SectionTitle>Examples</SectionTitle>
          <View style={{ gap: 12 }}>
            {word.examples.map((ex, i) => (
              <ExampleSentence key={i} example={ex} />
            ))}
          </View>
        </Animated.View>
      )}

      {word.usageContext && (
        <Animated.View entering={FadeInUp.duration(300).delay(100)}>
          <Divider />
          <SectionTitle>Context</SectionTitle>
          <ContextBox text={word.usageContext} />
        </Animated.View>
      )}

      {isAILoading && (
        <Animated.View entering={FadeInUp.duration(200)}>
          <Divider />
          <Text style={[textStyles.mono, { textAlign: 'center', paddingVertical: 12 }]}>
            Loading context...
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
```

For brevity, `noun-sections.tsx`, `verb-sections.tsx`, `preposition-sections.tsx` each render their type-specific content (declension/conjugation/cases) using the atomic components. They receive the `Word` and extract the relevant `forms` data.

- [ ] **Step 3: Create word detail route**

`app/(search,vocabulary)/word/[term].tsx`:
```tsx
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { WordCard } from '@src/features/dictionary/components/word-card';
import { useWordLookup } from '@src/features/dictionary/hooks/use-word-lookup';
import { colors } from '@src/shared/theme/colors';

export default function WordDetailScreen() {
  const { term } = useLocalSearchParams<{ term: string }>();
  const { word, isLoading, isAILoading, lookup } = useWordLookup();

  useEffect(() => {
    if (term) lookup(term);
  }, [term, lookup]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      style={{ backgroundColor: colors.card }}
    >
      {word && <WordCard word={word} isAILoading={isAILoading} />}
    </ScrollView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dictionary): add word card components + detail route"
```

---

### Task 6: Search Feature

**Files:**
- Create: `src/features/search/hooks/use-search.ts`
- Create: `src/features/search/components/recent-searches.tsx`
- Modify: `app/(search,vocabulary)/search.tsx`

- [ ] **Step 1: Create search hook with headerSearchBarOptions**

`src/features/search/hooks/use-search.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from 'expo-router';
import { getWordByTerm } from '@src/shared/db/words-repository';

export function useSearchBar() {
  const [query, setQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Type a word...',
        autoCapitalize: 'none' as const,
        onChangeText: (e: { nativeEvent: { text: string } }) => {
          setQuery(e.nativeEvent.text);
        },
        onCancelButtonPress: () => setQuery(''),
      },
    });
  }, [navigation]);

  return query;
}
```

- [ ] **Step 2: Create recent searches component**

`src/features/search/components/recent-searches.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { colors } from '@src/shared/theme/colors';
import { fonts, textStyles } from '@src/shared/theme/typography';
import { Divider } from '@src/shared/components/divider';
import { SectionTitle } from '@src/shared/components/section-title';
import type { Word, Gender } from '@src/features/dictionary/types';

const genderColors: Record<string, string> = {
  der: colors.der,
  die: colors.die,
  das: colors.das,
};

function GenderDot({ gender }: { gender: Gender | null }) {
  if (!gender) return null;
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: genderColors[gender],
      }}
    />
  );
}

export function RecentSearches({ words }: { words: Word[] }) {
  if (words.length === 0) return null;

  return (
    <View>
      <SectionTitle>Recent</SectionTitle>
      {words.map((word, index) => (
        <Animated.View
          key={word.term}
          entering={FadeInUp.delay(index * 40).duration(200)}
          layout={LinearTransition}
        >
          <Link href={`/word/${encodeURIComponent(word.term)}`} asChild>
            <Pressable style={{ paddingVertical: 10 }}>
              <Link.Trigger>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <GenderDot gender={word.gender} />
                  <Text style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: '600', color: colors.text }}>
                    {word.term}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: '300', color: colors.text4, marginTop: 3 }}>
                  {word.translations.join(', ')}
                </Text>
              </Link.Trigger>
              <Link.Preview />
            </Pressable>
          </Link>
          <Divider />
        </Animated.View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Wire up search screen**

`app/(search,vocabulary)/search.tsx`:
```tsx
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { useSearchBar } from '@src/features/search/hooks/use-search';
import { RecentSearches } from '@src/features/search/components/recent-searches';
import { getRecentWords, getWordByTerm } from '@src/shared/db/words-repository';
import { colors } from '@src/shared/theme/colors';
import { textStyles } from '@src/shared/theme/typography';
import type { Word } from '@src/features/dictionary/types';

export default function SearchScreen() {
  const query = useSearchBar();
  const router = useRouter();
  const [recentWords, setRecentWords] = useState<Word[]>([]);

  useEffect(() => {
    getRecentWords(20).then(setRecentWords);
  }, []);

  // When user submits a search, navigate to word detail
  useEffect(() => {
    if (query.length >= 2) {
      const timeout = setTimeout(() => {
        router.push(`/word/${encodeURIComponent(query)}`);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [query, router]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
      style={{ backgroundColor: colors.bg }}
    >
      {!query && <RecentSearches words={recentWords} />}
      {query && query.length < 2 && (
        <Text style={[textStyles.mono, { textAlign: 'center', paddingTop: 40 }]}>
          Keep typing...
        </Text>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(search): add native search bar with recent searches"
```

---

### Task 7: Vocabulary List Feature

**Files:**
- Create: `src/features/vocabulary/components/vocabulary-item.tsx`
- Create: `src/features/vocabulary/components/filter-chips.tsx`
- Create: `src/features/vocabulary/hooks/use-vocabulary.ts`
- Modify: `app/(search,vocabulary)/vocabulary.tsx`

- [ ] **Step 1: Create vocabulary hook**

`src/features/vocabulary/hooks/use-vocabulary.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';
import { getAllWords } from '@src/shared/db/words-repository';
import type { Word } from '@src/features/dictionary/types';

export function useVocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllWords(filter ? { type: filter } : undefined);
    setWords(result);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  return { words, filter, setFilter, isLoading, refresh };
}
```

- [ ] **Step 2: Create vocabulary item + filter chips**

`src/features/vocabulary/components/vocabulary-item.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';
import type { Word } from '@src/features/dictionary/types';

const typeColors: Record<string, string> = {
  noun: colors.text3,
  verb: colors.verb,
  preposition: colors.prep,
  adjective: '#C0A8B0',
  adverb: '#A8B0C0',
};

function getBarColor(word: Word): string {
  if (word.gender === 'der') return colors.der;
  if (word.gender === 'die') return colors.die;
  if (word.gender === 'das') return colors.das;
  return typeColors[word.type] ?? colors.text5;
}

export function VocabularyItem({ word }: { word: Word }) {
  return (
    <Link href={`/word/${encodeURIComponent(word.term)}`} asChild>
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Link.Trigger>
          <View
            style={{
              width: 4,
              height: 28,
              borderRadius: 2,
              backgroundColor: getBarColor(word),
            }}
          />
          <Text style={{ fontFamily: fonts.display, fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>
            {word.term}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: '300', color: colors.text5 }}>
            {word.translations[0] ?? ''}
          </Text>
        </Link.Trigger>
        <Link.Preview />
      </Pressable>
    </Link>
  );
}
```

`src/features/vocabulary/components/filter-chips.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { colors } from '@src/shared/theme/colors';
import { fonts } from '@src/shared/theme/typography';
import { hapticLight } from '@src/shared/hooks/use-haptics';

const filters = [
  { label: 'All', value: undefined },
  { label: 'Nouns', value: 'noun' },
  { label: 'Verbs', value: 'verb' },
  { label: 'Prep.', value: 'preposition' },
];

export function FilterChips({
  active,
  onSelect,
  total,
}: {
  active: string | undefined;
  onSelect: (value: string | undefined) => void;
  total: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
      {filters.map(f => {
        const isActive = active === f.value;
        return (
          <Pressable
            key={f.label}
            onPress={() => { hapticLight(); onSelect(f.value); }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 4,
              borderCurve: 'continuous',
              backgroundColor: isActive ? colors.text : '#F5F2EC',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: '500',
                color: isActive ? colors.card : colors.text3,
              }}
            >
              {f.label}{!f.value ? ` (${total})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 3: Wire up vocabulary screen**

`app/(search,vocabulary)/vocabulary.tsx`:
```tsx
import { FlatList, View } from 'react-native';
import { useVocabulary } from '@src/features/vocabulary/hooks/use-vocabulary';
import { VocabularyItem } from '@src/features/vocabulary/components/vocabulary-item';
import { FilterChips } from '@src/features/vocabulary/components/filter-chips';
import { colors } from '@src/shared/theme/colors';

export default function VocabularyScreen() {
  const { words, filter, setFilter, isLoading } = useVocabulary();

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24 }}
      style={{ backgroundColor: colors.bg }}
      data={words}
      keyExtractor={item => item.term}
      ListHeaderComponent={
        <FilterChips active={filter} onSelect={setFilter} total={words.length} />
      }
      renderItem={({ item }) => <VocabularyItem word={item} />}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(vocabulary): add vocabulary list with filter chips"
```

---

### Task 8: Review Feature

**Files:**
- Create: `src/features/review/hooks/use-spaced-repetition.ts`
- Create: `src/features/review/hooks/use-review-session.ts`
- Create: `src/features/review/components/dashboard-stats.tsx`
- Create: `src/features/review/components/today-session-card.tsx`
- Create: `src/features/review/components/tricky-words-list.tsx`
- Create: `src/features/review/components/weekly-chart.tsx`
- Create: `src/features/review/components/review-card.tsx`
- Create: `src/features/review/components/session-progress.tsx`
- Create: `src/features/review/components/response-buttons.tsx`
- Modify: `app/(review)/index.tsx`
- Create: `app/(review)/session.tsx`

- [ ] **Step 1: Create spaced repetition logic**

`src/features/review/hooks/use-spaced-repetition.ts`:
```ts
import { updateReviewScore } from '@src/shared/db/words-repository';

// SM-2 simplified: score 0-3
// 0 = Again (reset interval)
// 1 = Hard (short interval)
// 2 = Good (normal interval)
// 3 = Easy (long interval)

const INTERVALS_HOURS = [1, 8, 24, 72]; // Again, Hard, Good, Easy

export function calculateNextReview(
  currentScore: number,
  response: 0 | 1 | 2 | 3,
): { newScore: number; nextReview: string } {
  let newScore: number;

  if (response === 0) {
    newScore = Math.max(0, currentScore - 2);
  } else if (response === 1) {
    newScore = Math.max(0, currentScore - 1);
  } else if (response === 2) {
    newScore = Math.min(5, currentScore + 1);
  } else {
    newScore = Math.min(5, currentScore + 2);
  }

  // Interval grows with score
  const baseHours = INTERVALS_HOURS[response];
  const multiplier = Math.pow(2, Math.max(0, newScore - 1));
  const hours = baseHours * multiplier;

  const nextReview = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  return { newScore, nextReview };
}

export async function submitReview(
  term: string,
  currentScore: number,
  response: 0 | 1 | 2 | 3,
): Promise<void> {
  const { newScore, nextReview } = calculateNextReview(currentScore, response);
  await updateReviewScore(term, newScore, nextReview);
}
```

- [ ] **Step 2: Create review session hook**

`src/features/review/hooks/use-review-session.ts`:
```ts
import { useState, useCallback } from 'react';
import { getWordsForReview } from '@src/shared/db/words-repository';
import { submitReview } from './use-spaced-repetition';
import type { Word } from '@src/features/dictionary/types';

interface SessionState {
  words: Word[];
  currentIndex: number;
  isRevealed: boolean;
  isComplete: boolean;
  responses: (0 | 1 | 2 | 3)[];
}

export function useReviewSession() {
  const [session, setSession] = useState<SessionState>({
    words: [],
    currentIndex: 0,
    isRevealed: false,
    isComplete: false,
    responses: [],
  });

  const startSession = useCallback(async () => {
    const words = await getWordsForReview(12);
    setSession({
      words,
      currentIndex: 0,
      isRevealed: false,
      isComplete: false,
      responses: [],
    });
  }, []);

  const reveal = useCallback(() => {
    setSession(prev => ({ ...prev, isRevealed: true }));
  }, []);

  const respond = useCallback(async (response: 0 | 1 | 2 | 3) => {
    const word = session.words[session.currentIndex];
    if (!word) return;

    await submitReview(word.term, word.reviewScore, response);

    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.words.length;

    setSession(prev => ({
      ...prev,
      currentIndex: nextIndex,
      isRevealed: false,
      isComplete,
      responses: [...prev.responses, response],
    }));
  }, [session.words, session.currentIndex]);

  const currentWord = session.words[session.currentIndex] ?? null;

  return {
    ...session,
    currentWord,
    startSession,
    reveal,
    respond,
    total: session.words.length,
  };
}
```

- [ ] **Step 3: Create review UI components**

Build all review components: `dashboard-stats.tsx`, `today-session-card.tsx`, `tricky-words-list.tsx`, `weekly-chart.tsx`, `review-card.tsx`, `session-progress.tsx`, `response-buttons.tsx`.

Each follows the mockup layout from `wortschatz-plex-outfit.html`. Key patterns:
- Use `colors` and `fonts` from theme
- Use `Animated.View` with `FadeInUp` for staggered entry
- Use `hapticMedium` on response button presses
- `borderCurve: 'continuous'` on all rounded elements

- [ ] **Step 4: Wire up review dashboard**

`app/(review)/index.tsx` — ScrollView with DashboardStats, TodaySessionCard, TrickyWordsList, WeeklyChart.

- [ ] **Step 5: Wire up review session**

`app/(review)/session.tsx` — Full session screen with SessionProgress, ReviewCard (question/revealed), ResponseButtons. Uses `useReviewSession` hook.

- [ ] **Step 6: Test full review flow**

Verify: Dashboard → Start Session → See word → Tap to reveal → Respond → Next word → Complete.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(review): add review dashboard + spaced repetition session"
```

---

### Task 9: Final Polish + Integration Test

**Files:**
- Various touch-ups across all features

- [ ] **Step 1: Add .gitignore entry for superpowers**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 2: Verify full flow end-to-end**

1. Open app → Search tab shows
2. Type "Tisch" → Word card loads with Wiktionary data → AI enriches
3. Navigate back → "Tisch" appears in recent searches
4. Switch to Parole tab → "Tisch" in vocabulary list with ochre bar
5. Switch to Ripasso → Dashboard shows 1 word to review
6. Start session → See "Tisch" → Reveal → Respond "Good" → Session complete

- [ ] **Step 3: Commit + tag**

```bash
git add -A
git commit -m "chore: polish and integration verification"
git tag v0.1.0
```
