import type { Word } from "@/features/dictionary/types";

export function formatWordForSharing(word: Word): string {
  const lines: string[] = [];

  // Header
  const gender = word.gender ? ` (${word.gender})` : "";
  lines.push(`📖 ${word.term}${gender}`);

  if (word.plural) {
    lines.push(`   pl. ${word.plural}`);
  }

  lines.push("");

  // Translations
  if (word.translations.length > 0) {
    lines.push(`🇮🇹 ${word.translations.join(", ")}`);
    lines.push("");
  }

  // Examples
  if (word.examples && word.examples.length > 0) {
    for (const ex of word.examples) {
      lines.push(`💬 „${ex.sentence}"`);
      lines.push(`   ${ex.translation}`);
      lines.push("");
    }
  }

  // Context
  if (word.usageContext) {
    lines.push(`💡 ${word.usageContext}`);
    lines.push("");
  }

  lines.push("— WortSchatz");

  return lines.join("\n");
}
