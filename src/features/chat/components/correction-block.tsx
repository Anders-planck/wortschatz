import { Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { Correction } from "../types";

interface CorrectionBlockProps {
  correction: Correction;
}

export function CorrectionBlock({ correction }: CorrectionBlockProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: "rgba(192, 80, 80, 0.08)",
        borderRadius: 8,
        borderCurve: "continuous",
        padding: 10,
        marginTop: 8,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={[
            textStyles.body,
            {
              color: "#C05050",
              textDecorationLine: "line-through",
              fontSize: 13,
            },
          ]}
        >
          {correction.wrong}
        </Text>
        <Text
          style={[textStyles.body, { color: colors.textMuted, fontSize: 13 }]}
        >
          →
        </Text>
        <Text
          style={[
            textStyles.body,
            { color: "#4A9A4A", fontWeight: "600", fontSize: 13 },
          ]}
        >
          {correction.right}
        </Text>
      </View>
      {correction.tip.length > 0 && (
        <Text
          style={[textStyles.bodyLight, { fontStyle: "italic", fontSize: 12 }]}
        >
          {correction.tip}
        </Text>
      )}
    </View>
  );
}
