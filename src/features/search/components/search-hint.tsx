import { Text, View } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

export function SearchHint() {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={textStyles.monoLabel}>Input incompleto</Text>
      <Text
        style={[
          textStyles.body,
          { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
        ]}
      >
        Scrivi almeno due caratteri. Una parola apre il dizionario, una frase
        intera entra nel flusso di traduzione dettagliata.
      </Text>
    </View>
  );
}
