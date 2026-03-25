import { Text, View } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface VocabularyEmptyProps {
  isLoading: boolean;
}

export function VocabularyEmpty({ isLoading }: VocabularyEmptyProps) {
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
