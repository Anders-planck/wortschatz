import React from "react";
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";

interface PronounData {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

interface PronounGridProps {
  data: PronounData;
  renderForm: (pronoun: string, form: string) => ReactNode;
  highlightedIndex?: number | null;
}

const leftPronouns = [
  { key: "ich" as const, label: "ich", index: 0 },
  { key: "du" as const, label: "du", index: 1 },
  { key: "er" as const, label: "er/sie/es", index: 2 },
];

const rightPronouns = [
  { key: "wir" as const, label: "wir", index: 3 },
  { key: "ihr" as const, label: "ihr", index: 4 },
  { key: "sie" as const, label: "sie/Sie", index: 5 },
];

function PronounColumn({
  pronouns,
  data,
  renderForm,
  highlightedIndex,
}: {
  pronouns: readonly { key: keyof PronounData; label: string; index: number }[];
  data: PronounData;
  renderForm: (pronoun: string, form: string) => ReactNode;
  highlightedIndex?: number | null;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ flex: 1, gap: 6 }}>
      {pronouns.map(({ key, label, index }) => {
        const form = data[key] ?? "\u2014";
        const isHighlighted = highlightedIndex === index;
        return (
          <View
            key={key}
            style={{
              flexDirection: "row",
              gap: 6,
              alignItems: "baseline",
              backgroundColor: isHighlighted
                ? `${colors.accent}1A`
                : "transparent",
              borderRadius: 4,
              borderCurve: "continuous",
              paddingVertical: isHighlighted ? 2 : 0,
              paddingHorizontal: isHighlighted ? 4 : 0,
            }}
          >
            <Text
              style={[
                textStyles.monoLabel,
                { width: 42, marginBottom: 0, flexShrink: 0 },
              ]}
            >
              {label}
            </Text>
            <View style={{ flex: 1, flexShrink: 1 }}>
              {renderForm(key, form)}
            </View>
            <SpeakerButton text={`${key} ${form}`} size="sm" />
          </View>
        );
      })}
    </View>
  );
}

export const PronounGrid = React.memo(function PronounGrid({
  data,
  renderForm,
  highlightedIndex,
}: PronounGridProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <PronounColumn
        pronouns={leftPronouns}
        data={data}
        renderForm={renderForm}
        highlightedIndex={highlightedIndex}
      />
      <PronounColumn
        pronouns={rightPronouns}
        data={data}
        renderForm={renderForm}
        highlightedIndex={highlightedIndex}
      />
    </View>
  );
});
