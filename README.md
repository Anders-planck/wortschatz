# WortSchatz

A smart German-Italian dictionary app for language learners. Built with Expo SDK 55 and React Native.

WortSchatz combines Wiktionary structured data with Gemini AI contextual enrichment to provide rich word cards with gender, plural forms, conjugation tables, example sentences, and usage context. Every searched word is automatically saved to your personal vocabulary for spaced repetition review.

## Features

- **Smart Search** — Search in German or Italian. The AI detects the language and returns the German equivalent with full context.
- **Adaptive Word Cards** — Cards adapt to word type: nouns show gender/plural/declension, verbs show conjugation with stem highlighting, prepositions show governed cases.
- **Full Conjugation Tables** — Prasens, Prateritum, Perfekt (with hilfsverb highlighting), and Konjunktiv II for every verb.
- **Text-to-Speech** — Native iOS pronunciation for every word and conjugated form. Sequential playback for entire tense tables with row highlighting.
- **Personal Vocabulary** — Every search is auto-saved. Filter by word type, long-press for context menu (pronounce, share, delete).
- **Spaced Repetition** — SM-2 algorithm for review sessions. Dashboard with streak tracking, weekly activity chart, and tricky words list.
- **Settings** — Configurable speech rate, auto-play on card reveal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55, React Native 0.83 |
| Navigation | expo-router with NativeTabs (native iOS tab bar) |
| Database | expo-sqlite (local, on-device) |
| AI | Vercel AI SDK v6 + Google Gemini 2.5 Flash Lite |
| Dictionary | Wiktionary REST API (en.wiktionary.org) |
| TTS | expo-speech (native AVSpeechSynthesizer) |
| Animations | react-native-reanimated |
| Validation | Zod |

## Architecture

Feature-based architecture under `src/features/`. Each feature is self-contained with its own components, hooks, services, and types.

```
src/
  app/                          # Expo Router routes
    (search)/                   # Search tab
    (vocabulary)/               # Vocabulary tab
    (review)/                   # Review tab
    (settings)/                 # Settings tab
  components/                   # App-level components (tabs)
  features/
    dictionary/                 # Word lookup, cards, conjugation
      components/
      hooks/
      services/
      schemas/
      types.ts
    search/                     # Search screen, recent searches
      components/
      hooks/
    vocabulary/                 # Vocabulary list, filters
      components/
      hooks/
    review/                     # Spaced repetition, dashboard
      components/
      hooks/
    settings/                   # App settings, persistence
      components/
      hooks/
      services/
      types.ts
    shared/                     # Theme, database, utilities
      theme/
      db/
      hooks/
      components/
      utils/
      config/
```

## Data Flow

1. **Search** — User types a word (German or Italian)
2. **Cache check** — Look up in local SQLite database
3. **Wiktionary** — Fetch structured data from `en.wiktionary.org/api/rest_v1/page/definition/` (multi-case: as-is, capitalized, lowercase)
4. **AI enrichment** — Gemini generates contextual data: translations, examples with clickable words, usage context, conjugation for verbs
5. **AI-only fallback** — If Wiktionary has no German data, Gemini generates everything including gender, plural
6. **Save** — Word is persisted to SQLite with all enriched data
7. **Review** — SM-2 algorithm schedules words for spaced repetition

## Getting Started

### Prerequisites

- Node.js 18+
- iOS Simulator or physical iPhone
- Xcode (for native builds)

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.dist .env.local
# Edit .env.local and add your Gemini API key

# Start development
npx expo start
```

### Environment Variables

| Variable | Description |
|----------|------------|
| `EXPO_PUBLIC_GOOGLE_AI_KEY` | Google Gemini API key for AI enrichment |

### Running on Device

```bash
# iOS Simulator
npx expo run:ios

# Physical iPhone (connected via USB)
npx expo run:ios --device
```

## Design System

Warm, editorial aesthetic inspired by Bauhaus minimalism.

- **Fonts**: Outfit (display), IBM Plex Sans (body), Ubuntu Sans Mono (labels)
- **Palette**: Cream background (`#F0EDE6`), warm ochre accent (`#C4943A`), muted earth tones
- **Gender colors**: der = gold (`#C4A96A`), die = rose (`#D4AAA0`), das = sage (`#8DB58A`)
- **Corners**: `borderCurve: "continuous"` everywhere (iOS squircles)

## License

Private project.
