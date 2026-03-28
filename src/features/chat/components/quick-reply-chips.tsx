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
      style={{ flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 10,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((text, i) => (
        <Pressable
          key={`${i}-${text}`}
          onPress={() => onSelect(text)}
          style={({ pressed }) => ({
            backgroundColor: colors.accentLight,
            borderRadius: 20,
            borderCurve: "continuous",
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: pressed ? 0.7 : 1,
            maxWidth: 280,
          })}
        >
          <Text
            numberOfLines={2}
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 14,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            {text}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
