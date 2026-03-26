import type { Word } from "@/features/dictionary/types";

export function formatWordForSharing(word: Word): string {
  const lines: string[] = [];

  const gender = word.gender ? ` (${word.gender})` : "";
  const type =
    word.type === "noun" ? "Noun" : word.type === "verb" ? "Verb" : word.type;
  lines.push(`${word.term}${gender} — ${type}`);

  if (word.plural) {
    lines.push(`pl. ${word.plural}`);
  }

  lines.push("");

  if (word.translations.length > 0) {
    lines.push(`IT: ${word.translations.join(", ")}`);
    lines.push("");
  }

  if (word.examples && word.examples.length > 0) {
    for (const ex of word.examples) {
      lines.push(`> "${ex.sentence}"`);
      lines.push(`  ${ex.translation}`);
      lines.push("");
    }
  }

  if (word.usageContext) {
    lines.push(word.usageContext);
    lines.push("");
  }

  lines.push("-- WortSchatz");

  return lines.join("\n");
}
