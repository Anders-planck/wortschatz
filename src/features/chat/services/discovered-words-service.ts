import {
  enrichWithAI,
  lookupFromAI,
  lookupFromCache,
  lookupFromWiktionary,
} from "@/features/dictionary/services/word-lookup-service";

export interface SaveDiscoveredWordsResult {
  savedCount: number;
  skippedCount: number;
  failedTerms: string[];
  savedTerms: string[];
  skippedTerms: string[];
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

export async function saveDiscoveredWords(
  terms: string[],
): Promise<SaveDiscoveredWordsResult> {
  const uniqueTerms = new Map<string, string>();
  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const key = normalizeTerm(trimmed);
    if (!uniqueTerms.has(key)) {
      uniqueTerms.set(key, trimmed);
    }
  }

  const savedTerms: string[] = [];
  const skippedTerms: string[] = [];
  const failedTerms: string[] = [];

  for (const term of uniqueTerms.values()) {
    const cached = await lookupFromCache(term);
    if (cached) {
      skippedTerms.push(term);
      continue;
    }

    try {
      const wiktionaryWord = await lookupFromWiktionary(term, "chat").catch(
        () => null,
      );

      if (wiktionaryWord) {
        await enrichWithAI(wiktionaryWord).catch(() => wiktionaryWord);
        savedTerms.push(term);
        continue;
      }

      await lookupFromAI(term, "chat");
      savedTerms.push(term);
    } catch {
      failedTerms.push(term);
    }
  }

  return {
    savedCount: savedTerms.length,
    skippedCount: skippedTerms.length,
    failedTerms,
    savedTerms,
    skippedTerms,
  };
}
