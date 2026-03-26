import { Text, View } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface VocabularyEmptyProps {
  isLoading: boolean;
}

export function VocabularyEmpty({ isLoading }: VocabularyEmptyProps) {
  const { colors, textStyles } = useAppTheme();

  if (isLoading) return null;

  return (
    <View style={{ paddingTop: 40, alignItems: "center" }}>
      <Text
        selectable
        style={[
          textStyles.bodyLight,
          { color: colors.textHint, textAlign: "center" },
        ]}
      >
        Nessuna parola salvata.{"\n"}Cerca una parola per iniziare.
      </Text>
    </View>
  );
}
