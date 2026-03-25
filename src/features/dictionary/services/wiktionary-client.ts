import type { Word } from "@/features/dictionary/types";

const BASE_URL = "https://de.wiktionary.org/api/rest_v1";

interface WiktionarySummary {
  title: string;
  extract: string;
  extract_html: string;
  description?: string;
  thumbnail?: { source: string };
}

function detectWordType(extract: string): Word["type"] {
  const lower = extract.toLowerCase();

  if (/\bsubstantiv\b/.test(lower) || /\bnomen\b/.test(lower)) return "noun";
  if (/\bverb\b/.test(lower)) return "verb";
  if (/\bpräposition\b/.test(lower) || /\bpreposition\b/.test(lower))
    return "preposition";
  if (/\badjektiv\b/.test(lower)) return "adjective";
  if (/\badverb\b/.test(lower)) return "adverb";

  return "noun";
}

function detectGender(extract: string): Word["gender"] {
  // Look for article patterns in the extract
  const genderPatterns: Array<{
    pattern: RegExp;
    gender: NonNullable<Word["gender"]>;
  }> = [
    { pattern: /\bder\s+\w+/i, gender: "der" },
    { pattern: /\bdie\s+\w+/i, gender: "die" },
    { pattern: /\bdas\s+\w+/i, gender: "das" },
    { pattern: /\bmaskulinum\b/i, gender: "der" },
    { pattern: /\bfemininum\b/i, gender: "die" },
    { pattern: /\bneutrum\b/i, gender: "das" },
    { pattern: /\bmännlich\b/i, gender: "der" },
    { pattern: /\bweiblich\b/i, gender: "die" },
    { pattern: /\bsächlich\b/i, gender: "das" },
    { pattern: /\bGenus:\s*m\b/i, gender: "der" },
    { pattern: /\bGenus:\s*f\b/i, gender: "die" },
    { pattern: /\bGenus:\s*n\b/i, gender: "das" },
  ];

  for (const { pattern, gender } of genderPatterns) {
    if (pattern.test(extract)) return gender;
  }

  return null;
}

function detectPlural(extract: string): string | null {
  // Common patterns: "Plural: Häuser", "Plural 1: ...", "Mehrzahl: ..."
  const pluralMatch =
    extract.match(/Plural(?:\s*\d)?:\s*([^\n,;]+)/i) ??
    extract.match(/Mehrzahl:\s*([^\n,;]+)/i);

  if (pluralMatch?.[1]) {
    const plural = pluralMatch[1].trim();
    // Skip if it says "kein Plural" (no plural)
    if (/kein\s+plural/i.test(plural)) return null;
    return plural;
  }

  return null;
}

export async function fetchFromWiktionary(
  term: string,
): Promise<Partial<Word> | null> {
  try {
    const encoded = encodeURIComponent(term);
    const response = await fetch(`${BASE_URL}/page/summary/${encoded}`);

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new Error(`Wiktionary API error: ${response.status}`);
    }

    const data = (await response.json()) as WiktionarySummary;
    const extract = data.extract ?? "";
    const wordType = detectWordType(extract);

    return {
      term: data.title ?? term,
      type: wordType,
      gender: wordType === "noun" ? detectGender(extract) : null,
      plural: wordType === "noun" ? detectPlural(extract) : null,
      translations: [],
      rawWiktionary: data as unknown as Record<string, unknown>,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Wiktionary API")) {
      throw err;
    }
    // Network error (timeout, DNS, etc.) — differentiate from "not found"
    throw new Error("Network error: could not reach Wiktionary");
  }
}
