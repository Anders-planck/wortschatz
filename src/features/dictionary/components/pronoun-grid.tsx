import React from "react";
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { textStyles } from "@/features/shared/theme/typography";

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
}

const leftPronouns = [
  { key: "ich" as const, label: "ich" },
  { key: "du" as const, label: "du" },
  { key: "er" as const, label: "er/sie/es" },
];

const rightPronouns = [
  { key: "wir" as const, label: "wir" },
  { key: "ihr" as const, label: "ihr" },
  { key: "sie" as const, label: "sie/Sie" },
];

function PronounColumn({
  pronouns,
  data,
  renderForm,
}: {
  pronouns: readonly { key: keyof PronounData; label: string }[];
  data: PronounData;
  renderForm: (pronoun: string, form: string) => ReactNode;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      {pronouns.map(({ key, label }) => (
        <View
          key={key}
          style={{ flexDirection: "row", gap: 6, alignItems: "baseline" }}
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
            {renderForm(key, data[key] ?? "\u2014")}
          </View>
        </View>
      ))}
    </View>
  );
}

export const PronounGrid = React.memo(function PronounGrid({
  data,
  renderForm,
}: PronounGridProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <PronounColumn
        pronouns={leftPronouns}
        data={data}
        renderForm={renderForm}
      />
      <PronounColumn
        pronouns={rightPronouns}
        data={data}
        renderForm={renderForm}
      />
    </View>
  );
});
