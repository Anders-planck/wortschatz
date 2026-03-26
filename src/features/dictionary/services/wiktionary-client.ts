import type { Word } from "@/features/dictionary/types";

const BASE_URL = "https://en.wiktionary.org/api/rest_v1";

interface WiktionaryDefinition {
  definition: string;
  examples?: string[];
  parsedExamples?: Array<{ example: string; translation?: string }>;
}

interface WiktionaryEntry {
  partOfSpeech: string;
  language: string;
  definitions: WiktionaryDefinition[];
}

function mapPartOfSpeech(pos: string): Word["type"] {
  const lower = pos.toLowerCase();
  if (lower === "noun" || lower === "proper noun") return "noun";
  if (lower === "verb") return "verb";
  if (lower === "preposition" || lower === "postposition") return "preposition";
  if (lower === "adjective") return "adjective";
  if (lower === "adverb") return "adverb";
  return "noun";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function fetchDefinitions(
  term: string,
): Promise<WiktionaryEntry[] | null> {
  const encoded = encodeURIComponent(term);
  const response = await fetch(`${BASE_URL}/page/definition/${encoded}`);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Wiktionary API error: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, WiktionaryEntry[]>;

  // Get German entries only
  return data.de ?? null;
}

export async function fetchFromWiktionary(
  term: string,
): Promise<Partial<Word> | null> {
  try {
    // Try multiple cases — German nouns are capitalized
    const attempts = [
      term,
      term.charAt(0).toUpperCase() + term.slice(1).toLowerCase(),
      term.toLowerCase(),
    ];

    // Deduplicate
    const uniqueAttempts = [...new Set(attempts)];

    let entries: WiktionaryEntry[] | null = null;
    let matchedTerm = term;

    for (const attempt of uniqueAttempts) {
      entries = await fetchDefinitions(attempt);
      if (entries && entries.length > 0) {
        matchedTerm = attempt;
        break;
      }
    }

    if (!entries || entries.length === 0) return null;

    const firstEntry = entries[0];
    const wordType = mapPartOfSpeech(firstEntry.partOfSpeech);

    // Extract definitions as translations (they're in English from en.wiktionary)
    const definitions = firstEntry.definitions
      .slice(0, 3)
      .map((d) => stripHtml(d.definition));

    // Extract examples
    const examples = firstEntry.definitions
      .flatMap(
        (d) =>
          d.parsedExamples?.map((e) => ({
            german: stripHtml(e.example),
            english: e.translation ? stripHtml(e.translation) : undefined,
          })) ?? [],
      )
      .slice(0, 3);

    return {
      term: matchedTerm,
      type: wordType,
      gender: null, // Wiktionary API doesn't provide gender — AI will
      plural: null, // Same — AI will provide
      translations: definitions,
      rawWiktionary: {
        entries: entries as unknown as Record<string, unknown>[],
        examples,
      } as unknown as Record<string, unknown>,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Wiktionary API")) {
      throw err;
    }
    throw new Error("Network error: could not reach Wiktionary");
  }
}
