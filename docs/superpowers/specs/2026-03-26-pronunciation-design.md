# Pronunciation & Settings Feature — Design Spec

**Goal:** Add text-to-speech pronunciation to WortSchatz using native iOS voices, plus a dedicated settings tab for user configuration.

**Approach:** `expo-speech` wrapping iOS AVSpeechSynthesizer. Zero cost, offline-capable, good German voice quality on iOS.

---

## 1. Settings Infrastructure

### Database

New `settings` table in the existing SQLite database. Added to the existing `getDatabase()` function in `database.ts` as an additional `CREATE TABLE IF NOT EXISTS` statement — same pattern as the `words` table. Since the statement uses `IF NOT EXISTS`, it is safe to run on existing installations: the table is created on first launch after the update, and subsequent launches are no-ops.

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Values stored as JSON strings.

### AppSettings Type

`src/features/settings/types.ts` — sole source of truth for the type and defaults. All other files import from here.

```typescript
interface AppSettings {
  autoPlayOnReveal: boolean;  // default: false
  speechRate: number;         // default: 0.9, range: 0.5–2.0, step: 0.1
}

const DEFAULT_SETTINGS: AppSettings = {
  autoPlayOnReveal: false,
  speechRate: 0.9,
};
```

### Settings Repository

`src/features/settings/services/settings-repository.ts`

Imports `AppSettings` and `DEFAULT_SETTINGS` from `types.ts`.

- `getSetting(key: string): Promise<string | null>`
- `setSetting(key: string, value: string): Promise<void>`
- `getAppSettings(): Promise<AppSettings>` — reads all keys, merges with defaults
- `updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void>`
- `getSpeechRate(): Promise<number>` — convenience method for the speech hook (avoids importing full settings)

### Settings Hook

`src/features/settings/hooks/use-settings.ts`

- Loads settings on mount
- Exposes `settings: AppSettings` and `updateSetting(key, value)`
- No reactive binding — reads on mount, updates write-through

---

## 2. Settings Tab & Page

### Navigation

Fourth tab in `app-tabs.tsx`. Add a new `NativeTabs.Trigger` block:

```tsx
<NativeTabs.Trigger name="(settings)">
  <NativeTabs.Trigger.Icon
    sf={{ default: "gearshape", selected: "gearshape.fill" }}
  />
  <NativeTabs.Trigger.Label>Impostazioni</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

This requires the corresponding route group `src/app/(settings)/` with `_layout.tsx` and `index.tsx`.

### Route Structure

- `src/app/(settings)/_layout.tsx` — Stack with `headerTransparent: true`, `headerBackButtonDisplayMode: "minimal"`
- `src/app/(settings)/index.tsx` — Settings screen

### UI Structure

iOS-style grouped sections using the app's design system (colors.bg background, white card groups, Outfit headings, IBM Plex Sans body, Ubuntu Sans Mono for values).

**Voice Preview Card** (top):
- Speaker icon in ochre accent circle
- "Voce tedesca" title + "Tocca per ascoltare un esempio" subtitle
- "Prova" button — speaks "Willkommen bei WortSchatz" at current speechRate

**Sezione: Pronuncia**
- "Auto-play al reveal" — toggle switch (maps to `autoPlayOnReveal`)
- "Velocità voce" — slider 0.5x–2.0x, step 0.1 (16 positions), value badge showing current value (maps to `speechRate`)
- Footer text: "La pronuncia usa la voce nativa del tuo dispositivo. Velocità più bassa aiuta a distinguere i suoni."

**Sezione: Info**
- "Versione" — static label showing app version

### Settings Components

- `settings-section.tsx` — section wrapper with header label
- `settings-toggle-row.tsx` — label + toggle switch
- `settings-slider-row.tsx` — label + value badge + slider with bounds (step configurable via prop)
- `settings-value-row.tsx` — label + static value
- `voice-preview-card.tsx` — preview card with speaker icon and "Prova" button

---

## 3. Speech Hook

`src/features/shared/hooks/use-speech.ts`

### Architecture Note

This hook depends on `getSpeechRate()` from `settings-repository.ts`. To avoid a `shared` → `settings` feature import (violating feature-based architecture boundaries), the hook accepts an optional `speechRate` parameter. Consumers pass it when available (e.g., settings page preview). For all other consumers, the hook reads the rate directly from the settings repository via the standalone `getSpeechRate()` function — this is acceptable because `settings-repository` is a pure data-access layer with no UI or business logic coupling.

### API

```typescript
interface UseSpeechReturn {
  speak: (text: string) => void;
  speakAll: (forms: string[], delayMs?: number) => void;
  stop: () => void;
  isSpeaking: boolean;
  isAvailable: boolean;
  currentSpeakingIndex: number | null;  // Index in speakAll sequence, null when not in sequence
}
```

### Behavior

- Language: `de-DE` (hardcoded — this is a German learning app)
- Rate: reads `speechRate` from settings repository on each `speak()` call (or uses override param)
- `speak(text)` — stops any current speech, then speaks the text
- `speakAll(forms, delayMs = 600)` — speaks forms sequentially. Implementation: call `Speech.speak()` for forms[0], wait for `onDone` callback, then `setTimeout(delayMs)`, then speak forms[1], etc. Updates `currentSpeakingIndex` to track which form is playing. Stops if `stop()` is called or component unmounts. On completion, resets `currentSpeakingIndex` to `null`.
- `stop()` — calls `Speech.stop()`, resets `currentSpeakingIndex` to `null`
- `isSpeaking` — tracked via `Speech.speak()` callbacks: `onStart` sets `true`, `onDone`/`onStopped`/`onError` set `false`. No polling.
- `isAvailable` — checked at hook initialization via `Speech.getAvailableVoicesAsync()`, looking for any voice with `language` starting with `de`. Cached in a module-level `Promise<boolean>` (not just a boolean) so that concurrent hook mounts share the same async check without duplicating calls. Resolved once per app session.

### Error Handling

- If no `de-*` voice found → set `isAvailable = false`
- All speaker buttons render in muted state (grayed out)
- Tap on muted speaker → haptic medium feedback
- No alerts, no toasts — silent degradation with haptic cue

### Cleanup

- On unmount → `Speech.stop()` to prevent orphaned speech, clear any pending `setTimeout` refs

---

## 4. Speaker Button Component

`src/features/shared/components/speaker-button.tsx`

### Props

```typescript
interface SpeakerButtonProps {
  text?: string;                   // What to pronounce (optional when onSpeakAll is provided)
  size?: "sm" | "md";             // sm=16pt (grid rows), md=22pt (word card, headers)
  onSpeakAll?: () => void;        // Alternative: trigger speakAll for tense headers
  isHighlighted?: boolean;        // True when this row is currently being spoken in a sequence
}
```

Either `text` or `onSpeakAll` must be provided. When `onSpeakAll` is set, `text` is ignored.

### Visual States

- **Idle:** SF Symbol `speaker.wave.2`, color `textTertiary`
- **Speaking:** SF Symbol `speaker.wave.2`, color `accent`, pulse animation via `react-native-reanimated` — looping scale 1.0 → 1.15 → 1.0 with 800ms duration using `withRepeat(withSequence(withTiming(...)))`
- **Highlighted** (during speakAll sequence): background tint `accent` at 10% opacity on the row
- **Unavailable:** SF Symbol `speaker.slash`, color `textMuted`

### Interaction

- Tap → `speak(text)` + haptic light (or `onSpeakAll()` if provided)
- Tap while speaking → `stop()`
- Tap while unavailable → haptic medium (no speech)

---

## 5. Integration Points

### Word Card (`word-card.tsx`)

- SpeakerButton `md` placed to the right of the main term
- Text: `word.term`

### Pronoun Grid (`pronoun-grid.tsx`)

- SpeakerButton `sm` at the end of each row
- Text: `"{pronoun} {form}"` (e.g., "ich gehe")
- New optional prop `highlightedIndex?: number | null` — when set, the row at that index gets highlighted styling (accent background at 10% opacity on the row container View)
- Pronoun order for index mapping: [ich=0, du=1, er=2, wir=3, ihr=4, sie=5]. Since PronounGrid renders two columns (left: ich/du/er = indices 0–2, right: wir/ihr/sie = indices 3–5), the component maps the flat index to the correct column entry internally

### Conjugation Screen — Tense Header (`conjugation-screen.tsx`)

- SpeakerButton `md` next to the tense name (e.g., "Präsens")
- Uses `onSpeakAll` callback. The `TenseTable` component assembles the forms list from its `ConjugationTense` data in pronoun order: `["ich {ich}", "du {du}", "er {er}", "wir {wir}", "ihr {ihr}", "sie {sie}"]`
- `TenseTable` gets `useSpeech()` and passes `currentSpeakingIndex` down to `PronounGrid` as `highlightedIndex`
- Tap again during sequence → `stop()` which resets `currentSpeakingIndex` to null
- `PerfektTable` also gets a speaker button in its header. It assembles forms as `["ich habe/bin {partizipII}", ...]` using the hilfsverb + partizipII. Same `useSpeech()` + `highlightedIndex` pattern as `TenseTable`

### Review Card (`review-card.tsx`)

- SpeakerButton `md` next to the term (visible in both hidden and revealed states)
- Text: `word.term`
- If `autoPlayOnReveal` setting is `true`: automatically calls `speak(word.term)` when the card transitions from hidden to revealed (triggered by `useEffect` watching `isRevealed`)
- Auto-play reads setting from repository on mount, no reactive binding needed
- Manual replay always available via speaker button

### Vocabulary Item — Context Menu (`vocabulary-item.tsx`)

- New action "Pronuncia" in the long-press menu
- Position: before "Condividi"
- Icon: `speaker.wave.2` SF Symbol
- Action: reads `speechRate` from settings repository, then calls `Speech.speak(word.term, { language: "de-DE", rate })` — direct call is acceptable here since the context menu is fire-and-forget and using the full hook would require refactoring the component's architecture for a single action

---

## 6. File Structure

### New Files

```
src/features/shared/
  hooks/use-speech.ts
  components/speaker-button.tsx

src/features/settings/
  types.ts
  services/settings-repository.ts
  hooks/use-settings.ts
  components/
    settings-section.tsx
    settings-toggle-row.tsx
    settings-slider-row.tsx
    settings-value-row.tsx
    voice-preview-card.tsx

src/app/(settings)/
  _layout.tsx
  index.tsx
```

### Modified Files

```
src/features/shared/db/database.ts          — add settings table creation
src/components/app-tabs.tsx                  — add fourth NativeTabs.Trigger for (settings)
src/features/dictionary/components/word-card.tsx       — add SpeakerButton
src/features/dictionary/components/pronoun-grid.tsx    — add SpeakerButton per row + highlightedIndex prop
src/features/dictionary/components/conjugation-screen.tsx — add SpeakerButton in tense headers, useSpeech in TenseTable
src/features/review/components/review-card.tsx         — add SpeakerButton + auto-play logic
src/features/vocabulary/components/vocabulary-item.tsx  — add "Pronuncia" to context menu
```

### New Dependency

```
expo-speech
```

---

## 7. Edge Cases

| Scenario | Behavior |
|---|---|
| No German voice on device | Detected via `getAvailableVoicesAsync()` at init. `isAvailable` = false, all buttons muted, haptic medium on tap |
| Tap speaker while already speaking | Stop current, start new |
| Tap different speaker during speakAll | Stop sequence, start single new utterance |
| Navigate away during speakAll sequence | `stop()` on unmount, clear setTimeout refs |
| App goes to background during speech | iOS handles stop natively |
| Change speechRate in settings | Next `speak()` reads new rate from repository |
| "Prova" button in settings | Speaks "Willkommen bei WortSchatz" at current slider rate |
| autoPlayOnReveal enabled in public | User's choice — toggle exists to disable |
| speakAll with empty forms array | No-op, returns immediately |
