import { useRef } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from "react-native";
import { useState } from "react";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { FillBlankExercise } from "@/features/exercises/types";

interface FillBlankViewProps {
  exercise: FillBlankExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export function FillBlankView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: FillBlankViewProps) {
  const { colors, textStyles } = useAppTheme();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInputType>(null);

  const parts = exercise.sentence.split("___");
  const before = parts[0] ?? "";
  const after = parts[1] ?? "";

  const hasText = text.trim().length > 0;

  const handleSubmit = () => {
    if (!hasText || disabled) return;
    onSubmit(text.trim());
  };

  return (
    <View style={{ flex: 1, gap: 24 }}>
      {/* Sentence */}
      <View style={{ paddingHorizontal: 24, gap: 8 }}>
        <Text
          style={[
            textStyles.body,
            { fontSize: 20, color: colors.textPrimary, lineHeight: 32 },
          ]}
        >
          {before}
          <Text
            style={{
              color: colors.accent,
              borderBottomWidth: 2,
              borderBottomColor: colors.accent,
            }}
          >
            {"_____"}
          </Text>
          {after}
        </Text>

        <Text style={[textStyles.bodyLight, { color: colors.textMuted }]}>
          {exercise.translation}
        </Text>
      </View>

      {/* Input */}
      <View style={{ paddingHorizontal: 24, gap: 8 }}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          style={[
            textStyles.body,
            {
              backgroundColor: colors.card,
              borderWidth: 1.5,
              borderColor: hasText ? colors.accent : colors.border,
              borderRadius: 10,
              borderCurve: "continuous",
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.textPrimary,
            },
          ]}
          placeholderTextColor={colors.textHint}
          placeholder="Scrivi la risposta..."
        />

        {exercise.hint != null && exercise.hint.length > 0 && (
          <Text
            style={[
              textStyles.bodyLight,
              {
                color: colors.textMuted,
                fontStyle: "italic",
                paddingHorizontal: 4,
              },
            ]}
          >
            {exercise.hint}
          </Text>
        )}
      </View>

      {/* Action row */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.borderLight,
            borderRadius: 10,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={[
              textStyles.body,
              { color: colors.textSecondary, fontWeight: "500", fontSize: 15 },
            ]}
          >
            Salta
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={!hasText || disabled}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: hasText ? colors.accent : colors.borderLight,
            borderRadius: 10,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={[
              textStyles.body,
              {
                color: hasText ? "#FFFFFF" : colors.textMuted,
                fontWeight: "600",
                fontSize: 15,
              },
            ]}
          >
            Verifica
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
