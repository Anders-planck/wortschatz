import { View, Text, ActivityIndicator } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { textStyles } from "@/features/shared/theme/typography";

interface WordLoadingProps {
  term: string;
}

export function WordLoading({ term }: WordLoadingProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
      }}
    >
      <ActivityIndicator size="small" color={colors.textHint} />
      <Text style={[textStyles.mono, { marginTop: 10 }]}>
        Looking up {term}...
      </Text>
    </View>
  );
}
