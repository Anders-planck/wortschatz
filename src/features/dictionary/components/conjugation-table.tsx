import { View, Text } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface ConjugationData {
  ich?: string;
  du?: string;
  er?: string;
  wir?: string;
  ihr?: string;
  sie?: string;
}

interface ConjugationTableProps {
  data: ConjugationData;
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

function ConjugationColumn({
  pronouns,
  data,
}: {
  pronouns: readonly { key: keyof ConjugationData; label: string }[];
  data: ConjugationData;
}) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      {pronouns.map(({ key, label }) => (
        <View
          key={key}
          style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
        >
          <Text style={[textStyles.monoLabel, { width: 52, marginBottom: 0 }]}>
            {label}
          </Text>
          <Text
            selectable
            style={[
              textStyles.bodyLight,
              { color: colors.textSecondary, flex: 1 },
            ]}
          >
            {data[key] ?? "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ConjugationTable({ data }: ConjugationTableProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <ConjugationColumn pronouns={leftPronouns} data={data} />
      <ConjugationColumn pronouns={rightPronouns} data={data} />
    </View>
  );
}
