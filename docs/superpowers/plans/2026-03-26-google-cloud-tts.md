# Google Cloud TTS Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace expo-speech with Google Cloud TTS WaveNet for natural German pronunciation, keeping expo-speech as offline fallback.

**Architecture:** New TTS service fetches audio from Google Cloud TTS REST API, caches MP3 files to local filesystem, plays via expo-audio. The useSpeech hook API stays unchanged — all consumers are unaffected.

**Tech Stack:** expo-audio (playback), expo-file-system/next (cache), Google Cloud TTS REST API, expo-speech (fallback)

**Spec:** `docs/superpowers/specs/2026-03-26-google-cloud-tts-design.md`

**Native UI Skill:** `.agents/skills/building-native-ui/SKILL.md` — MUST follow for audio and file system APIs.

**CRITICAL:** Per building-native-ui skill:
- Use `expo-audio` NOT `expo-av` — use `useAudioPlayer` hook for playback
- Use `expo-file-system/next` (`File`, `Paths`) NOT legacy `FileSystem.writeAsStringAsync`
- Use `expo-audio` not `expo-av`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/features/shared/services/tts-service.ts` | Google Cloud TTS API call + filesystem cache management |

### Modified Files

| File | Change |
|------|--------|
| `src/features/shared/hooks/use-speech.ts` | Replace expo-speech primary with tts-service + expo-audio, keep expo-speech as fallback |
| `src/features/shared/db/words-repository.ts` | Add `updateAudioUrl()` and `getAudioUrl()` functions |
| `src/app/(settings)/index.tsx` | Use useSpeech hook for preview, update footer text |
| `src/features/vocabulary/components/vocabulary-item.tsx` | Use tts-service for Pronuncia context menu |

### New Dependencies

```
expo-audio
expo-file-system
```

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install expo-audio and expo-file-system**

```bash
npx expo install expo-audio expo-file-system
```

- [ ] **Step 2: Verify the app still compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(tts): install expo-audio and expo-file-system"
```

---

### Task 2: Add audio URL helpers to words repository

**Files:**
- Modify: `src/features/shared/db/words-repository.ts`

- [ ] **Step 1: Add updateAudioUrl and getAudioUrl functions**

Add these two functions to the end of `src/features/shared/db/words-repository.ts`:

```typescript
export async function updateAudioUrl(
  term: string,
  audioUrl: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE words SET audio_url = ? WHERE term = ? COLLATE NOCASE", [
    audioUrl,
    term,
  ]);
}

export async function getAudioUrl(term: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ audio_url: string | null }>(
    "SELECT audio_url FROM words WHERE term = ? COLLATE NOCASE",
    [term],
  );
  return row?.audio_url ?? null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/shared/db/words-repository.ts
git commit -m "feat(tts): add updateAudioUrl and getAudioUrl to words repository"
```

---

### Task 3: Create TTS service

**Files:**
- Create: `src/features/shared/services/tts-service.ts`

- [ ] **Step 1: Create the TTS service**

Create `src/features/shared/services/tts-service.ts`:

```typescript
import { File, Paths } from "expo-file-system/next";
import {
  getAudioUrl,
  updateAudioUrl,
} from "@/features/shared/db/words-repository";

const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const TTS_VOICE = "de-DE-WaveNet-D";
const TTS_LANGUAGE = "de-DE";

const API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_AI_KEY ??
  "";

function getTtsCacheDir(): string {
  return `${Paths.cache}/tts`;
}

function getAudioFilePath(term: string): string {
  return `${getTtsCacheDir()}/${encodeURIComponent(term)}.mp3`;
}

function ensureCacheDir(): void {
  const dir = new File(getTtsCacheDir());
  if (!dir.exists) {
    dir.create();
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const file = new File(path);
    return file.exists;
  } catch {
    return false;
  }
}

async function fetchAndCacheAudio(
  text: string,
  filePath: string,
  speakingRate: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${TTS_API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: TTS_LANGUAGE, name: TTS_VOICE },
        audioConfig: { audioEncoding: "MP3", speakingRate },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.audioContent) return null;

    ensureCacheDir();

    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const file = new File(filePath);
    file.create({ overwrite: true });
    file.write(bytes);

    updateAudioUrl(text, filePath).catch(() => {});

    return filePath;
  } catch {
    return null;
  }
}

export async function getAudio(
  text: string,
  speakingRate = 1.0,
): Promise<string | null> {
  if (!API_KEY) return null;

  try {
    const dbPath = await getAudioUrl(text);
    if (dbPath && (await fileExists(dbPath))) {
      return dbPath;
    }

    const filePath = getAudioFilePath(text);
    if (await fileExists(filePath)) {
      return filePath;
    }

    return fetchAndCacheAudio(text, filePath, speakingRate);
  } catch {
    return null;
  }
}
```

**Key decisions:**
- Uses `expo-file-system/next` API (`File`, `Paths`) per building-native-ui skill — NOT legacy `FileSystem.writeAsStringAsync`
- Base64 → bytes conversion follows the pattern from building-native-ui's `base64ToLocalUri` example
- Cache lookup: DB path → verify file exists → filename-based check → API call → return null
- `updateAudioUrl` is fire-and-forget (`.catch(() => {})`) — cache write failure shouldn't block playback
- Never throws — all errors return `null`

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

If `File` / `Paths` types from `expo-file-system/next` don't resolve, check:
- Is `expo-file-system` installed? (`npx expo install expo-file-system`)
- The import path should be `expo-file-system/next` exactly

- [ ] **Step 3: Commit**

```bash
git add src/features/shared/services/tts-service.ts
git commit -m "feat(tts): add Google Cloud TTS service with filesystem caching"
```

---

### Task 4: Refactor use-speech.ts to use TTS service + expo-audio

**Files:**
- Modify: `src/features/shared/hooks/use-speech.ts`

This is the core refactor. The public API stays the same. Read `.agents/skills/building-native-ui/references/media.md` for the correct `expo-audio` API.

- [ ] **Step 1: Rewrite use-speech.ts**

Replace the entire file `src/features/shared/hooks/use-speech.ts` with:

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { getAudio } from "@/features/shared/services/tts-service";
import { hapticLight } from "./use-haptics";

interface UseSpeechOptions {
  speechRate?: number;
}

export function useSpeech(options?: UseSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  const sequenceRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usingFallbackRef = useRef(false);

  const player = useAudioPlayer(null);

  useEffect(() => {
    return () => {
      player.pause();
      Speech.stop();
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [player]);

  const getRate = useCallback(async () => {
    if (options?.speechRate !== undefined) return options.speechRate;
    return getSpeechRate();
  }, [options?.speechRate]);

  const playAudio = useCallback(
    async (text: string): Promise<void> => {
      const rate = await getRate();
      const path = await getAudio(text, rate);

      if (path) {
        usingFallbackRef.current = false;
        player.replace({ uri: path });
        setIsSpeaking(true);

        return new Promise<void>((resolve) => {
          const subscription = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
              setIsSpeaking(false);
              subscription.remove();
              resolve();
            }
          });
          player.play();
        });
      }

      usingFallbackRef.current = true;
      return new Promise<void>((resolve) => {
        Speech.speak(text, {
          language: "de-DE",
          rate,
          onStart: () => setIsSpeaking(true),
          onDone: () => {
            setIsSpeaking(false);
            resolve();
          },
          onStopped: () => {
            setIsSpeaking(false);
            resolve();
          },
          onError: () => {
            setIsSpeaking(false);
            resolve();
          },
        });
      });
    },
    [player, getRate],
  );

  const speak = useCallback(
    async (text: string) => {
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrentSpeakingIndex(null);

      player.pause();
      Speech.stop();

      hapticLight();
      await playAudio(text);
    },
    [player, playAudio],
  );

  const speakAll = useCallback(
    async (forms: string[], delayMs = 600) => {
      if (forms.length === 0) return;

      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      player.pause();
      Speech.stop();

      const sequence = { cancelled: false };
      sequenceRef.current = sequence;

      hapticLight();

      for (let i = 0; i < forms.length; i++) {
        if (sequence.cancelled) break;

        setCurrentSpeakingIndex(i);
        await playAudio(forms[i]);

        if (sequence.cancelled || i === forms.length - 1) break;

        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, delayMs);
        });
      }

      if (!sequence.cancelled) {
        setCurrentSpeakingIndex(null);
      }
    },
    [player, playAudio],
  );

  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    player.pause();
    Speech.stop();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, [player]);

  return {
    speak,
    speakAll,
    stop,
    isSpeaking,
    isAvailable: true,
    currentSpeakingIndex,
  };
}
```

**Key changes from the previous version:**
- Removed `checkGermanVoice()` module-level check — `isAvailable` is always `true`
- Removed `hapticMedium` import — no unavailable state to signal
- Added `useAudioPlayer(null)` from `expo-audio` — initialized with null source
- `playAudio()` is the new internal function that tries Google Cloud TTS first, then falls back to expo-speech
- Uses `player.replace({ uri: path })` to change the audio source dynamically
- Uses `player.addListener("playbackStatusUpdate", ...)` to detect `didJustFinish` for completion
- Uses `player.pause()` instead of `player.stop()` (expo-audio convention)
- `stop()` calls both `player.pause()` and `Speech.stop()` to handle whichever is active

**API verified from expo-audio SDK 55 TypeScript types:**
- `useAudioPlayer(source)` accepts `null` as initial source ✓
- `player.replace(source)` exists on `AudioPlayer` ✓
- `player.addListener("playbackStatusUpdate", callback)` exists via `SharedObject<AudioEvents>` ✓
- `AudioStatus.didJustFinish: boolean` exists ✓
- `player.playing: boolean` exists ✓
- `player.pause()` / `player.play()` / `player.remove()` exist ✓

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test manually**

Launch the app, search for a word (e.g., "Tisch"), tap the speaker icon. Verify:
- First tap: slight delay (API call + caching), then natural WaveNet voice
- Second tap: instant playback (cached)
- With airplane mode + no cache: fallback to native iOS voice

- [ ] **Step 4: Commit**

```bash
git add src/features/shared/hooks/use-speech.ts
git commit -m "feat(tts): refactor useSpeech to use Google Cloud TTS with expo-speech fallback"
```

---

### Task 5: Update settings page preview

**Files:**
- Modify: `src/app/(settings)/index.tsx`

- [ ] **Step 1: Replace Speech.speak with useSpeech hook**

The current `handlePreview` calls `Speech.speak()` directly. Change it to use the hook.

Replace the imports and handler. Remove the `Speech` import, add `useSpeech`:

```typescript
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";

import { colors } from "@/features/shared/theme/colors";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useSpeech } from "@/features/shared/hooks/use-speech";
import {
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_STEP,
} from "@/features/settings/types";
// ... rest of component imports stay the same
```

Inside the component, add the hook and update the handler:

```typescript
export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { speak } = useSpeech({ speechRate: settings.speechRate });

  const handlePreview = () => {
    speak("Willkommen bei WortSchatz");
  };

  // ... rest stays the same
```

Also update the footer text of the Pronuncia section from:
```
"La pronuncia usa la voce nativa del tuo dispositivo. Velocità più bassa aiuta a distinguere i suoni."
```
To:
```
"La pronuncia usa Google Cloud per una voce naturale. Senza internet, usa la voce del dispositivo."
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(settings\)/index.tsx
git commit -m "feat(tts): use WaveNet voice for settings preview"
```

---

### Task 6: Update vocabulary item context menu

**Files:**
- Modify: `src/features/vocabulary/components/vocabulary-item.tsx`

- [ ] **Step 1: Replace Speech.speak with tts-service**

The "Pronuncia" `Link.MenuAction` currently calls `Speech.speak()` directly. Update it to use the TTS service with expo-speech fallback.

Replace the `expo-speech` import with `tts-service` and `expo-audio`:

```typescript
import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { getAudio } from "@/features/shared/services/tts-service";
```

Update the "Pronuncia" `onPress` handler:

```typescript
<Link.MenuAction
  title="Pronuncia"
  icon="speaker.wave.2"
  onPress={async () => {
    const rate = await getSpeechRate();
    const path = await getAudio(word.term, rate);
    if (path) {
      const player = createAudioPlayer({ uri: path });
      player.play();
    } else {
      Speech.speak(word.term, { language: "de-DE", rate });
    }
  }}
/>
```

**API note:** `createAudioPlayer(source)` is the imperative (non-hook) version of `useAudioPlayer` — it creates an `AudioPlayer` instance outside of React component lifecycle. Confirmed in expo-audio SDK 55 types. Perfect for fire-and-forget playback in a context menu callback.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/vocabulary/components/vocabulary-item.tsx
git commit -m "feat(tts): use WaveNet voice in vocabulary context menu"
```

---

### Task 7: Final verification

- [ ] **Step 1: Enable the Text-to-Speech API in Google Cloud Console**

The `EXPO_PUBLIC_GOOGLE_AI_KEY` is already configured for Gemini. Go to:
1. Google Cloud Console → APIs & Services → Library
2. Search "Cloud Text-to-Speech API"
3. Enable it on the same project

Without this step, the API will return 403 and the app will fall back to expo-speech.

- [ ] **Step 2: Full app walkthrough**

Test every integration point:
1. **Word card** → tap speaker → WaveNet voice (or native fallback if API not enabled)
2. **Conjugation tables** → tap tense header → all 6 forms in WaveNet with highlighting
3. **Pronoun grid** → tap individual form → WaveNet pronunciation
4. **Review card** → speaker icon → WaveNet voice. Enable auto-play → reveal card → auto-pronounces
5. **Vocabulary** → long press → "Pronuncia" → WaveNet voice
6. **Settings** → "Prova" → WaveNet voice at configured speed
7. **Airplane mode + cached word** → plays from cache
8. **Airplane mode + uncached word** → falls back to native iOS voice

- [ ] **Step 3: Verify TypeScript and linter**

```bash
npx tsc --noEmit
npx expo lint
```

- [ ] **Step 4: Commit if any cleanup needed**

```bash
git add -A
git commit -m "feat(tts): final cleanup and verification"
```
