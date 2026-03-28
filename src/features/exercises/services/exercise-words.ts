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
    candidates = candidates.filter((w) => w.examples && w.examples.length > 0);
  }

  candidates.sort((a, b) => a.reviewScore - b.reviewScore);

  return candidates.slice(0, count);
}

export function getWordsWithExamples(words: Word[]): Word[] {
  return words.filter((w) => w.examples && w.examples.length > 0);
}

export function getNounsWithGender(words: Word[]): Word[] {
  return words.filter((w) => w.type === "noun" && w.gender);
}
