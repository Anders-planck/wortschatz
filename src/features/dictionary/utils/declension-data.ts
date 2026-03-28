export interface DeclensionRow {
  singular?: string;
  plural?: string;
}

export interface DeclensionForms {
  nominativ?: DeclensionRow;
  akkusativ?: DeclensionRow;
  dativ?: DeclensionRow;
  genitiv?: DeclensionRow;
}

export const CASE_CONFIG = [
  {
    key: "nom",
    full: "nominativ" as const,
    label: "Nominativ",
    abbr: "NOM",
    bgKey: "nomBg" as const,
    textKey: "nomText" as const,
  },
  {
    key: "akk",
    full: "akkusativ" as const,
    label: "Akkusativ",
    abbr: "AKK",
    bgKey: "akkBg" as const,
    textKey: "akkText" as const,
  },
  {
    key: "dat",
    full: "dativ" as const,
    label: "Dativ",
    abbr: "DAT",
    bgKey: "datBg" as const,
    textKey: "datText" as const,
  },
  {
    key: "gen",
    full: "genitiv" as const,
    label: "Genitiv",
    abbr: "GEN",
    bgKey: "genBg" as const,
    textKey: "genText" as const,
  },
] as const;

interface ArticleDeclension {
  label: string;
  cases: {
    key: string;
    label: string;
    singular: string;
    plural: string;
  }[];
}

const DEFINITE_ARTICLES: Record<string, Record<string, string>> = {
  der: { nom: "der", akk: "den", dat: "dem", gen: "des" },
  die: { nom: "die", akk: "die", dat: "der", gen: "der" },
  das: { nom: "das", akk: "das", dat: "dem", gen: "des" },
};

const INDEFINITE_ARTICLES: Record<string, Record<string, string>> = {
  der: { nom: "ein", akk: "einen", dat: "einem", gen: "eines" },
  die: { nom: "eine", akk: "eine", dat: "einer", gen: "einer" },
  das: { nom: "ein", akk: "ein", dat: "einem", gen: "eines" },
};

const PLURAL_DEFINITE: Record<string, string> = {
  nom: "die",
  akk: "die",
  dat: "den",
  gen: "der",
};

function extractNoun(form: string): string {
  const parts = form.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
}

/**
 * Generate standard declension forms from gender + noun + plural.
 * Used as fallback when AI hasn't provided structured declension data.
 * Handles regular noun endings (adds -(e)s for genitive masc/neut, -(e)n for dativ plural).
 */
function generateFallbackForms(
  gender: string,
  term: string,
  plural: string | null,
): DeclensionForms {
  const needsGenS = gender === "der" || gender === "das";
  const genSuffix = needsGenS ? (term.match(/[sxzß]$/) ? "es" : "s") : "";
  const genSingular = genSuffix ? `${term}${genSuffix}` : term;

  const datPlural = plural
    ? plural.endsWith("n") || plural.endsWith("s")
      ? plural
      : `${plural}n`
    : null;

  return {
    nominativ: {
      singular: term,
      plural: plural ?? undefined,
    },
    akkusativ: {
      singular: term,
      plural: plural ?? undefined,
    },
    dativ: {
      singular: term,
      plural: datPlural ?? undefined,
    },
    genitiv: {
      singular: genSingular,
      plural: plural ?? undefined,
    },
  };
}

export function buildDeclensionCards(
  gender: string,
  forms: DeclensionForms | null,
  term?: string,
  plural?: string | null,
): { definite: ArticleDeclension; indefinite: ArticleDeclension } {
  const resolvedForms =
    forms && (forms.nominativ || forms.akkusativ)
      ? forms
      : term
        ? generateFallbackForms(gender, term, plural ?? null)
        : {
            nominativ: undefined,
            akkusativ: undefined,
            dativ: undefined,
            genitiv: undefined,
          };
  const defArticles = DEFINITE_ARTICLES[gender] ?? DEFINITE_ARTICLES.der;
  const indefArticles = INDEFINITE_ARTICLES[gender] ?? INDEFINITE_ARTICLES.der;

  const definiteCases = CASE_CONFIG.map(({ key, full, label }) => {
    const row = resolvedForms[full as keyof DeclensionForms];
    const singNoun = row?.singular ? extractNoun(row.singular) : "—";
    const plurNoun = row?.plural ? extractNoun(row.plural) : "—";

    return {
      key,
      label,
      singular: `${defArticles[key]} ${singNoun}`,
      plural: `${PLURAL_DEFINITE[key]} ${plurNoun}`,
    };
  });

  const indefiniteCases = CASE_CONFIG.map(({ key, full, label }) => {
    const row = resolvedForms[full as keyof DeclensionForms];
    const singNoun = row?.singular ? extractNoun(row.singular) : "—";

    return {
      key,
      label,
      singular: `${indefArticles[key]} ${singNoun}`,
      plural: "—",
    };
  });

  return {
    definite: { label: "Bestimmter Artikel", cases: definiteCases },
    indefinite: { label: "Unbestimmter Artikel", cases: indefiniteCases },
  };
}

export type { ArticleDeclension };
