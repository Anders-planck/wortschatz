import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  hint?: string;
  onContinue: () => void;
}

export function ExerciseFeedback({
  isCorrect,
  correctAnswer,
  hint,
  onContinue,
}: ExerciseFeedbackProps) {
  const { colors, textStyles } = useAppTheme();
  const { bottom } = useSafeAreaInsets();

  const bgColor = isCorrect ? "#1A3A1A" : "#3A1A1A";
  const iconName = isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill";
  const iconColor = isCorrect ? colors.success : colors.danger;
  const title = isCorrect ? "Corretto!" : "Sbagliato";
  const buttonBg = isCorrect ? colors.success : colors.danger;

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={{
        backgroundColor: bgColor,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: Math.max(bottom, 24),
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <SymbolView
          name={iconName as SFSymbol}
          size={24}
          tintColor={iconColor}
          resizeMode="scaleAspectFit"
        />
        <Text style={[textStyles.heading, { color: iconColor, fontSize: 18 }]}>
          {title}
        </Text>
      </View>

      {!isCorrect && (
        <Text style={[textStyles.body, { color: "#C8C0B8", fontSize: 14 }]}>
          {"Risposta corretta: "}
          <Text style={{ fontWeight: "700" }}>{correctAnswer}</Text>
        </Text>
      )}

      {hint != null && hint.length > 0 && (
        <Text
          style={[
            textStyles.bodyLight,
            {
              color: colors.textMuted,
              fontStyle: "italic",
            },
          ]}
        >
          {hint}
        </Text>
      )}

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => ({
          marginTop: 4,
          backgroundColor: buttonBg,
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
            { color: colors.onAccent, fontWeight: "600", fontSize: 15 },
          ]}
        >
          Continua
        </Text>
      </Pressable>
    </Animated.View>
  );
}
