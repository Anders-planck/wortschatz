import { Pressable, ScrollView, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface QuickReplyChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function QuickReplyChips({
  suggestions,
  onSelect,
}: QuickReplyChipsProps) {
  const { colors, textStyles } = useAppTheme();

  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 8,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((text) => (
        <Pressable
          key={text}
          onPress={() => onSelect(text)}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 20,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={[
              textStyles.body,
              { fontSize: 13, color: colors.textPrimary },
            ]}
          >
            {text}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
