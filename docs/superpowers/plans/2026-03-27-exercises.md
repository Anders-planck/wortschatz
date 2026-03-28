# Exercises Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 exercise types (fill-in-the-blank, dictation, article/case quiz) + AI mix mode to the review tab, with AI-generated exercises, feedback, and score tracking.

**Architecture:** Feature module at `src/features/exercises/` with types, Gemini-based generator service, session hook, and UI components. Routes added to `(review)` layout as form sheet modals. Exercises are ephemeral (no DB table) — generated from user's vocabulary, results update `review_score` via existing spaced repetition system.

**Tech Stack:** Expo Router (Stack + formSheet), Gemini 2.5 Flash Lite (AI SDK `generateText` + Zod), expo-speech/TTS, expo-haptics, react-native-reanimated

---

## File Structure

```
src/features/exercises/
  types.ts                    — Exercise types, session state interfaces
  services/
    exercise-generator.ts     — Gemini prompts + Zod schemas for fill/cases/mix
    exercise-words.ts         — Word selection logic (low score priority)
  hooks/
    use-exercise-session.ts   — Session state machine (loading → active → summary)
  components/
    exercise-hub.tsx           — Grid of exercise type cards
    fill-blank-exercise.tsx    — Fill-in-the-blank UI
    dictation-exercise.tsx     — Dictation UI with TTS
    case-quiz-exercise.tsx     — Article/case pill selection UI
    exercise-progress.tsx      — Dot progress bar
    exercise-feedback.tsx      — Correct/wrong banner with tip
    exercise-summary.tsx       — End-of-session score + stats

src/app/(review)/
  _layout.tsx                  — Add exercises + exercise-session routes
  exercises.tsx                — Exercise hub route
  exercise-session.tsx         — Exercise session route (formSheet modal)
```

---

### Task 1: Types and word selection

**Files:**
- Create: `src/features/exercises/types.ts`
- Create: `src/features/exercises/services/exercise-words.ts`

- [ ] **Step 1: Create exercise types**

```typescript
// src/features/exercises/types.ts
import type { Word } from "@/features/dictionary/types";

export type ExerciseType = "fill" | "dictation" | "cases" | "mix";

export interface FillBlankExercise {
  type: "fill";
  sentence: string;       // German sentence with ___
  answer: string;         // correct word
  translation: string;    // Italian translation of full sentence
  hint: string;           // grammar tip
  wordTerm: string;       // which vocab word this tests
}

export interface DictationExercise {
  type: "dictation";
  sentence: string;       // German sentence to hear
  translation: string;    // Italian translation
  wordTerm: string;
}

export interface CaseQuizExercise {
  type: "cases";
  sentence: string;       // German sentence with ___ for article
  correctArticle: string; // der/den/dem/des/die/ein/einen/einem/eines
  options: string[];      // 4 choices
  caseType: "nom" | "akk" | "dat" | "gen";
  translation: string;
  explanation: string;    // why this case
  wordTerm: string;
}

export type Exercise = FillBlankExercise | DictationExercise | CaseQuizExercise;

export interface ExerciseResult {
  exercise: Exercise;
  userAnswer: string;
  isCorrect: boolean;
}

export type SessionPhase = "loading" | "active" | "summary";
```

- [ ] **Step 2: Create word selection service**

```typescript
// src/features/exercises/services/exercise-words.ts
import type { Word } from "@/features/dictionary/types";
import { getAllWords } from "@/features/shared/db/words-repository";

export async function getExerciseWords(
  count: number,
  filter?: { type?: string; hasExamples?: boolean },
): Promise<Word[]> {
  const all = await getAllWords();
  let candidates = all;

  if (filter?.type) {
    candidates = candidates.filter((w) => w.type === filter.type);
  }
  if (filter?.hasExamples) {
    candidates = candidates.filter(
      (w) => w.examples && w.examples.length > 0,
    );
  }

  // Sort by review score ascending (weakest first)
  candidates.sort((a, b) => a.reviewScore - b.reviewScore);

  return candidates.slice(0, count);
}

export function getWordsWithExamples(words: Word[]): Word[] {
  return words.filter((w) => w.examples && w.examples.length > 0);
}

export function getNounsWithGender(words: Word[]): Word[] {
  return words.filter((w) => w.type === "noun" && w.gender);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/features/exercises/
git commit -m "feat(exercises): add types and word selection service"
```

---

### Task 2: Exercise generator service (Gemini AI)

**Files:**
- Create: `src/features/exercises/services/exercise-generator.ts`

- [ ] **Step 1: Create generator with Zod schemas and Gemini prompts**

```typescript
// src/features/exercises/services/exercise-generator.ts
import { generateText, Output } from "ai";
import { z } from "zod";
import { google } from "@/features/shared/config/ai-provider";
import type { Word } from "@/features/dictionary/types";
import type {
  Exercise,
  FillBlankExercise,
  DictationExercise,
  CaseQuizExercise,
  ExerciseType,
} from "../types";
import {
  getExerciseWords,
  getWordsWithExamples,
  getNounsWithGender,
} from "./exercise-words";

// --- Zod Schemas ---

const FillBlankSchema = z.object({
  exercises: z.array(
    z.object({
      sentence: z.string().describe("German sentence with ___ placeholder"),
      answer: z.string().describe("The correct word to fill in"),
      translation: z.string().describe("Italian translation of full sentence"),
      hint: z.string().describe("Grammar tip in Italian"),
      wordTerm: z.string().describe("Which vocabulary word this tests"),
    }),
  ),
});

const CaseQuizSchema = z.object({
  exercises: z.array(
    z.object({
      sentence: z
        .string()
        .describe("German sentence with ___ where article goes"),
      correctArticle: z.string().describe("Correct article"),
      options: z.array(z.string()).length(4).describe("4 article options"),
      caseType: z.enum(["nom", "akk", "dat", "gen"]),
      translation: z.string().describe("Italian translation"),
      explanation: z
        .string()
        .describe("Why this case is used, in Italian"),
      wordTerm: z.string(),
    }),
  ),
});

// --- Generators ---

async function generateFillBlank(
  words: Word[],
): Promise<FillBlankExercise[]> {
  const wordList = words.map((w) => `${w.term} (${w.translations[0]})`).join(", ");

  const { experimental_output } = await generateText({
    model: google("gemini-2.5-flash-lite"),
    prompt: `You are a German language tutor for an Italian-speaking B1 student.

Create fill-in-the-blank exercises using these words: ${wordList}

For each word, write a natural German sentence (B1 level) where the word is replaced by ___. The student must type the correct word. Include an Italian translation of the full sentence and a grammar hint in Italian.

IMPORTANT: Each exercise must test exactly one of the provided words. Use each word once.`,
    experimental_output: Output.object({ schema: FillBlankSchema }),
  });

  return (experimental_output?.exercises ?? []).map((e) => ({
    ...e,
    type: "fill" as const,
  }));
}

function generateDictation(words: Word[]): DictationExercise[] {
  const withExamples = getWordsWithExamples(words);
  const exercises: DictationExercise[] = [];

  for (const word of withExamples) {
    if (!word.examples || word.examples.length === 0) continue;
    const example = word.examples[0];
    exercises.push({
      type: "dictation",
      sentence: example.sentence,
      translation: example.translation,
      wordTerm: word.term,
    });
  }

  return exercises.slice(0, 10);
}

async function generateCaseQuiz(
  words: Word[],
): Promise<CaseQuizExercise[]> {
  const nouns = getNounsWithGender(words);
  if (nouns.length === 0) return [];

  const wordList = nouns
    .map((w) => `${w.gender} ${w.term} (${w.translations[0]})`)
    .join(", ");

  const { experimental_output } = await generateText({
    model: google("gemini-2.5-flash-lite"),
    prompt: `You are a German language tutor for an Italian-speaking B1 student.

Create article/case exercises using these nouns: ${wordList}

For each noun, write a German sentence (B1 level) where the article is replaced by ___. The student must choose the correct article from 4 options. Include different cases (nominative, accusative, dative, genitive). Explain in Italian why that case is used.

IMPORTANT: Options must always include 4 articles. The correct one must be among them.`,
    experimental_output: Output.object({ schema: CaseQuizSchema }),
  });

  return (experimental_output?.exercises ?? []).map((e) => ({
    ...e,
    type: "cases" as const,
  }));
}

// --- Public API ---

export async function generateExercises(
  exerciseType: ExerciseType,
): Promise<Exercise[]> {
  const words = await getExerciseWords(10);

  if (words.length === 0) return [];

  switch (exerciseType) {
    case "fill":
      return generateFillBlank(words);
    case "dictation":
      return generateDictation(words);
    case "cases":
      return generateCaseQuiz(words);
    case "mix": {
      const [fill, dictation, cases] = await Promise.all([
        generateFillBlank(words.slice(0, 4)),
        Promise.resolve(generateDictation(words)),
        generateCaseQuiz(words),
      ]);
      // Interleave exercise types
      const all = [...fill, ...dictation.slice(0, 3), ...cases.slice(0, 3)];
      return all.sort(() => Math.random() - 0.5);
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/services/exercise-generator.ts
git commit -m "feat(exercises): add AI exercise generator with Gemini"
```

---

### Task 3: Exercise session hook

**Files:**
- Create: `src/features/exercises/hooks/use-exercise-session.ts`

- [ ] **Step 1: Create session state machine**

```typescript
// src/features/exercises/hooks/use-exercise-session.ts
import { useState, useCallback } from "react";

import type { Exercise, ExerciseResult, ExerciseType, SessionPhase } from "../types";
import { generateExercises } from "../services/exercise-generator";
import { submitReview } from "@/features/review/hooks/use-spaced-repetition";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { Word } from "@/features/dictionary/types";
import {
  hapticMedium,
  hapticSuccess,
} from "@/features/shared/hooks/use-haptics";

export function useExerciseSession(exerciseType: ExerciseType) {
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [startTime] = useState(Date.now());

  const start = useCallback(async () => {
    setPhase("loading");
    try {
      const [generated, words] = await Promise.all([
        generateExercises(exerciseType),
        getAllWords(),
      ]);
      setExercises(generated);
      setAllWords(words);
      setCurrentIndex(0);
      setResults([]);
      setPhase(generated.length > 0 ? "active" : "summary");
    } catch {
      setPhase("summary");
    }
  }, [exerciseType]);

  const submit = useCallback(
    async (userAnswer: string) => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      let correctAnswer = "";
      if (exercise.type === "fill") correctAnswer = exercise.answer;
      else if (exercise.type === "dictation") correctAnswer = exercise.sentence;
      else if (exercise.type === "cases") correctAnswer = exercise.correctArticle;

      const isCorrect =
        exercise.type === "dictation"
          ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
          : userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      const result: ExerciseResult = { exercise, userAnswer, isCorrect };
      const newResults = [...results, result];
      setResults(newResults);

      if (isCorrect) hapticSuccess();
      else hapticMedium();

      // Update review score
      const word = allWords.find(
        (w) => w.term.toLowerCase() === exercise.wordTerm.toLowerCase(),
      );
      if (word) {
        const response = isCorrect ? 2 : 0; // Good or Again
        try {
          await submitReview(word.term, word.reviewScore, response);
        } catch {
          // Continue session
        }
      }

      return result;
    },
    [exercises, currentIndex, results, allWords],
  );

  const advance = useCallback(() => {
    if (currentIndex + 1 >= exercises.length) {
      setPhase("summary");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, exercises.length]);

  const skip = useCallback(() => {
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    setResults([...results, { exercise, userAnswer: "", isCorrect: false }]);
    advance();
  }, [exercises, currentIndex, results, advance]);

  const retryErrors = useCallback(async () => {
    const errorExercises = results
      .filter((r) => !r.isCorrect)
      .map((r) => r.exercise);

    if (errorExercises.length === 0) return;

    setExercises(errorExercises);
    setCurrentIndex(0);
    setResults([]);
    setPhase("active");
  }, [results]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const errorCount = results.filter((r) => !r.isCorrect).length;
  const durationSeconds = Math.round((Date.now() - startTime) / 1000);

  return {
    phase,
    exercises,
    currentExercise: exercises[currentIndex] ?? null,
    currentIndex,
    total: exercises.length,
    results,
    correctCount,
    errorCount,
    durationSeconds,
    start,
    submit,
    advance,
    skip,
    retryErrors,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/hooks/
git commit -m "feat(exercises): add exercise session hook"
```

---

### Task 4: Exercise UI components — progress bar + feedback

**Files:**
- Create: `src/features/exercises/components/exercise-progress.tsx`
- Create: `src/features/exercises/components/exercise-feedback.tsx`

- [ ] **Step 1: Create progress bar (dot-based)**

```typescript
// src/features/exercises/components/exercise-progress.tsx
import { View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ExerciseProgressProps {
  total: number;
  current: number;
  results: Array<{ isCorrect: boolean }>;
}

export function ExerciseProgress({
  total,
  current,
  results,
}: ExerciseProgressProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        paddingVertical: 12,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < results.length;
        const isCurrent = i === current;
        const isCorrect = results[i]?.isCorrect;

        let bg = colors.borderLight;
        if (isCompleted) bg = isCorrect ? "#4A9A4A" : "#C05050";
        if (isCurrent) bg = colors.accent;

        return (
          <View
            key={i}
            style={{
              width: isCurrent ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Create feedback banner**

```typescript
// src/features/exercises/components/exercise-feedback.tsx
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  hint?: string;
  onContinue: () => void;
}

export function ExerciseFeedback({
  isCorrect,
  correctAnswer,
  hint,
  onContinue,
}: ExerciseFeedbackProps) {
  const { colors, textStyles } = useAppTheme();

  const bgColor = isCorrect ? "#1A3A1A" : "#3A1A1A";
  const accentColor = isCorrect ? "#4A9A4A" : "#C05050";
  const icon = isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill";

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={{
        backgroundColor: bgColor,
        padding: 20,
        gap: 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderCurve: "continuous",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Image
          source={`sf:${icon}`}
          style={{ width: 24, height: 24 }}
          tintColor={accentColor}
        />
        <Text
          style={[
            textStyles.heading,
            { fontSize: 18, color: accentColor },
          ]}
        >
          {isCorrect ? "Corretto!" : "Sbagliato"}
        </Text>
      </View>

      {!isCorrect && (
        <Text style={{ fontFamily: textStyles.body.fontFamily, fontSize: 14, color: "#E8E2D8" }}>
          Risposta corretta: <Text style={{ fontWeight: "700" }}>{correctAnswer}</Text>
        </Text>
      )}

      {hint && (
        <Text
          style={{
            fontFamily: textStyles.bodyLight.fontFamily,
            fontSize: 13,
            color: "#B8AFA5",
            fontStyle: "italic",
          }}
        >
          {hint}
        </Text>
      )}

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => ({
          backgroundColor: accentColor,
          borderRadius: 12,
          borderCurve: "continuous",
          paddingVertical: 14,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
          marginTop: 4,
        })}
      >
        <Text
          style={[
            textStyles.heading,
            { fontSize: 15, color: "#FFFFFF" },
          ]}
        >
          Continua
        </Text>
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

- [ ] **Step 4: Commit**

```bash
git add src/features/exercises/components/exercise-progress.tsx src/features/exercises/components/exercise-feedback.tsx
git commit -m "feat(exercises): add progress bar and feedback components"
```

---

### Task 5: Exercise type components — Fill-in-the-blank

**Files:**
- Create: `src/features/exercises/components/fill-blank-exercise.tsx`

- [ ] **Step 1: Create fill-in-the-blank component**

```typescript
// src/features/exercises/components/fill-blank-exercise.tsx
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { FillBlankExercise } from "../types";

interface FillBlankProps {
  exercise: FillBlankExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export function FillBlankView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: FillBlankProps) {
  const { colors, textStyles } = useAppTheme();
  const [answer, setAnswer] = useState("");

  const parts = exercise.sentence.split("___");

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{ flex: 1, gap: 24, padding: 24 }}
    >
      {/* Sentence with blank */}
      <View style={{ gap: 8 }}>
        <Text
          style={[
            textStyles.heading,
            { fontSize: 20, lineHeight: 30 },
          ]}
        >
          {parts[0]}
          <Text style={{ color: colors.accent }}>{"____"}</Text>
          {parts[1]}
        </Text>
        <Text
          style={[
            textStyles.bodyLight,
            { fontSize: 14, color: colors.textMuted },
          ]}
        >
          {exercise.translation}
        </Text>
      </View>

      {/* Input */}
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Scrivi la parola..."
        placeholderTextColor={colors.textGhost}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        onSubmitEditing={() => answer.trim() && onSubmit(answer)}
        style={{
          fontFamily: textStyles.heading.fontFamily,
          fontSize: 18,
          color: colors.textPrimary,
          backgroundColor: colors.card,
          borderRadius: 14,
          borderCurve: "continuous",
          padding: 16,
          borderWidth: 2,
          borderColor: colors.border,
        }}
      />

      {/* Hint */}
      {exercise.hint && (
        <Text
          style={{
            fontFamily: textStyles.bodyLight.fontFamily,
            fontSize: 12,
            color: colors.textHint,
            fontStyle: "italic",
          }}
        >
          💡 {exercise.hint}
        </Text>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          style={{
            backgroundColor: colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: colors.textSecondary }]}>
            Salta
          </Text>
        </Pressable>
        <Pressable
          onPress={() => answer.trim() && onSubmit(answer)}
          disabled={disabled || !answer.trim()}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: answer.trim() ? colors.accent : colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: answer.trim() ? "#FFFFFF" : colors.textMuted }]}>
            Verifica
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/components/fill-blank-exercise.tsx
git commit -m "feat(exercises): add fill-in-the-blank component"
```

---

### Task 6: Exercise type components — Dictation

**Files:**
- Create: `src/features/exercises/components/dictation-exercise.tsx`

- [ ] **Step 1: Create dictation component with TTS**

```typescript
// src/features/exercises/components/dictation-exercise.tsx
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useSpeech } from "@/features/shared/hooks/use-speech";
import type { DictationExercise } from "../types";

interface DictationProps {
  exercise: DictationExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export function DictationView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: DictationProps) {
  const { colors, textStyles } = useAppTheme();
  const { speak, isSpeaking } = useSpeech();
  const [answer, setAnswer] = useState("");

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{ flex: 1, gap: 24, padding: 24 }}
    >
      {/* Play button */}
      <View style={{ alignItems: "center", gap: 16 }}>
        <Pressable
          onPress={() => speak(exercise.sentence)}
          style={({ pressed }) => ({
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.accentLight,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Image
            source={isSpeaking ? "sf:speaker.wave.3.fill" : "sf:speaker.wave.2.fill"}
            style={{ width: 32, height: 32 }}
            tintColor={colors.accent}
          />
        </Pressable>
        <Text
          style={[
            textStyles.bodyLight,
            { fontSize: 14, color: colors.textMuted },
          ]}
        >
          {isSpeaking ? "In ascolto..." : "Tocca per ascoltare"}
        </Text>
      </View>

      {/* Input */}
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Scrivi quello che senti..."
        placeholderTextColor={colors.textGhost}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        onSubmitEditing={() => answer.trim() && onSubmit(answer)}
        multiline
        style={{
          fontFamily: textStyles.heading.fontFamily,
          fontSize: 18,
          color: colors.textPrimary,
          backgroundColor: colors.card,
          borderRadius: 14,
          borderCurve: "continuous",
          padding: 16,
          minHeight: 80,
          borderWidth: 2,
          borderColor: colors.border,
          textAlignVertical: "top",
        }}
      />

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          style={{
            backgroundColor: colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: colors.textSecondary }]}>
            Salta
          </Text>
        </Pressable>
        <Pressable
          onPress={() => answer.trim() && onSubmit(answer)}
          disabled={disabled || !answer.trim()}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: answer.trim() ? colors.accent : colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: answer.trim() ? "#FFFFFF" : colors.textMuted }]}>
            Verifica
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/components/dictation-exercise.tsx
git commit -m "feat(exercises): add dictation component with TTS"
```

---

### Task 7: Exercise type components — Case quiz

**Files:**
- Create: `src/features/exercises/components/case-quiz-exercise.tsx`

- [ ] **Step 1: Create case quiz with pill selection**

```typescript
// src/features/exercises/components/case-quiz-exercise.tsx
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { CaseQuizExercise } from "../types";

const CASE_COLORS: Record<string, { bg: string; text: string }> = {
  nom: { bg: "nomBg", text: "nomText" },
  akk: { bg: "akkBg", text: "akkText" },
  dat: { bg: "datBg", text: "datText" },
  gen: { bg: "genBg", text: "genText" },
};

interface CaseQuizProps {
  exercise: CaseQuizExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export function CaseQuizView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: CaseQuizProps) {
  const { colors, textStyles } = useAppTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const caseColor = CASE_COLORS[exercise.caseType] ?? CASE_COLORS.nom;
  const caseBg = colors[caseColor.bg as keyof typeof colors];
  const caseText = colors[caseColor.text as keyof typeof colors];

  const parts = exercise.sentence.split("___");

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{ flex: 1, gap: 24, padding: 24 }}
    >
      {/* Case badge */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: caseBg,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 8,
            borderCurve: "continuous",
          }}
        >
          <Text
            style={{
              fontFamily: textStyles.mono.fontFamily,
              fontSize: 12,
              fontWeight: "600",
              color: caseText,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {exercise.caseType}
          </Text>
        </View>
      </View>

      {/* Sentence with blank */}
      <View style={{ gap: 8 }}>
        <Text style={[textStyles.heading, { fontSize: 20, lineHeight: 30 }]}>
          {parts[0]}
          <Text style={{ color: colors.accent }}>
            {selected ?? "____"}
          </Text>
          {parts[1]}
        </Text>
        <Text
          style={[
            textStyles.bodyLight,
            { fontSize: 14, color: colors.textMuted },
          ]}
        >
          {exercise.translation}
        </Text>
      </View>

      {/* Article pills */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {exercise.options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => !disabled && setSelected(option)}
              style={({ pressed }) => ({
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderRadius: 12,
                borderCurve: "continuous",
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderWidth: 2,
                borderColor: isSelected ? colors.accent : colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={[
                  textStyles.heading,
                  {
                    fontSize: 16,
                    color: isSelected ? "#FFFFFF" : colors.textPrimary,
                  },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          style={{
            backgroundColor: colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: colors.textSecondary }]}>
            Salta
          </Text>
        </Pressable>
        <Pressable
          onPress={() => selected && onSubmit(selected)}
          disabled={disabled || !selected}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: selected ? colors.accent : colors.borderLight,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[textStyles.heading, { fontSize: 14, color: selected ? "#FFFFFF" : colors.textMuted }]}>
            Verifica
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/components/case-quiz-exercise.tsx
git commit -m "feat(exercises): add case quiz component with pill selection"
```

---

### Task 8: Exercise summary component

**Files:**
- Create: `src/features/exercises/components/exercise-summary.tsx`

- [ ] **Step 1: Create summary screen with score and stats**

```typescript
// src/features/exercises/components/exercise-summary.tsx
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ExerciseResult } from "../types";

interface ExerciseSummaryProps {
  results: ExerciseResult[];
  correctCount: number;
  errorCount: number;
  durationSeconds: number;
  onRetryErrors: () => void;
  onClose: () => void;
}

export function ExerciseSummary({
  results,
  correctCount,
  errorCount,
  durationSeconds,
  onRetryErrors,
  onClose,
}: ExerciseSummaryProps) {
  const { colors, textStyles } = useAppTheme();

  const total = results.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  const errorWords = results
    .filter((r) => !r.isCorrect)
    .map((r) => r.exercise.wordTerm);
  const uniqueErrorWords = [...new Set(errorWords)];

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      style={{ flex: 1, padding: 24, gap: 24, justifyContent: "center" }}
    >
      {/* Score */}
      <View style={{ alignItems: "center", gap: 8 }}>
        <Text
          style={{
            fontFamily: textStyles.heading.fontFamily,
            fontSize: 56,
            fontWeight: "700",
            color: percent >= 70 ? "#4A9A4A" : colors.accent,
          }}
        >
          {percent}%
        </Text>
        <Text style={[textStyles.bodyLight, { fontSize: 14, color: colors.textMuted }]}>
          {correctCount} corrette su {total}
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderCurve: "continuous", padding: 16, alignItems: "center", gap: 4 }}>
          <Image source="sf:checkmark.circle.fill" style={{ width: 20, height: 20 }} tintColor="#4A9A4A" />
          <Text style={[textStyles.heading, { fontSize: 18, color: "#4A9A4A" }]}>{correctCount}</Text>
          <Text style={[textStyles.mono, { color: colors.textHint }]}>Corrette</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderCurve: "continuous", padding: 16, alignItems: "center", gap: 4 }}>
          <Image source="sf:xmark.circle.fill" style={{ width: 20, height: 20 }} tintColor="#C05050" />
          <Text style={[textStyles.heading, { fontSize: 18, color: "#C05050" }]}>{errorCount}</Text>
          <Text style={[textStyles.mono, { color: colors.textHint }]}>Errori</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderCurve: "continuous", padding: 16, alignItems: "center", gap: 4 }}>
          <Image source="sf:clock.fill" style={{ width: 20, height: 20 }} tintColor={colors.accent} />
          <Text style={[textStyles.heading, { fontSize: 18 }]}>{minutes}:{String(seconds).padStart(2, "0")}</Text>
          <Text style={[textStyles.mono, { color: colors.textHint }]}>Tempo</Text>
        </View>
      </View>

      {/* Error words chips */}
      {uniqueErrorWords.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[textStyles.mono, { textTransform: "uppercase", letterSpacing: 1.5, color: colors.textGhost }]}>
            Da ripassare
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {uniqueErrorWords.map((term) => (
              <View
                key={term}
                style={{
                  backgroundColor: colors.accentLight,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={[textStyles.heading, { fontSize: 13, color: colors.accent }]}>
                  {term}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 8 }}>
        {errorCount > 0 && (
          <Pressable
            onPress={onRetryErrors}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[textStyles.heading, { fontSize: 15, color: "#FFFFFF" }]}>
              Ripeti gli errori
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[textStyles.heading, { fontSize: 15 }]}>
            Torna al ripasso
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

- [ ] **Step 3: Commit**

```bash
git add src/features/exercises/components/exercise-summary.tsx
git commit -m "feat(exercises): add session summary component"
```

---

### Task 9: Exercise hub screen

**Files:**
- Create: `src/features/exercises/components/exercise-hub.tsx`
- Create: `src/app/(review)/exercises.tsx`
- Modify: `src/app/(review)/_layout.tsx`
- Modify: `src/app/(review)/index.tsx`

- [ ] **Step 1: Create exercise hub component**

```typescript
// src/features/exercises/components/exercise-hub.tsx
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ExerciseType } from "../types";

interface ExerciseOption {
  type: ExerciseType;
  title: string;
  description: string;
  icon: string;
}

const EXERCISES: ExerciseOption[] = [
  {
    type: "fill",
    title: "Completa",
    description: "Riempi lo spazio vuoto con la parola corretta",
    icon: "text.cursor",
  },
  {
    type: "dictation",
    title: "Dettato",
    description: "Ascolta e scrivi la frase in tedesco",
    icon: "ear.fill",
  },
  {
    type: "cases",
    title: "Articoli & Casi",
    description: "Scegli l'articolo corretto per ogni caso",
    icon: "textformat.abc",
  },
];

const MIX_OPTION: ExerciseOption = {
  type: "mix",
  title: "Mix intelligente",
  description: "L'AI sceglie l'esercizio migliore per ogni parola",
  icon: "sparkles",
};

interface ExerciseHubProps {
  onSelect: (type: ExerciseType) => void;
}

export function ExerciseHub({ onSelect }: ExerciseHubProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      {EXERCISES.map((ex, index) => (
        <Animated.View
          key={ex.type}
          entering={FadeInUp.delay(index * 60).duration(300)}
        >
          <Pressable
            onPress={() => onSelect(ex.type)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                borderCurve: "continuous",
                backgroundColor: colors.accentLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={`sf:${ex.icon}`}
                style={{ width: 22, height: 22 }}
                tintColor={colors.accent}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[textStyles.heading, { fontSize: 15 }]}>
                {ex.title}
              </Text>
              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 12, color: colors.textMuted },
                ]}
              >
                {ex.description}
              </Text>
            </View>
            <Image
              source="sf:chevron.right"
              style={{ width: 12, height: 12 }}
              tintColor={colors.textGhost}
            />
          </Pressable>
        </Animated.View>
      ))}

      {/* Mix AI option */}
      <Animated.View entering={FadeInUp.delay(EXERCISES.length * 60).duration(300)}>
        <Pressable
          onPress={() => onSelect("mix")}
          style={({ pressed }) => ({
            backgroundColor: colors.accentLight,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              borderCurve: "continuous",
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source="sf:sparkles"
              style={{ width: 22, height: 22 }}
              tintColor="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[textStyles.heading, { fontSize: 15 }]}>
              {MIX_OPTION.title}
            </Text>
            <Text
              style={[
                textStyles.bodyLight,
                { fontSize: 12, color: colors.textSecondary },
              ]}
            >
              {MIX_OPTION.description}
            </Text>
          </View>
          <Image
            source="sf:chevron.right"
            style={{ width: 12, height: 12 }}
            tintColor={colors.accent}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 2: Create exercises route**

```typescript
// src/app/(review)/exercises.tsx
import { Stack, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { ExerciseHub } from "@/features/exercises/components/exercise-hub";
import type { ExerciseType } from "@/features/exercises/types";

export default function ExercisesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const handleSelect = (type: ExerciseType) => {
    router.push({
      pathname: "/(review)/exercise-session",
      params: { exerciseType: type },
    });
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 24, gap: 16 }}
        style={{ backgroundColor: colors.bg }}
      >
        <ExerciseHub onSelect={handleSelect} />
      </ScrollView>
      <Stack.Screen options={{ title: "Esercizi" }} />
    </>
  );
}
```

- [ ] **Step 3: Add routes to layout and toolbar to dashboard**

Modify `src/app/(review)/_layout.tsx` — add `exercises` and `exercise-session` screens:

```typescript
// Add after existing Stack.Screen entries:
<Stack.Screen name="exercises" />
<Stack.Screen
  name="exercise-session"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [1.0],
  }}
/>
```

Modify `src/app/(review)/index.tsx` — add exercises toolbar button:

```typescript
// Add inside <Stack.Toolbar placement="right">:
<Stack.Toolbar.Button
  icon="pencil.and.list.clipboard"
  onPress={() => router.push("/(review)/exercises")}
/>
```

- [ ] **Step 4: Verify TypeScript compiles**

- [ ] **Step 5: Commit**

```bash
git add src/features/exercises/components/exercise-hub.tsx src/app/(review)/exercises.tsx src/app/(review)/_layout.tsx src/app/(review)/index.tsx
git commit -m "feat(exercises): add exercise hub screen and navigation"
```

---

### Task 10: Exercise session screen (orchestrator)

**Files:**
- Create: `src/app/(review)/exercise-session.tsx`

- [ ] **Step 1: Create session screen that orchestrates all exercise types**

```typescript
// src/app/(review)/exercise-session.tsx
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useExerciseSession } from "@/features/exercises/hooks/use-exercise-session";
import type { ExerciseType, ExerciseResult } from "@/features/exercises/types";
import { ExerciseProgress } from "@/features/exercises/components/exercise-progress";
import { ExerciseFeedback } from "@/features/exercises/components/exercise-feedback";
import { ExerciseSummary } from "@/features/exercises/components/exercise-summary";
import { FillBlankView } from "@/features/exercises/components/fill-blank-exercise";
import { DictationView } from "@/features/exercises/components/dictation-exercise";
import { CaseQuizView } from "@/features/exercises/components/case-quiz-exercise";

const TITLES: Record<ExerciseType, string> = {
  fill: "Completa",
  dictation: "Dettato",
  cases: "Articoli & Casi",
  mix: "Mix intelligente",
};

export default function ExerciseSessionScreen() {
  const { exerciseType } = useLocalSearchParams<{ exerciseType: ExerciseType }>();
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const type = (exerciseType ?? "fill") as ExerciseType;

  const session = useExerciseSession(type);
  const [feedback, setFeedback] = useState<ExerciseResult | null>(null);

  useEffect(() => {
    session.start();
  }, []);

  const handleSubmit = async (answer: string) => {
    const result = await session.submit(answer);
    if (result) setFeedback(result);
  };

  const handleContinue = () => {
    setFeedback(null);
    session.advance();
  };

  const handleSkip = () => {
    setFeedback(null);
    session.skip();
  };

  // Loading
  if (session.phase === "loading") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[textStyles.bodyLight, { color: colors.textMuted }]}>
          Generazione esercizi...
        </Text>
        <Stack.Screen options={{ title: TITLES[type] }} />
      </View>
    );
  }

  // Summary
  if (session.phase === "summary") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ExerciseSummary
          results={session.results}
          correctCount={session.correctCount}
          errorCount={session.errorCount}
          durationSeconds={session.durationSeconds}
          onRetryErrors={session.retryErrors}
          onClose={() => router.back()}
        />
        <Stack.Screen options={{ title: "Risultati" }} />
      </View>
    );
  }

  // Active exercise
  const exercise = session.currentExercise;
  if (!exercise) return null;

  const correctAnswer =
    exercise.type === "fill"
      ? exercise.answer
      : exercise.type === "cases"
        ? exercise.correctArticle
        : exercise.sentence;

  const hint =
    exercise.type === "fill"
      ? exercise.hint
      : exercise.type === "cases"
        ? exercise.explanation
        : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ExerciseProgress
        total={session.total}
        current={session.currentIndex}
        results={session.results}
      />

      {exercise.type === "fill" && (
        <FillBlankView
          exercise={exercise}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          disabled={!!feedback}
        />
      )}
      {exercise.type === "dictation" && (
        <DictationView
          exercise={exercise}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          disabled={!!feedback}
        />
      )}
      {exercise.type === "cases" && (
        <CaseQuizView
          exercise={exercise}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          disabled={!!feedback}
        />
      )}

      {feedback && (
        <ExerciseFeedback
          isCorrect={feedback.isCorrect}
          correctAnswer={correctAnswer}
          hint={hint}
          onContinue={handleContinue}
        />
      )}

      <Stack.Screen options={{ title: TITLES[type] }} />
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Test manually**

1. Open app → Ripasso tab → toolbar exercises button
2. Select "Completa" → verify loading, then exercise appears
3. Type answer → verify feedback banner
4. Complete session → verify summary with score

- [ ] **Step 4: Commit**

```bash
git add src/app/(review)/exercise-session.tsx
git commit -m "feat(exercises): add exercise session screen"
```
