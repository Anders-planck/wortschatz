import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface LanguageChipRowProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function LanguageChipRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: LanguageChipRowProps<T>) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ gap: 10 }}>
      <Text style={textStyles.monoLabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                borderRadius: 999,
                borderCurve: "continuous",
                paddingHorizontal: 12,
                paddingVertical: 9,
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderWidth: 1,
                borderColor: isSelected ? colors.accent : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 12,
                  fontWeight: "600",
                  color: isSelected ? colors.onAccent : colors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
