# WortSchatz — Fase 4: Immersione

## Overview

Add 4 features for deeper language comprehension: word families (etymological tree), synonyms/antonyms, graded reading texts with tap-to-translate, and listening comprehension exercises.

## Problem

The app teaches individual words in isolation. Users don't see how words connect to each other (families, synonyms), can't practice reading in context, and have no listening comprehension exercises beyond single-word TTS.

## Solution

### A. Word Families (Wortfamilie)

From a word detail screen, view all words derived from the same root. E.g., "fahren" → Fahrer, Fahrrad, Erfahrung, Abfahrt, erfahren.

**AI generates** the family tree from the root word. Each derived word shows: article (if noun with gender color), term, translation, word type. Tap to save to vocabulary.

**Route**: `(search)/word-family/[term].tsx` + `(vocabulary)/word-family/[term].tsx`

Accessible from word detail toolbar button `leaf` (or `tree`).

### B. Synonyms & Antonyms

Displayed inline in the word card (under translations). AI generates during word enrichment.

**Data**: Add `synonyms` and `antonyms` fields to the AI enrichment prompt output. Stored in the existing `word` record (new JSON fields or in `forms`).

**Display**:
- Synonyms with intensity dot (how similar: high/medium/low)
- Antonyms with red-tinted chips
- For adjectives: comparative/superlative forms (Positiv → Komparativ → Superlativ)

**No new route** — added to existing `WordCard` component.

### C. Graded Reading

AI-generated short texts (100-200 words) using words from the user's vocabulary. Tap any word for instant translation popup + save option.

**Route**: `(review)/readings.tsx` (list) + `(review)/reading/[id].tsx` (reader)

**Data model**: texts generated on-demand by AI, cached in SQLite:

```sql
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  known_words TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
```

**Reading view**: full text with tappable words. Known words (in vocabulary) highlighted. Tap unknown word → popup with translation + "Salva". Counter shows known/total words.

### D. Listening Comprehension

TTS plays a short dialogue or sentence. User answers a comprehension question (multiple choice). After answering, full transcript shown with tappable words.

**Route**: `(review)/listening.tsx` (new)

**Exercise generation**: AI creates dialogue + question + 3 options. TTS reads the dialogue. User picks answer. Transcript revealed after.

**No new table** — exercises are ephemeral like fill-in-blank.

## AI Integration

### Word family prompt

Input: a German word (term, type).

Output (Zod): array of related words with:
- `term`, `type`, `gender` (if noun), `translation`, `prefix` (if applicable)

### Synonyms/antonyms enrichment

Added to existing `generateWordContext` prompt as new output fields:
- `synonyms`: array of `{ term, translation, intensity: "high" | "medium" | "low" }`
- `antonyms`: array of `{ term, translation }`
- `comparative` (adjectives only): `{ komparativ, superlativ }`

### Reading generation prompt

Input: 10-15 words from user's vocabulary + target level (A2/B1).

Output (Zod):
- `title`: story title in German
- `level`: A2 or B1
- `content`: the story text (100-200 words)
- `wordTranslations`: map of `{ germanWord: italianTranslation }` for all words in the text

### Listening comprehension prompt

Input: 5-8 vocabulary words + target level.

Output (Zod): array of exercises, each with:
- `dialogue`: text to be spoken via TTS
- `question`: comprehension question in German
- `options`: 3 answer options
- `correctIndex`: 0-2
- `explanation`: why the answer is correct (Italian)

## Feature Directory Structure

```
src/features/immersion/
  components/
    word-family-tree.tsx
    family-branch-card.tsx
    synonym-section.tsx
    antonym-section.tsx
    comparative-bar.tsx
    reading-card.tsx
    reading-view.tsx
    word-popup.tsx          — shared with chat feature
    listening-exercise.tsx
    listening-transcript.tsx
  hooks/
    use-word-family.ts
    use-readings.ts
    use-listening.ts
  services/
    immersion-ai-service.ts
    readings-repository.ts
  types.ts
```

## Acceptance Criteria

### Word Families
- [ ] Toolbar button on word detail opens family tree screen
- [ ] AI generates related words from same root
- [ ] Each word shows article (gender color), term, translation, type
- [ ] Tap to save word to vocabulary

### Synonyms & Antonyms
- [ ] Shown inline in word card under translations
- [ ] Synonyms with intensity indicator (green dot: high/medium/low)
- [ ] Antonyms with red-tinted styling
- [ ] Adjective comparative/superlative bar (Positiv → Komparativ → Superlativ)

### Reading
- [ ] List of AI-generated stories with title, level, word count
- [ ] Reading view with full text, tappable words
- [ ] Known words highlighted differently from unknown
- [ ] Tap word → popup with translation + save + pronounce
- [ ] "Salva tutte le nuove" bulk action
- [ ] Stories cached in SQLite

### Listening
- [ ] TTS plays dialogue with speed controls (slow/normal)
- [ ] Multiple choice comprehension question
- [ ] Correct/wrong feedback with explanation
- [ ] Post-answer transcript with tappable words
- [ ] All icons are SF Symbols, all screens respect dark mode
