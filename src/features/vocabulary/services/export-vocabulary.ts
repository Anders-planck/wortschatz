import { Paths, File } from "expo-file-system";
import { Share } from "react-native";
import type { Word } from "@/features/dictionary/types";
import { getAllWords } from "@/features/shared/db/words-repository";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function wordsToCSV(words: Word[]): string {
  const header = "Term,Type,Gender,Plural,Translations,Category,Score,Created";
  const rows = words.map((w) =>
    [
      escapeCSV(w.term),
      w.type,
      w.gender ?? "",
      w.plural ?? "",
      escapeCSV(w.translations.join("; ")),
      w.category ?? "",
      String(w.reviewScore),
      w.createdAt,
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function wordsToJSON(words: Word[]): string {
  const data = words.map((w) => ({
    term: w.term,
    type: w.type,
    gender: w.gender,
    plural: w.plural,
    translations: w.translations,
    category: w.category,
    reviewScore: w.reviewScore,
    createdAt: w.createdAt,
  }));
  return JSON.stringify(data, null, 2);
}

export async function exportVocabulary(format: "csv" | "json"): Promise<void> {
  const words = await getAllWords(undefined, 100_000);
  if (words.length === 0) return;

  const content = format === "csv" ? wordsToCSV(words) : wordsToJSON(words);
  const filename = `wortschatz-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);

  try {
    await Share.share({
      url: file.uri,
      title: `WortSchatz Export (${words.length} parole)`,
    });
  } finally {
    if (file.exists) file.delete();
  }
}
