# Pronunciation & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add text-to-speech pronunciation via `expo-speech` and a dedicated settings tab to WortSchatz.

**Architecture:** New `settings` feature module under `src/features/settings/` with SQLite persistence (same DB). Shared `useSpeech` hook + `SpeakerButton` component consumed by dictionary, review, and vocabulary features. Fourth NativeTabs trigger for settings page.

**Tech Stack:** expo-speech, expo-sqlite, react-native-reanimated, expo-image (SF Symbols), NativeTabs (expo-router SDK 55)

**Spec:** `docs/superpowers/specs/2026-03-26-pronunciation-design.md`

**Native UI Skill:** `.agents/skills/building-native-ui/SKILL.md` — MUST follow for all UI decisions.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/features/settings/types.ts` | `AppSettings` interface + `DEFAULT_SETTINGS` constant |
| `src/features/settings/services/settings-repository.ts` | SQLite CRUD for settings table |
| `src/features/settings/hooks/use-settings.ts` | React hook: load + update settings |
| `src/features/settings/components/settings-section.tsx` | Section wrapper with header label |
| `src/features/settings/components/settings-toggle-row.tsx` | Row with label + Switch toggle |
| `src/features/settings/components/settings-slider-row.tsx` | Row with label + value badge + Slider |
| `src/features/settings/components/settings-value-row.tsx` | Row with label + static value |
| `src/features/settings/components/voice-preview-card.tsx` | Preview card with "Prova" button |
| `src/features/shared/hooks/use-speech.ts` | TTS hook: speak, speakAll, stop, state |
| `src/features/shared/components/speaker-button.tsx` | Reusable speaker icon button |
| `src/app/(settings)/_layout.tsx` | Stack layout for settings tab |
| `src/app/(settings)/index.tsx` | Settings screen |

### Modified Files

| File | Change |
|------|--------|
| `src/features/shared/db/database.ts` | Add `settings` table creation |
| `src/components/app-tabs.tsx` | Add 4th NativeTabs.Trigger |
| `src/features/shared/theme/colors.ts` | Add `accent` color token |
| `src/features/dictionary/components/word-card.tsx` | Add SpeakerButton next to term |
| `src/features/dictionary/components/pronoun-grid.tsx` | Add SpeakerButton per row + highlightedIndex prop |
| `src/features/dictionary/components/conjugation-screen.tsx` | Add useSpeech to TenseTable + PerfektTable |
| `src/features/review/components/review-card.tsx` | Add SpeakerButton + auto-play |
| `src/features/vocabulary/components/vocabulary-item.tsx` | Add "Pronuncia" to context menu |

### New Dependency

```
expo-speech
```

---

### Task 1: Install expo-speech and add accent color

**Files:**
- Modify: `package.json`
- Modify: `src/features/shared/theme/colors.ts`

- [ ] **Step 1: Install expo-speech**

```bash
npx expo install expo-speech
```

- [ ] **Step 2: Add accent color to colors.ts**

Add the `accent` and `accentLight` tokens to `src/features/shared/theme/colors.ts`:

```typescript
// After the existing prep color
accent: "#C4943A",
accentLight: "#F5E6C8",
```

- [ ] **Step 3: Verify the app still builds**

```bash
npx expo start
```

Press `i` to launch iOS simulator. Confirm the app loads without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lockb src/features/shared/theme/colors.ts
git commit -m "feat(speech): install expo-speech and add accent colors"
```

---

### Task 2: Settings types and database table

**Files:**
- Create: `src/features/settings/types.ts`
- Modify: `src/features/shared/db/database.ts`

- [ ] **Step 1: Create settings types**

Create `src/features/settings/types.ts`:

```typescript
export interface AppSettings {
  autoPlayOnReveal: boolean;
  speechRate: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoPlayOnReveal: false,
  speechRate: 0.9,
};

export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 2.0;
export const SPEECH_RATE_STEP = 0.1;
```

- [ ] **Step 2: Add settings table to database.ts**

In `src/features/shared/db/database.ts`, after the `idx_words_next_review` index creation, add:

```typescript
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);
```

- [ ] **Step 3: Verify database initializes**

Launch the app. Navigate to any screen that triggers DB init (e.g., search a word). Confirm no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/types.ts src/features/shared/db/database.ts
git commit -m "feat(settings): add AppSettings types and settings table"
```

---

### Task 3: Settings repository

**Files:**
- Create: `src/features/settings/services/settings-repository.ts`

- [ ] **Step 1: Create the settings repository**

Create `src/features/settings/services/settings-repository.ts`:

```typescript
import { getDatabase } from "@/features/shared/db/database";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function getAppSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM settings",
  );

  const settings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (row.key in settings) {
      try {
        (settings as Record<string, unknown>)[row.key] = JSON.parse(row.value);
      } catch {
        // Keep default on parse error
      }
    }
  }

  return settings;
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await setSetting(key, JSON.stringify(value));
}

export async function getSpeechRate(): Promise<number> {
  const raw = await getSetting("speechRate");
  if (raw === null) return DEFAULT_SETTINGS.speechRate;
  try {
    const rate = JSON.parse(raw);
    return typeof rate === "number" ? rate : DEFAULT_SETTINGS.speechRate;
  } catch {
    return DEFAULT_SETTINGS.speechRate;
  }
}
```

- [ ] **Step 2: Verify by reading settings in the app**

Temporarily add a `console.log(await getAppSettings())` call somewhere to confirm it returns defaults. Remove after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/services/settings-repository.ts
git commit -m "feat(settings): add settings repository with SQLite persistence"
```

---

### Task 4: Settings hook

**Files:**
- Create: `src/features/settings/hooks/use-settings.ts`

- [ ] **Step 1: Create the use-settings hook**

Create `src/features/settings/hooks/use-settings.ts`:

```typescript
import { useCallback, useEffect, useState } from "react";
import {
  getAppSettings,
  updateSetting as updateSettingDb,
} from "../services/settings-repository";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAppSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      await updateSettingDb(key, value);
    },
    [],
  );

  return { settings, updateSetting, isLoading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/hooks/use-settings.ts
git commit -m "feat(settings): add useSettings hook"
```

---

### Task 5: Settings UI components

**Files:**
- Create: `src/features/settings/components/settings-section.tsx`
- Create: `src/features/settings/components/settings-toggle-row.tsx`
- Create: `src/features/settings/components/settings-slider-row.tsx`
- Create: `src/features/settings/components/settings-value-row.tsx`
- Create: `src/features/settings/components/voice-preview-card.tsx`

- [ ] **Step 1: Create settings-section.tsx**

```typescript
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsSectionProps {
  title: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  footer,
  children,
}: SettingsSectionProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 13,
          fontWeight: "600",
          color: colors.textTertiary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          paddingHorizontal: 16,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 14,
          borderCurve: "continuous",
          boxShadow: "0 1px 3px rgba(60, 42, 20, 0.06)",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
      {footer && (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textMuted,
            paddingHorizontal: 16,
            lineHeight: 18,
          }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Create settings-toggle-row.tsx**

```typescript
import { View, Text, Switch } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  label,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}
```

- [ ] **Step 3: Create settings-slider-row.tsx**

```typescript
import { View, Text } from "react-native";
import { Slider } from "@expo/ui";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
  onValueChange: (value: number) => void;
}

export function SettingsSliderRow({
  label,
  value,
  min,
  max,
  step,
  formatValue = (v) => `${v.toFixed(1)}x`,
  onValueChange,
}: SettingsSliderRowProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.textPrimary,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            backgroundColor: colors.accentLight,
            borderRadius: 6,
            borderCurve: "continuous",
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            {formatValue(value)}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: "500",
            color: colors.textMuted,
            minWidth: 28,
            textAlign: "center",
          }}
        >
          {formatValue(min)}
        </Text>
        <View style={{ flex: 1 }}>
          <Slider
            value={value}
            minimumValue={min}
            maximumValue={max}
            steps={Math.round((max - min) / step)}
            onValueChange={({ nativeEvent: { value: v } }) => onValueChange(v)}
          />
        </View>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: "500",
            color: colors.textMuted,
            minWidth: 28,
            textAlign: "center",
          }}
        >
          {formatValue(max)}
        </Text>
      </View>
    </View>
  );
}
```

**Important:** Check if `@expo/ui` `Slider` works with this API. If it doesn't support `steps` or `onValueChange` with `nativeEvent`, use React Native's `Slider` from `@react-native-community/slider` instead. Consult `.agents/skills/building-native-ui/references/controls.md` for the correct Slider API.

- [ ] **Step 4: Create settings-value-row.tsx**

```typescript
import { View, Text } from "react-native";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";

interface SettingsValueRowProps {
  label: string;
  value: string;
}

export function SettingsValueRow({ label, value }: SettingsValueRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 14,
          fontWeight: "500",
          color: colors.textTertiary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 5: Create voice-preview-card.tsx**

```typescript
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";
import { hapticLight } from "@/features/shared/hooks/use-haptics";

interface VoicePreviewCardProps {
  onPress: () => void;
}

export function VoicePreviewCard({ onPress }: VoicePreviewCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        borderCurve: "continuous",
        boxShadow: "0 1px 3px rgba(60, 42, 20, 0.06)",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: colors.accentLight,
          borderRadius: 12,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source="sf:speaker.wave.2.fill"
          style={{ width: 24, height: 24 }}
          tintColor={colors.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 16,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
        >
          Voce tedesca
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textTertiary,
          }}
        >
          Tocca per ascoltare un esempio
        </Text>
      </View>
      <Pressable
        onPress={() => {
          hapticLight();
          onPress();
        }}
        style={{
          backgroundColor: colors.accentLight,
          borderRadius: 8,
          borderCurve: "continuous",
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: "600",
            color: colors.accent,
          }}
        >
          Prova
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/components/
git commit -m "feat(settings): add settings UI components"
```

---

### Task 6: Settings tab and page

**Files:**
- Create: `src/app/(settings)/_layout.tsx`
- Create: `src/app/(settings)/index.tsx`
- Modify: `src/components/app-tabs.tsx`

- [ ] **Step 1: Create settings layout**

Create `src/app/(settings)/_layout.tsx`:

```typescript
import Stack from "expo-router/stack";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create settings screen**

Create `src/app/(settings)/index.tsx`:

```typescript
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import * as Speech from "expo-speech";
import Constants from "expo-constants";

import { colors } from "@/features/shared/theme/colors";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { SPEECH_RATE_MIN, SPEECH_RATE_MAX, SPEECH_RATE_STEP } from "@/features/settings/types";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { SettingsToggleRow } from "@/features/settings/components/settings-toggle-row";
import { SettingsSliderRow } from "@/features/settings/components/settings-slider-row";
import { SettingsValueRow } from "@/features/settings/components/settings-value-row";
import { VoicePreviewCard } from "@/features/settings/components/voice-preview-card";

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();

  const handlePreview = () => {
    Speech.stop();
    Speech.speak("Willkommen bei WortSchatz", {
      language: "de-DE",
      rate: settings.speechRate,
    });
  };

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <VoicePreviewCard onPress={handlePreview} />

        <SettingsSection
          title="Pronuncia"
          footer="La pronuncia usa la voce nativa del tuo dispositivo. Velocità più bassa aiuta a distinguere i suoni."
        >
          <SettingsToggleRow
            label="Auto-play al reveal"
            value={settings.autoPlayOnReveal}
            onValueChange={(v) => updateSetting("autoPlayOnReveal", v)}
          />
          <View
            style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 16 }}
          />
          <SettingsSliderRow
            label="Velocità voce"
            value={settings.speechRate}
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={SPEECH_RATE_STEP}
            onValueChange={(v) => updateSetting("speechRate", v)}
          />
        </SettingsSection>

        <SettingsSection title="Info">
          <SettingsValueRow label="Versione" value={version} />
        </SettingsSection>
      </ScrollView>

      <Stack.Screen options={{ title: "Impostazioni" }} />
    </>
  );
}
```

- [ ] **Step 3: Add settings tab to app-tabs.tsx**

In `src/components/app-tabs.tsx`, add the fourth trigger before the closing `</NativeTabs>`:

```tsx
<NativeTabs.Trigger name="(settings)">
  <NativeTabs.Trigger.Icon
    sf={{ default: "gearshape", selected: "gearshape.fill" }}
  />
  <NativeTabs.Trigger.Label>Impostazioni</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

- [ ] **Step 4: Verify the settings tab appears and works**

Launch the app. Confirm:
- 4th tab "Impostazioni" appears with gear icon
- Settings page loads with voice preview, pronunciation section, info section
- Toggle works
- Slider works
- "Prova" button speaks "Willkommen bei WortSchatz"
- Values persist after navigating away and back

- [ ] **Step 5: Commit**

```bash
git add src/app/\(settings\)/ src/components/app-tabs.tsx
git commit -m "feat(settings): add settings tab and page with pronunciation controls"
```

---

### Task 7: Speech hook (use-speech)

**Files:**
- Create: `src/features/shared/hooks/use-speech.ts`

- [ ] **Step 1: Create the use-speech hook**

Create `src/features/shared/hooks/use-speech.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { hapticLight, hapticMedium } from "./use-haptics";

// Module-level cache for voice availability check
let voiceCheckPromise: Promise<boolean> | null = null;

function checkGermanVoice(): Promise<boolean> {
  if (!voiceCheckPromise) {
    voiceCheckPromise = Speech.getAvailableVoicesAsync().then((voices) =>
      voices.some((v) => v.language.startsWith("de")),
    );
  }
  return voiceCheckPromise;
}

interface UseSpeechOptions {
  speechRate?: number;
}

export function useSpeech(options?: UseSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  const sequenceRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check voice availability on mount
  useEffect(() => {
    checkGermanVoice().then(setIsAvailable);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getRate = useCallback(async () => {
    if (options?.speechRate !== undefined) return options.speechRate;
    return getSpeechRate();
  }, [options?.speechRate]);

  const speak = useCallback(
    async (text: string) => {
      if (!isAvailable) {
        hapticMedium();
        return;
      }

      // Cancel any running sequence
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrentSpeakingIndex(null);

      Speech.stop();
      const rate = await getRate();

      hapticLight();
      Speech.speak(text, {
        language: "de-DE",
        rate,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          setIsAvailable(false);
          hapticMedium();
        },
      });
    },
    [isAvailable, getRate],
  );

  const speakAll = useCallback(
    async (forms: string[], delayMs = 600) => {
      if (!isAvailable || forms.length === 0) {
        if (!isAvailable) hapticMedium();
        return;
      }

      // Cancel previous sequence
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Speech.stop();

      const sequence = { cancelled: false };
      sequenceRef.current = sequence;

      const rate = await getRate();
      hapticLight();

      for (let i = 0; i < forms.length; i++) {
        if (sequence.cancelled) break;

        setCurrentSpeakingIndex(i);

        await new Promise<void>((resolve) => {
          Speech.speak(forms[i], {
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
              setIsAvailable(false);
              resolve();
            },
          });
        });

        if (sequence.cancelled || i === forms.length - 1) break;

        // Delay between forms
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, delayMs);
        });
      }

      if (!sequence.cancelled) {
        setCurrentSpeakingIndex(null);
      }
    },
    [isAvailable, getRate],
  );

  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    Speech.stop();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, []);

  return { speak, speakAll, stop, isSpeaking, isAvailable, currentSpeakingIndex };
}
```

- [ ] **Step 2: Verify by testing in the Settings "Prova" button**

Temporarily wire the hook into settings screen to confirm `speak()` works. Or just confirm the Prova button (which uses Speech directly) still works — the hook will be tested via SpeakerButton in the next task.

- [ ] **Step 3: Commit**

```bash
git add src/features/shared/hooks/use-speech.ts
git commit -m "feat(speech): add useSpeech hook with speak, speakAll, and voice detection"
```

---

### Task 8: Speaker button component

**Files:**
- Create: `src/features/shared/components/speaker-button.tsx`

- [ ] **Step 1: Create speaker-button.tsx**

```typescript
import { Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useEffect } from "react";
import { colors } from "@/features/shared/theme/colors";
import { useSpeech } from "@/features/shared/hooks/use-speech";

interface SpeakerButtonProps {
  text?: string;
  size?: "sm" | "md";
  onSpeakAll?: () => void;
  isHighlighted?: boolean;
}

const SIZES = {
  sm: { icon: 16, hitSlop: 8 },
  md: { icon: 22, hitSlop: 4 },
} as const;

export function SpeakerButton({
  text,
  size = "md",
  onSpeakAll,
  isHighlighted,
}: SpeakerButtonProps) {
  const { speak, stop, isSpeaking, isAvailable } = useSpeech();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSpeaking && !onSpeakAll) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isSpeaking, onSpeakAll, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isAvailable) return;
    if (isSpeaking && !onSpeakAll) {
      stop();
      return;
    }
    if (onSpeakAll) {
      onSpeakAll();
    } else if (text) {
      speak(text);
    }
  };

  const iconName = isAvailable ? "speaker.wave.2" : "speaker.slash";
  const iconColor = !isAvailable
    ? colors.textMuted
    : isSpeaking
      ? colors.accent
      : colors.textTertiary;

  const { icon: iconSize, hitSlop } = SIZES[size];

  return (
    <Pressable onPress={handlePress} hitSlop={hitSlop}>
      <Animated.View style={animatedStyle}>
        <Image
          source={`sf:${iconName}`}
          style={{ width: iconSize, height: iconSize }}
          tintColor={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}
```

**Note:** Each `SpeakerButton` creates its own `useSpeech` instance. This is fine because the module-level voice check is shared, and `Speech.stop()` is global — calling speak from one button stops any other. For `speakAll` scenarios (conjugation tables), the parent component should use its own `useSpeech` and pass `onSpeakAll` instead.

- [ ] **Step 2: Commit**

```bash
git add src/features/shared/components/speaker-button.tsx
git commit -m "feat(speech): add SpeakerButton component with pulse animation"
```

---

### Task 9: Integrate SpeakerButton into word card

**Files:**
- Modify: `src/features/dictionary/components/word-card.tsx`

- [ ] **Step 1: Add SpeakerButton to word-card.tsx**

Import `SpeakerButton` and add it next to the term. Modify the term area to be a row:

Replace the current term `<Text>` block (lines 38-40):

```typescript
<Text selectable style={textStyles.word}>
  {word.term}
</Text>
```

With:

```typescript
<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
  <Text selectable style={[textStyles.word, { flex: 1 }]}>
    {word.term}
  </Text>
  <SpeakerButton text={word.term} size="md" />
</View>
```

Add to imports:

```typescript
import { SpeakerButton } from "@/features/shared/components/speaker-button";
```

- [ ] **Step 2: Verify**

Search for a word (e.g., "Tisch"). Confirm the speaker icon appears to the right of the term. Tap it — the word should be pronounced in German.

- [ ] **Step 3: Commit**

```bash
git add src/features/dictionary/components/word-card.tsx
git commit -m "feat(speech): add speaker button to word card"
```

---

### Task 10: Integrate SpeakerButton into pronoun grid

**Files:**
- Modify: `src/features/dictionary/components/pronoun-grid.tsx`

- [ ] **Step 1: Add highlightedIndex prop and SpeakerButton**

Update `PronounGridProps` and `PronounColumn` to support highlighted rows and speaker buttons:

Rewrite `src/features/dictionary/components/pronoun-grid.tsx`:

```typescript
import React from "react";
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { textStyles } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";
import { SpeakerButton } from "@/features/shared/components/speaker-button";

interface PronounData {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

interface PronounGridProps {
  data: PronounData;
  renderForm: (pronoun: string, form: string) => ReactNode;
  highlightedIndex?: number | null;
}

const leftPronouns = [
  { key: "ich" as const, label: "ich", index: 0 },
  { key: "du" as const, label: "du", index: 1 },
  { key: "er" as const, label: "er/sie/es", index: 2 },
];

const rightPronouns = [
  { key: "wir" as const, label: "wir", index: 3 },
  { key: "ihr" as const, label: "ihr", index: 4 },
  { key: "sie" as const, label: "sie/Sie", index: 5 },
];

function PronounColumn({
  pronouns,
  data,
  renderForm,
  highlightedIndex,
}: {
  pronouns: readonly { key: keyof PronounData; label: string; index: number }[];
  data: PronounData;
  renderForm: (pronoun: string, form: string) => ReactNode;
  highlightedIndex?: number | null;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      {pronouns.map(({ key, label, index }) => {
        const isHighlighted = highlightedIndex === index;
        const form = data[key] ?? "\u2014";

        return (
          <View
            key={key}
            style={{
              flexDirection: "row",
              gap: 6,
              alignItems: "baseline",
              backgroundColor: isHighlighted
                ? `${colors.accent}1A`
                : "transparent",
              borderRadius: 4,
              borderCurve: "continuous",
              paddingVertical: isHighlighted ? 2 : 0,
              paddingHorizontal: isHighlighted ? 4 : 0,
            }}
          >
            <Text
              style={[
                textStyles.monoLabel,
                { width: 42, marginBottom: 0, flexShrink: 0 },
              ]}
            >
              {label}
            </Text>
            <View style={{ flex: 1, flexShrink: 1 }}>
              {renderForm(key, form)}
            </View>
            <SpeakerButton
              text={`${key} ${form}`}
              size="sm"
            />
          </View>
        );
      })}
    </View>
  );
}

export const PronounGrid = React.memo(function PronounGrid({
  data,
  renderForm,
  highlightedIndex,
}: PronounGridProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <PronounColumn
        pronouns={leftPronouns}
        data={data}
        renderForm={renderForm}
        highlightedIndex={highlightedIndex}
      />
      <PronounColumn
        pronouns={rightPronouns}
        data={data}
        renderForm={renderForm}
        highlightedIndex={highlightedIndex}
      />
    </View>
  );
});
```

- [ ] **Step 2: Verify**

Navigate to a verb's conjugation (e.g., "gehen" → verb sections). Confirm small speaker icons appear next to each pronoun form. Tap one — it should pronounce "ich gehe" etc.

- [ ] **Step 3: Commit**

```bash
git add src/features/dictionary/components/pronoun-grid.tsx
git commit -m "feat(speech): add speaker buttons and highlight support to pronoun grid"
```

---

### Task 11: Integrate speakAll into conjugation screen

**Files:**
- Modify: `src/features/dictionary/components/conjugation-screen.tsx`

- [ ] **Step 1: Add useSpeech to TenseTable and PerfektTable**

In `conjugation-screen.tsx`, update `TenseTable` to use `useSpeech` and pass `currentSpeakingIndex` + `onSpeakAll` header button:

Update `TenseTable`:

```typescript
function TenseTable({
  title,
  data,
  isIrregular,
  highlightEnding,
}: {
  title: string;
  data: ConjugationTenseData;
  isIrregular: boolean;
  highlightEnding: boolean;
}) {
  const { speakAll, stop, isSpeaking, currentSpeakingIndex } = useSpeech();
  const referenceForm = data.wir;

  const forms = useMemo(
    () => [
      `ich ${data.ich}`,
      `du ${data.du}`,
      `er ${data.er}`,
      `wir ${data.wir}`,
      `ihr ${data.ihr}`,
      `sie ${data.sie}`,
    ],
    [data],
  );

  const handleSpeakAll = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      speakAll(forms);
    }
  }, [isSpeaking, stop, speakAll, forms]);

  const renderForm = useCallback(
    (pronoun: string, form: string) => (
      <HighlightedForm
        form={form}
        person={pronoun}
        isIrregular={isIrregular}
        referenceForm={referenceForm}
        highlightEnding={highlightEnding}
      />
    ),
    [isIrregular, referenceForm, highlightEnding],
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SectionTitle>{title}</SectionTitle>
        <SpeakerButton onSpeakAll={handleSpeakAll} size="md" />
      </View>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 10,
          borderCurve: "continuous",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <PronounGrid
          data={data}
          renderForm={renderForm}
          highlightedIndex={currentSpeakingIndex}
        />
      </View>
    </View>
  );
}
```

Add the same pattern to `PerfektTable`. It assembles forms differently — the Perfekt forms are already full phrases (e.g., "habe gegessen"):

```typescript
function PerfektTable({
  data,
  partizipII,
}: {
  data: ConjugationTenseData;
  partizipII: string;
}) {
  const { speakAll, stop, isSpeaking, currentSpeakingIndex } = useSpeech();

  const forms = useMemo(
    () => [
      `ich ${data.ich}`,
      `du ${data.du}`,
      `er ${data.er}`,
      `wir ${data.wir}`,
      `ihr ${data.ihr}`,
      `sie ${data.sie}`,
    ],
    [data],
  );

  const handleSpeakAll = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      speakAll(forms);
    }
  }, [isSpeaking, stop, speakAll, forms]);

  const renderForm = useCallback(
    (_pronoun: string, form: string) => (
      <PerfektForm form={form} partizipII={partizipII} />
    ),
    [partizipII],
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SectionTitle>Perfekt</SectionTitle>
        <SpeakerButton onSpeakAll={handleSpeakAll} size="md" />
      </View>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 10,
          borderCurve: "continuous",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <PronounGrid
          data={data}
          renderForm={renderForm}
          highlightedIndex={currentSpeakingIndex}
        />
      </View>
    </View>
  );
}
```

Add imports at the top:

```typescript
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import { useSpeech } from "@/features/shared/hooks/use-speech";
```

And add `useMemo` to the existing import from `react`.

- [ ] **Step 2: Verify**

Navigate to a verb's full conjugation page. Confirm:
- Speaker icon next to each tense header (Prasens, Prateritum, Perfekt, Konjunktiv II)
- Tap tense header speaker → all 6 forms play in sequence
- Current row highlights as each form plays
- Tap again during sequence → stops
- Individual row speakers still work

- [ ] **Step 3: Commit**

```bash
git add src/features/dictionary/components/conjugation-screen.tsx
git commit -m "feat(speech): add speakAll to conjugation tense tables with row highlighting"
```

---

### Task 12: Integrate SpeakerButton into review card

**Files:**
- Modify: `src/features/review/components/review-card.tsx`

- [ ] **Step 1: Add SpeakerButton and auto-play logic**

Add imports:

```typescript
import { useEffect, useRef } from "react";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import { useSpeech } from "@/features/shared/hooks/use-speech";
import { getSetting } from "@/features/settings/services/settings-repository";
```

Inside `ReviewCard`, add the speech hook and auto-play effect:

```typescript
export function ReviewCard({ word, isRevealed, onReveal }: ReviewCardProps) {
  const { speak } = useSpeech();
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    if (isRevealed && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      getSetting("autoPlayOnReveal").then((raw) => {
        const enabled = raw ? JSON.parse(raw) === true : false;
        if (enabled) {
          speak(word.term);
        }
      });
    }
    if (!isRevealed) {
      hasAutoPlayed.current = false;
    }
  }, [isRevealed, speak, word.term]);

  // ... rest of component
```

In both the hidden and revealed states, add `SpeakerButton` next to the term. For example, in the hidden state, after the term `<Text>`:

```tsx
<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
  <Text
    selectable
    style={[
      textStyles.word,
      { fontSize: 42, letterSpacing: -1.5, textAlign: "center" },
    ]}
  >
    {word.term}
  </Text>
  <SpeakerButton text={word.term} size="md" />
</View>
```

Same pattern in the revealed state.

- [ ] **Step 2: Verify**

Start a review session. Confirm:
- Speaker icon appears next to the word in both states
- Tap it → word is pronounced
- Enable auto-play in settings → reveal a card → word is auto-pronounced
- Disable auto-play → reveal a card → no auto-play

- [ ] **Step 3: Commit**

```bash
git add src/features/review/components/review-card.tsx
git commit -m "feat(speech): add speaker button and auto-play to review card"
```

---

### Task 13: Add "Pronuncia" to vocabulary item context menu

**Files:**
- Modify: `src/features/vocabulary/components/vocabulary-item.tsx`

- [ ] **Step 1: Add Pronuncia action to context menu**

Import Speech and the settings helper:

```typescript
import * as Speech from "expo-speech";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
```

In the `<Link.Menu>` block, add the "Pronuncia" action before "Share":

```tsx
<Link.Menu>
  <Link.MenuAction
    title="Pronuncia"
    icon="speaker.wave.2"
    onPress={async () => {
      const rate = await getSpeechRate();
      Speech.speak(word.term, { language: "de-DE", rate });
    }}
  />
  <Link.MenuAction
    title="Share"
    icon="square.and.arrow.up"
    onPress={() => {
      Share.share({ message: formatWordForSharing(word) });
    }}
  />
  <Link.MenuAction
    title="Delete"
    icon="trash"
    destructive
    onPress={async () => {
      await deleteWord(word.term);
      onDeleted?.();
    }}
  />
</Link.Menu>
```

- [ ] **Step 2: Verify**

Go to the vocabulary list. Long press a word. Confirm "Pronuncia" appears as the first context menu action. Tap it → word is pronounced at the configured speech rate.

- [ ] **Step 3: Commit**

```bash
git add src/features/vocabulary/components/vocabulary-item.tsx
git commit -m "feat(speech): add Pronuncia action to vocabulary context menu"
```

---

### Task 14: Final verification and cleanup

- [ ] **Step 1: Full app walkthrough**

Test every integration point:
1. **Search** → look up "gehen" → speaker icon on word card → tap → pronounces "gehen"
2. **Verb sections** → speaker icons on each pronoun row → tap "ich gehe" → pronounces
3. **Conjugation page** → speaker on each tense header → tap → plays all 6 forms with highlighting
4. **Review** → start session → speaker on card → auto-play on reveal (if enabled in settings)
5. **Vocabulary** → long press word → "Pronuncia" in context menu → pronounces
6. **Settings** → toggle auto-play → change speed → "Prova" → confirms speed change
7. **Settings persistence** → change speed → leave settings → come back → value persists

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify linter passes**

```bash
npx expo lint
```

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "feat(speech): final cleanup and verification"
```
