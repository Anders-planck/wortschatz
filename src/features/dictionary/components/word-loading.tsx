import { View, Text, ActivityIndicator } from "react-native";

import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface WordLoadingProps {
  term: string;
}

export function WordLoading({ term }: WordLoadingProps) {
  const { colors, textStyles } = useAppTheme();

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
