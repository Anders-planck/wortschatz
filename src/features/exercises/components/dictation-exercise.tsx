import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useSpeech } from "@/features/shared/hooks/use-speech";
import type { DictationExercise } from "@/features/exercises/types";

interface DictationViewProps {
  exercise: DictationExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

export function DictationView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: DictationViewProps) {
  const { colors, textStyles } = useAppTheme();
  const { speak, isSpeaking } = useSpeech();
  const [text, setText] = useState("");

  const hasText = text.trim().length > 0;

  const handleSubmit = () => {
    if (!hasText || disabled) return;
    onSubmit(text.trim());
  };

  return (
    <View style={{ flex: 1, gap: 24 }}>
      {/* Play button */}
      <View style={{ alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => speak(exercise.sentence)}
          disabled={disabled}
          style={({ pressed }) => ({
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.accentLight,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Image
            source="sf:speaker.wave.2.fill"
            style={{ width: 34, height: 34 }}
            tintColor={colors.accent}
          />
        </Pressable>

        <Text style={[textStyles.bodyLight, { color: colors.textMuted }]}>
          {isSpeaking ? "In ascolto..." : "Tocca per ascoltare"}
        </Text>
      </View>

      {/* Input */}
      <View style={{ paddingHorizontal: 24 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
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
              minHeight: 80,
              textAlignVertical: "top",
            },
          ]}
          placeholderTextColor={colors.textHint}
          placeholder="Scrivi quello che senti..."
        />
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
