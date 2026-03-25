import { Pressable, Text, View } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";
import { hapticLight } from "@/features/shared/hooks/use-haptics";

type WordFilter = "noun" | "verb" | "preposition" | undefined;

interface FilterChipsProps {
  filter: WordFilter;
  setFilter: (filter: WordFilter) => void;
  totalCount: number;
}

const CHIPS: { label: string; value: WordFilter }[] = [
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
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
        paddingBottom: 12,
      }}
    >
      {CHIPS.map((chip) => {
        const isActive = chip.value === filter;
        const label =
          chip.value === undefined ? `All (${totalCount})` : chip.label;

        return (
          <Pressable
            key={chip.label}
            onPress={() => {
              hapticLight();
              setFilter(chip.value);
            }}
            style={{
              backgroundColor: isActive ? colors.textPrimary : "#F5F2EC",
              borderRadius: 4,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text
              style={[
                textStyles.mono,
                {
                  fontSize: 10,
                  color: isActive ? colors.card : colors.textTertiary,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
