import type { Word } from "@/features/dictionary/types";

export type ExerciseType = "fill" | "dictation" | "cases" | "mix";

export interface FillBlankExercise {
  type: "fill";
  sentence: string;
  answer: string;
  translation: string;
  hint: string;
  wordTerm: string;
}

export interface DictationExercise {
  type: "dictation";
  sentence: string;
  translation: string;
  wordTerm: string;
}

export interface CaseQuizExercise {
  type: "cases";
  sentence: string;
  correctArticle: string;
  options: string[];
  caseType: "nom" | "akk" | "dat" | "gen";
  translation: string;
  explanation: string;
  wordTerm: string;
}

export type Exercise = FillBlankExercise | DictationExercise | CaseQuizExercise;

export interface ExerciseResult {
  exercise: Exercise;
  userAnswer: string;
  isCorrect: boolean;
}

export type SessionPhase = "loading" | "active" | "summary";
