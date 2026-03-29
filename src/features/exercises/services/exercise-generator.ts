import { generateText, Output } from "ai";
import { z } from "zod";
import { google } from "@/features/shared/config/ai-provider";
import { trackAiCall } from "@/features/shared/services/ai-usage-tracker";
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
      explanation: z.string().describe("Why this case is used, in Italian"),
      wordTerm: z.string(),
    }),
  ),
});

async function generateFillBlank(words: Word[]): Promise<FillBlankExercise[]> {
  const wordList = words
    .map((w) => `${w.term} (${w.translations[0] ?? ""})`)
    .join(", ");

  const result = await trackAiCall("exercises", () =>
    generateText({
      model: google("gemini-2.5-flash-lite"),
      output: Output.object({ schema: FillBlankSchema }),
      prompt: `Sei un insegnante di tedesco per studenti italiani di livello B1.

PAROLE DELL'UTENTE (usa SOLO queste): ${wordList}

REGOLE OBBLIGATORIE:
- Crea UN esercizio per OGNI parola della lista sopra.
- Ogni frase DEVE contenere esattamente una delle parole fornite, sostituita con ___.
- Il campo "wordTerm" DEVE essere ESATTAMENTE una delle parole della lista (copia-incolla esatto).
- NON inventare parole nuove. NON usare parole che non sono nella lista.
- La frase deve essere di livello B1, naturale e utile nella vita quotidiana.
- Fornisci la traduzione italiana della frase completa e un suggerimento grammaticale in italiano.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate fill-blank exercises");
  }

  const validTerms = new Set(words.map((w) => w.term.toLowerCase()));
  return result.output.exercises
    .filter((ex) => validTerms.has(ex.wordTerm.toLowerCase()))
    .map((ex) => ({
      type: "fill" as const,
      sentence: ex.sentence,
      answer: ex.answer,
      translation: ex.translation,
      hint: ex.hint,
      wordTerm: ex.wordTerm,
    }));
}

function generateDictation(words: Word[]): DictationExercise[] {
  const wordsWithExamples = getWordsWithExamples(words);

  return wordsWithExamples.slice(0, 10).map((word) => {
    const example = word.examples![0];
    return {
      type: "dictation" as const,
      sentence: example.sentence,
      translation: example.translation,
      wordTerm: word.term,
    };
  });
}

async function generateCaseQuiz(words: Word[]): Promise<CaseQuizExercise[]> {
  const nouns = getNounsWithGender(words);

  if (nouns.length === 0) return [];

  const wordList = nouns
    .map((w) => `${w.gender} ${w.term} (${w.translations[0] ?? ""})`)
    .join(", ");

  const result = await trackAiCall("exercises", () =>
    generateText({
      model: google("gemini-2.5-flash-lite"),
      output: Output.object({ schema: CaseQuizSchema }),
      prompt: `Sei un insegnante di tedesco per studenti italiani di livello B1.

SOSTANTIVI DELL'UTENTE (usa SOLO questi): ${wordList}

REGOLE OBBLIGATORIE:
- Crea UN esercizio per OGNI sostantivo della lista sopra.
- Ogni frase DEVE contenere esattamente uno dei sostantivi forniti.
- Il campo "wordTerm" DEVE essere ESATTAMENTE uno dei sostantivi della lista (copia-incolla esatto, senza articolo).
- NON inventare sostantivi nuovi. NON usare parole che non sono nella lista.
- Nella frase, metti ___ dove va l'articolo declinato.
- Fornisci 4 opzioni di articolo (solo una corretta), il caso grammaticale usato.
- Fornisci la traduzione italiana della frase e una spiegazione in italiano del perché si usa quel caso.`,
    }),
  );

  if (!result.output) {
    throw new Error("AI failed to generate case quiz exercises");
  }

  const validTerms = new Set(nouns.map((w) => w.term.toLowerCase()));
  return result.output.exercises
    .filter((ex) => validTerms.has(ex.wordTerm.toLowerCase()))
    .map((ex) => ({
      type: "cases" as const,
      sentence: ex.sentence,
      correctArticle: ex.correctArticle,
      options: ex.options,
      caseType: ex.caseType,
      translation: ex.translation,
      explanation: ex.explanation,
      wordTerm: ex.wordTerm,
    }));
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function generateExercises(
  exerciseType: ExerciseType,
): Promise<Exercise[]> {
  const words = await getExerciseWords(10);

  if (exerciseType === "fill") {
    return generateFillBlank(words);
  }

  if (exerciseType === "dictation") {
    return generateDictation(words);
  }

  if (exerciseType === "cases") {
    return generateCaseQuiz(words);
  }

  // "mix": run all 3 in parallel and interleave
  const [fillExercises, dictationExercises, caseExercises] = await Promise.all([
    generateFillBlank(words.slice(0, 4)),
    Promise.resolve(generateDictation(words)),
    generateCaseQuiz(words),
  ]);

  const interleaved: Exercise[] = [];
  const maxLen = Math.max(
    fillExercises.length,
    dictationExercises.length,
    caseExercises.length,
  );

  for (let i = 0; i < maxLen; i++) {
    if (i < fillExercises.length) interleaved.push(fillExercises[i]);
    if (i < dictationExercises.length) interleaved.push(dictationExercises[i]);
    if (i < caseExercises.length) interleaved.push(caseExercises[i]);
  }

  return shuffleArray(interleaved);
}
