# Google Cloud TTS Refactor — Design Spec

**Goal:** Replace expo-speech native iOS voices with Google Cloud TTS WaveNet for natural, human-sounding German pronunciation. Keep expo-speech as offline fallback.

**Approach:** New TTS service calls the Google Cloud TTS REST API, caches MP3 files locally, plays them via expo-audio. The useSpeech hook API stays unchanged — all consumers (SpeakerButton, word-card, conjugation, review) are unaffected. The vocabulary-item context menu is migrated to use the TTS service.

---

## 1. TTS Service

`src/features/shared/services/tts-service.ts`

### API Call

```
POST https://texttospeech.googleapis.com/v1/text:synthesize?key=${EXPO_PUBLIC_GOOGLE_AI_KEY}

Body:
{
  "input": { "text": "gehen" },
  "voice": { "languageCode": "de-DE", "name": "de-DE-WaveNet-D" },
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": 0.9
  }
}

Response:
{ "audioContent": "base64-encoded-mp3..." }
```

Uses the same `EXPO_PUBLIC_GOOGLE_AI_KEY` already configured for Gemini. The Text-to-Speech API must be enabled on the same Google Cloud project.

**Security note:** This is a client-side key embedded in the JS bundle. Enabling TTS on the same key expands the API surface. Set GCP API restrictions (iOS app bundle ID) on the key to limit abuse.

### Voice

`de-DE-WaveNet-D` (male, most commonly used for dictionaries). Hardcoded for now — configurable later if needed.

### Caching

- Cache directory: `${FileSystem.cacheDirectory}tts/`
- File naming: `${encodeURIComponent(term)}.mp3` — `encodeURIComponent` handles umlauts, spaces, and slashes safely for the filesystem
- Lookup algorithm (in order):
  1. Check if `audio_url` exists in the words DB for this term
  2. If yes → verify file exists at that path via `FileSystem.getInfoAsync()`
  3. If file exists → return path (cache hit)
  4. If file missing (iOS cleared cache) or no DB entry → call API
  5. On API success: decode base64, write MP3 to `tts/` dir, update `audio_url` in DB, return path
  6. On API failure: return `null`

### Database Integration

The `words` table already has an `audio_url TEXT` column that is currently unused. When audio is cached:
- Call `updateAudioUrl(term, localPath)` to store the filesystem path
- This is a best-effort optimization — the filesystem check is the source of truth

### Public API

```typescript
async function getAudio(text: string, speakingRate?: number): Promise<string | null>
```

Returns the local file path to the MP3, or `null` if:
- Network request failed (no internet, API error)
- API key is missing or invalid
- Any other error

Never throws — errors are swallowed and return `null` so the consumer can fallback.

**Note:** `speakingRate` is only used for the API call, not for cache lookup. Cached files use the default rate. This is acceptable because the rate is a playback preference, not a pronunciation variant — and caching per-rate would explode the cache size for minimal benefit.

---

## 2. Refactor of use-speech.ts

The hook maintains the same public API: `speak()`, `speakAll()`, `stop()`, `isSpeaking`, `isAvailable`, `currentSpeakingIndex`.

### Sound Instance Management

The hook tracks the active `Audio.Sound` via a `useRef<Audio.Sound | null>`. Before creating a new sound:
1. If `soundRef.current` exists → call `stopAsync()` + `unloadAsync()` on it
2. Set `soundRef.current` to the new sound instance
3. On `stop()` or unmount → same cleanup

This prevents orphaned sound instances when `speak()` is called while already playing.

### speak(text)

1. Stop and unload any previous sound instance
2. Call `ttsService.getAudio(text, rate)` → returns file path or null
3. If path:
   - Create sound via `Audio.Sound.createAsync({ uri: path })`
   - Store in `soundRef.current`
   - Set `onPlaybackStatusUpdate` callback: when `status.didJustFinish === true` → set `isSpeaking = false`, unload sound
   - Call `sound.playAsync()`, set `isSpeaking = true`
4. If null → fallback to `Speech.speak(text, { language: "de-DE", rate })` with existing `onDone`/`onStopped`/`onError` callbacks

### speakAll(forms)

Same sequential logic as current implementation. For each form:
1. Call the speak flow above (getAudio → Audio.Sound or expo-speech fallback)
2. Wait for completion: `didJustFinish` callback resolves the Promise (or `onDone` for expo-speech fallback)
3. Delay 600ms, then next form
4. Track `currentSpeakingIndex` as before

### stop()

- If `soundRef.current` → `stopAsync()` + `unloadAsync()`, set ref to null
- Call `Speech.stop()` (in case fallback was active)
- Reset `isSpeaking`, `currentSpeakingIndex`

### isAvailable

Always `true` — between Google Cloud TTS and expo-speech fallback, a voice is always available. The `checkGermanVoice()` module-level check is removed. Error haptics are removed since a fallback is always available.

### speechRate

- For Google Cloud TTS: passed as `speakingRate` in the API call (range 0.25–4.0, default 1.0). The app's range is 0.5–2.0 (`SPEECH_RATE_MIN`–`SPEECH_RATE_MAX` from settings/types.ts) which fits within the API's range — no clamping needed.
- For expo-speech fallback: uses the `rate` parameter as before
- Read from settings repository on each speak call (same as current behavior)

### Cleanup

- On unmount: stop and unload `soundRef.current`, clear timeout refs, call `Speech.stop()`

---

## 3. Settings Page Update

`src/app/(settings)/index.tsx`

- The `handlePreview` function changes to use the `useSpeech` hook's `speak()` instead of calling `Speech.speak()` directly. This ensures the preview uses the same WaveNet voice.
- Update the footer text from "La pronuncia usa la voce nativa del tuo dispositivo." to "La pronuncia usa Google Cloud per una voce naturale. Senza internet, usa la voce del dispositivo."

---

## 4. Vocabulary Item Update

`src/features/vocabulary/components/vocabulary-item.tsx`

The "Pronuncia" context menu action currently calls `Speech.speak()` directly (bypassing the hook). Change it to use `ttsService.getAudio()` + `Audio.Sound` for the WaveNet voice, with `Speech.speak()` fallback if `getAudio()` returns null:

```typescript
onPress={async () => {
  const rate = await getSpeechRate();
  const path = await getAudio(word.term, rate);
  if (path) {
    const { sound } = await Audio.Sound.createAsync({ uri: path });
    await sound.playAsync();
  } else {
    Speech.speak(word.term, { language: "de-DE", rate });
  }
}}
```

---

## 5. File Structure

### New Files

```
src/features/shared/services/tts-service.ts    — Google Cloud TTS API + filesystem cache
```

### Modified Files

```
src/features/shared/hooks/use-speech.ts             — Replace expo-speech primary with tts-service + expo-audio, keep expo-speech as fallback
src/features/shared/db/words-repository.ts           — Add updateAudioUrl(term, path) function
src/app/(settings)/index.tsx                         — Use useSpeech hook for preview, update footer text
src/features/vocabulary/components/vocabulary-item.tsx — Use tts-service for Pronuncia context menu action
```

### New Dependencies

Install via: `npx expo install expo-audio expo-file-system`

```
expo-audio        — Audio playback for cached MP3 files
expo-file-system  — Filesystem cache for MP3 files
```

### Kept Dependencies

```
expo-speech       — Offline fallback when Google Cloud TTS is unavailable
```

---

## 6. Data Flow

```
User taps speaker
  → useSpeech.speak(text)
    → Stop/unload previous Audio.Sound if any
    → ttsService.getAudio(text, rate)
      → Check audio_url in DB → verify file exists on disk
        → HIT: return path
        → MISS or stale: POST to Google Cloud TTS API
          → SUCCESS: decode base64, write MP3, update audio_url in DB, return path
          → FAILURE: return null
    → If path: Audio.Sound.createAsync({ uri: path }) → play, track via soundRef
    → If null: Speech.speak(text) (expo-speech fallback)
```

---

## 7. Edge Cases

| Scenario | Behavior |
|---|---|
| No network + no cache | Fallback to expo-speech native voice |
| No network + cached audio | Play from cache (no API call) |
| API key missing/invalid | getAudio returns null → expo-speech fallback |
| Cache directory doesn't exist | Create it on first write via `FileSystem.makeDirectoryAsync` |
| Disk full | getAudio returns null → expo-speech fallback |
| Term with special characters (umlauts, slashes) | `encodeURIComponent(term)` for filename |
| speakAll with uncached forms | Each form fetches individually, sequential |
| App cache cleared by iOS | audio_url in DB stale → file check fails → re-fetch from API |
| speechRate setting | Passed as speakingRate to Google Cloud TTS API (0.5–2.0 within API's 0.25–4.0 range) |
| Settings "Prova" button | Uses useSpeech hook → same WaveNet voice |
| speak() called while already playing | Previous Audio.Sound stopped + unloaded before new one starts |
| Component unmounts during playback | soundRef cleaned up, Speech.stop() called |
