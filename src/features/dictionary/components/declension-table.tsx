import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import {
  CASE_CONFIG,
  type DeclensionForms,
} from "@/features/dictionary/utils/declension-data";

interface DeclensionTableProps {
  data: DeclensionForms;
}

export function DeclensionTable({ data }: DeclensionTableProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View
      style={{
        gap: 2,
        borderRadius: 10,
        borderCurve: "continuous",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 8,
          paddingHorizontal: 10,
          backgroundColor: colors.cream,
        }}
      >
        <View style={{ width: 40 }} />
        <Text style={[textStyles.monoLabel, { flex: 1, textAlign: "center" }]}>
          SINGULAR
        </Text>
        <Text style={[textStyles.monoLabel, { flex: 1, textAlign: "center" }]}>
          PLURAL
        </Text>
      </View>

      {CASE_CONFIG.map(({ full, abbr, bgKey, textKey }) => {
        const row = data[full];
        if (!row) return null;

        return (
          <View
            key={full}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors[bgKey],
              paddingVertical: 10,
              paddingHorizontal: 10,
            }}
          >
            <View style={{ width: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 9,
                  fontWeight: "700",
                  color: colors[textKey],
                  letterSpacing: 1,
                }}
              >
                {abbr}
              </Text>
            </View>
            <Text
              selectable
              style={[
                textStyles.body,
                {
                  flex: 1,
                  textAlign: "center",
                  fontSize: 14,
                  color: colors.textPrimary,
                  fontWeight: "500",
                },
              ]}
            >
              {row.singular ?? "—"}
            </Text>
            <Text
              selectable
              style={[
                textStyles.body,
                {
                  flex: 1,
                  textAlign: "center",
                  fontSize: 14,
                  color: colors.textSecondary,
                },
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
