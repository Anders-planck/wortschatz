import { View, Text } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface DeclensionData {
  nominativ?: { singular?: string; plural?: string };
  akkusativ?: { singular?: string; plural?: string };
  dativ?: { singular?: string; plural?: string };
  genitiv?: { singular?: string; plural?: string };
}

interface DeclensionTableProps {
  data: DeclensionData;
}

const cases = [
  { key: "nominativ" as const, label: "NOM" },
  { key: "akkusativ" as const, label: "AKK" },
  { key: "dativ" as const, label: "DAT" },
  { key: "genitiv" as const, label: "GEN" },
];

export function DeclensionTable({ data }: DeclensionTableProps) {
  return (
    <View style={{ gap: 6 }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ width: 36 }} />
        <Text style={[textStyles.monoLabel, { flex: 1, marginBottom: 0 }]}>
          SG
        </Text>
        <Text style={[textStyles.monoLabel, { flex: 1, marginBottom: 0 }]}>
          PL
        </Text>
      </View>
      {/* Case rows */}
      {cases.map(({ key, label }) => {
        const row = data[key];
        if (!row) return null;
        return (
          <View
            key={key}
            style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
          >
            <Text
              style={[textStyles.monoLabel, { width: 36, marginBottom: 0 }]}
            >
              {label}
            </Text>
            <Text
              selectable
              style={[
                textStyles.bodyLight,
                { flex: 1, color: colors.textSecondary },
              ]}
            >
              {row.singular ?? "—"}
            </Text>
            <Text
              selectable
              style={[
                textStyles.bodyLight,
                { flex: 1, color: colors.textSecondary },
              ]}
            >
              {row.plural ?? "—"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
