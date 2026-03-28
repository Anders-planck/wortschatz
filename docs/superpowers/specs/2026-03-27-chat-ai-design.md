# WortSchatz — Fase 3: Chat AI

## Overview

Add a conversational practice partner powered by Gemini. Users pick a scenario (supermarket, job interview, apartment search, etc.) or free conversation. The AI responds in German, corrects errors inline with grammar explanations in Italian, and lets users tap unknown words to save them.

## Problem

The app tests passive recognition but never forces the user to *compose* German sentences in context. There's no conversation practice, no error correction, no real-world simulation.

## Solution

A chat interface with:
- **Scenario selection** — predefined contexts with difficulty level (A2/B1)
- **Conversational AI** — Gemini responds naturally in German, staying in character
- **Inline corrections** — errors shown as red strikethrough → green correction + grammar tip in Italian
- **Tap-to-save words** — any word in AI messages is tappable, showing translation + "Salva" button
- **Quick reply chips** — suggested phrases to help beginners
- **Session summary** — corrections, new words discovered, stats

## Chat Behavior

### System prompt structure

```
You are a German conversation partner in the scenario: "{scenario}".
Stay in character. Respond naturally in German at {level} level.
After each user message:
1. Continue the conversation naturally
2. If there are grammar errors, show corrections in this format:
   [CORRECTION]
   wrong: "original text"
   right: "corrected text"
   tip: "explanation in Italian"
   [/CORRECTION]
3. Mark new/advanced words with [WORD]term[/WORD]
4. Suggest 2-3 follow-up phrases the user could say
```

### Scenarios

Predefined scenarios stored as constants (not in DB):

| Scenario | SF Symbol | Level | Description |
|----------|-----------|-------|-------------|
| Conversazione libera | `text.bubble` | Adaptive | Any topic |
| Al supermercato | `cart` | A2 | Shopping, prices, products |
| Colloquio di lavoro | `building.2` | B1 | Skills, experience, questions |
| Cercare un appartamento | `house` | A2-B1 | Rent, rooms, neighborhood |
| Dal dottore | `cross.case` | B1 | Symptoms, prescriptions |

### Response parsing

AI response is parsed to extract:
- Plain conversation text
- `[CORRECTION]` blocks → rendered as red/green diff
- `[WORD]` markers → rendered as tappable links
- Suggested replies → rendered as chips below input

## Screens & Navigation

### 1. Scenario picker

**Route**: `(review)/chat.tsx` (new)

- List of scenario cards with SF Symbol icon, title, description, level badge
- "Conversazione libera" featured at top
- Tap → starts chat session

### 2. Chat session

**Route**: `(review)/chat-session.tsx` (new, modal)

- Receives `scenario` param
- Header: scenario icon + name + ellipsis menu (end session)
- ScrollView of message bubbles
- AI messages: left-aligned, card background, with correction blocks and tappable words
- User messages: right-aligned, accent background
- Quick reply chips row above input
- Input bar: mic button (future), TextInput, send button
- Typing indicator (3 bouncing dots) while AI responds

### 3. Word popup

Inline within chat — not a separate route:
- Tap on `[WORD]` → shows popup below the word
- Shows: article + term, type, translation
- Buttons: "Salva" (adds to vocabulary via existing `insertWord`) + "Pronuncia" (TTS)

### 4. Chat summary

Shown when user ends session (via ellipsis menu → "Termina"):
- Stats: correct sentences, errors, new words, duration
- Corrections list (wrong → right)
- New words chips with "Salva tutto" button
- "Torna agli esercizi" action

## Data Model

### New SQLite table: `chat_sessions`

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]',
  corrections_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  new_words TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

- `messages` stores the full conversation as JSON (for history/review)
- `new_words` stores discovered words as JSON array of terms
- Session saved on "Termina" — not in real-time

## AI Integration

Uses `streamText` (not `generateText`) for streaming responses. The AI SDK's `streamText` returns chunks that are appended to the message bubble in real-time.

```typescript
const stream = streamText({
  model: google("gemini-2.5-flash-lite"),
  system: buildChatSystemPrompt(scenario, level),
  messages: conversationHistory,
});
```

## Feature Directory Structure

```
src/features/chat/
  components/
    scenario-card.tsx
    scenario-list.tsx
    chat-bubble.tsx
    correction-block.tsx
    word-popup.tsx
    quick-reply-chips.tsx
    chat-input-bar.tsx
    chat-summary.tsx
    typing-indicator.tsx
  hooks/
    use-chat-session.ts
  services/
    chat-service.ts        — streaming + message parsing
    chat-repository.ts     — session persistence
  types.ts
  constants.ts             — scenario definitions
```

## Acceptance Criteria

- [ ] Scenario picker with 5 predefined scenarios + free conversation
- [ ] Chat bubbles with AI (left) and user (right) styling
- [ ] Streaming AI responses with typing indicator
- [ ] Inline corrections: red strikethrough → green correction + Italian tip
- [ ] Tappable words in AI messages → popup with translation + save
- [ ] Quick reply chips suggesting follow-up phrases
- [ ] Chat input with send button
- [ ] Session summary with corrections, new words, stats
- [ ] "Salva tutto" saves discovered words to vocabulary
- [ ] Chat session persisted to SQLite on end
- [ ] All screens respect dark mode
- [ ] All icons are SF Symbols
