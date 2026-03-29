import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import type { CaseQuizExercise } from "@/features/exercises/types";

interface CaseQuizViewProps {
  exercise: CaseQuizExercise;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled: boolean;
}

const CASE_LABELS: Record<string, string> = {
  nom: "Nominativo",
  akk: "Accusativo",
  dat: "Dativo",
  gen: "Genitivo",
};

export function CaseQuizView({
  exercise,
  onSubmit,
  onSkip,
  disabled,
}: CaseQuizViewProps) {
  const { colors, textStyles } = useAppTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const caseType = exercise.caseType;
  const caseBg = colors[`${caseType}Bg` as keyof typeof colors] as string;
  const caseText = colors[`${caseType}Text` as keyof typeof colors] as string;

  const parts = exercise.sentence.split("___");
  const before = parts[0] ?? "";
  const after = parts[1] ?? "";

  const hasSelection = selected != null;

  const handleSubmit = () => {
    if (!hasSelection || disabled) return;
    onSubmit(selected);
  };

  return (
    <View style={{ flex: 1, gap: 24 }}>
      {/* Case badge */}
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            backgroundColor: caseBg,
            borderRadius: 20,
            borderCurve: "continuous",
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text
            style={[
              textStyles.mono,
              {
                color: caseText,
                fontWeight: "600",
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
              },
            ]}
          >
            {CASE_LABELS[caseType] ?? caseType}
          </Text>
        </View>
      </View>

      {/* Sentence */}
      <View style={{ paddingHorizontal: 24, gap: 8 }}>
        <Text
          style={[
            textStyles.body,
            { fontSize: 20, color: colors.textPrimary, lineHeight: 32 },
          ]}
        >
          {before}
          <Text style={{ color: colors.accent, fontWeight: "700" }}>
            {selected ?? "____"}
          </Text>
          {after}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={[textStyles.bodyLight, { color: colors.textMuted, flex: 1 }]}
          >
            {exercise.translation}
          </Text>
          <SpeakerButton
            text={exercise.sentence.replace("___", exercise.correctArticle)}
            size="sm"
          />
        </View>
      </View>

      {/* Option pills */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {exercise.options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => !disabled && setSelected(option)}
              style={({ pressed }) => ({
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.accent : colors.border,
                borderRadius: 20,
                borderCurve: "continuous",
                paddingHorizontal: 20,
                paddingVertical: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={[
                  textStyles.body,
                  {
                    color: isSelected ? "#FFFFFF" : colors.textSecondary,
                    fontWeight: "500",
                    fontSize: 15,
                  },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
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
          disabled={!hasSelection || disabled}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: hasSelection ? colors.accent : colors.borderLight,
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
                color: hasSelection ? "#FFFFFF" : colors.textMuted,
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
