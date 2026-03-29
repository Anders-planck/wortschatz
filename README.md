# WortSchatz

A German vocabulary learning app for Italian speakers. AI-powered word enrichment, FSRS spaced repetition, conversational practice, graded reading, and listening comprehension — all offline-first on iOS.

Built with Expo SDK 55, React Native, and Gemini AI.

## Features

### Dictionary
- **Smart Search** — type in German or Italian, AI detects the language and returns full context
- **Adaptive Word Cards** — nouns show gender/plural/declension, verbs show conjugation tables, prepositions show governed cases
- **Clickable Examples** — tap any word in an example sentence to look it up
- **Synonyms & Antonyms** — AI-generated with intensity dots and comparative forms for adjectives
- **Word Families** — etymological tree from any word (e.g. fahren → Fahrer, Fahrrad, Erfahrung)
- **Text-to-Speech** — Google Cloud TTS with 5 German WaveNet voices, fallback to native iOS speech

### Collections
- **Thematic Lists** — manila folder design, organize vocabulary by topic
- **AI Organization** — one tap to auto-sort unorganized words into thematic groups
- **Batch Operations** — select multiple collections for deletion with full cascade

### Review
- **FSRS Algorithm** — Free Spaced Repetition Scheduler (same as Anki), 20-30% more efficient than SM-2
- **Flashcard Sessions** — 4 response buttons (Again/Hard/Good/Easy), haptic feedback
- **Review Forecast** — 7-day preview of upcoming reviews on the dashboard
- **Statistics** — SVG charts: score trend, daily activity, mastery donut, per-type breakdown
- **Streak Tracking** — consecutive study days with weekly activity chart

### Exercises
- **Fill-in-the-blank** — AI-generated sentences with vocabulary words
- **Dictation** — listen and type German sentences
- **Article & Case Quiz** — multiple choice for correct article/case
- **Mix Mode** — interleaved exercise types for variety

### Conversation
- **AI Chat Partner** — streaming conversation with Gemini, inline grammar corrections
- **Custom Scenarios** — create categories with icon, level (A1-C2), description
- **Conversation History** — resume past conversations, swipe-to-delete
- **Word Discovery** — new words highlighted and extractable from conversations

### Immersion
- **Graded Reading** — AI-generated texts (A1-C2) from your vocabulary, tap-to-translate
- **Listening Comprehension** — TTS dialogue + multiple choice questions with transcript reveal

### Smart Notifications
- **Duolingo-style** — 18 German messages across 3 escalation levels
- **Streak-aware** — escalates based on days without study
- **Smart skip** — no notification if you already studied today

### AI Usage Tracking
- **Token & Cost Dashboard** — track Gemini API usage per feature
- **Monthly Budget** — configurable with progress bar and over-budget warning
- **Trend Charts** — daily cost over 7/30 days or all-time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55, React Native 0.83 |
| Navigation | expo-router with NativeTabs + Stack.Toolbar |
| Database | expo-sqlite (local, offline-first) |
| AI | Vercel AI SDK v6 + Google Gemini 2.5 Flash Lite |
| Spaced Repetition | ts-fsrs (FSRS algorithm) |
| Dictionary | Wiktionary REST API |
| TTS | Google Cloud TTS + expo-speech fallback |
| Charts | react-native-svg |
| Animations | react-native-reanimated |
| Streaming | expo/fetch + TextEncoderStream polyfills |
| Validation | Zod |

## Architecture

Feature-based architecture. Each feature is self-contained with components, hooks, services, and types.

```
src/
  app/                              # Expo Router routes
    (search)/                       # Search tab — word lookup
    (vocabulary)/                   # Liste tab — collections
    (review)/                       # Ripasso tab — review, exercises, chat, reading, listening
    (settings)/                     # Settings tab — preferences, AI usage
  features/
    dictionary/                     # Word cards, conjugation, declension, AI enrichment
    search/                         # Search screen, recent searches
    vocabulary/                     # Vocabulary export
    collections/                    # Collection cards, grid, icon picker
    review/                         # Spaced repetition, dashboard, stats, forecast
    exercises/                      # Exercise generation, session, feedback
    chat/                           # AI conversation, scenarios, streaming
    immersion/                      # Word families, synonyms, reading, listening
    settings/                       # Settings UI, AI usage tracking
    shared/                         # Theme, database, TTS, AI tracker, components
```

## Design System

Warm editorial aesthetic with dark mode support.

| Element | Value |
|---------|-------|
| Display | Outfit |
| Body | IBM Plex Sans |
| Mono | Ubuntu Sans Mono |
| Accent | Ochre `#C4943A` / `#D4A44A` |
| Gender | der = gold, die = rose, das = sage |
| Corners | `borderCurve: "continuous"` (iOS squircles) |
| Icons | SF Symbols via expo-symbols |

## Getting Started

```bash
# Install dependencies
bun install

# Create environment file
cp .env.dist .env.local
# Add your Google Gemini API key to .env.local

# Start dev server
npx expo start

# iOS dev build (required for TTS, notifications, SVG charts)
npx expo run:ios
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_GOOGLE_AI_KEY` | Yes | Google Gemini API key |

## License

MIT
