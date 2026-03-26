import SegmentedControl from "@react-native-segmented-control/segmented-control";
import type { WordFilter } from "@/features/dictionary/types";

interface FilterChipsProps {
  filter: WordFilter;
  setFilter: (filter: WordFilter) => void;
  totalCount: number;
}

const FILTERS: { label: string; value: WordFilter }[] = [
  { label: "All", value: undefined },
  { label: "Nouns", value: "noun" },
  { label: "Verbs", value: "verb" },
  { label: "Prep.", value: "preposition" },
];

export function FilterChips({
  filter,
  setFilter,
  totalCount,
}: FilterChipsProps) {
  const labels = FILTERS.map((f) =>
    f.value === undefined ? `All (${totalCount})` : f.label,
  );
  const selectedIndex = FILTERS.findIndex((f) => f.value === filter);

  return (
    <SegmentedControl
      values={labels}
      selectedIndex={selectedIndex === -1 ? 0 : selectedIndex}
      onChange={({ nativeEvent }) =>
        setFilter(FILTERS[nativeEvent.selectedSegmentIndex].value)
      }
      style={{ marginBottom: 8 }}
    />
  );
}
