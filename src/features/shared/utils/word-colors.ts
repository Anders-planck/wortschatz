import type { ThemeColors } from "@/features/shared/theme/colors";
import type { Word } from "@/features/dictionary/types";

export function getWordTypeColor(
  word: Pick<Word, "type" | "gender">,
  colors: ThemeColors,
): string {
  if (word.type === "noun") {
    if (word.gender === "der") return colors.der;
    if (word.gender === "die") return colors.die;
    if (word.gender === "das") return colors.das;
    return colors.textHint;
  }
  if (word.type === "verb") return colors.verb;
  if (word.type === "preposition") return colors.prep;
  return colors.textHint;
}

export function getGenderColors(colors: ThemeColors): Record<string, string> {
  return {
    der: colors.der,
    die: colors.die,
    das: colors.das,
  };
}
