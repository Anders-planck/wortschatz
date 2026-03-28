import { Pressable, Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ExerciseType } from "@/features/exercises/types";

interface ExerciseHubProps {
  onSelect: (type: ExerciseType) => void;
}

interface ExerciseOption {
  type: ExerciseType;
  title: string;
  description: string;
  icon: string;
}

const OPTIONS: ExerciseOption[] = [
  {
    type: "mix",
    title: "Mix intelligente",
    description: "Un mix di tutti gli esercizi, adattato al tuo vocabolario",
    icon: "sparkles",
  },
  {
    type: "fill",
    title: "Completa la frase",
    description: "Inserisci la parola mancante nel contesto corretto",
    icon: "text.cursor",
  },
  {
    type: "dictation",
    title: "Dettato",
    description: "Ascolta e scrivi la frase in tedesco",
    icon: "waveform",
  },
  {
    type: "cases",
    title: "Articoli & Casi",
    description:
      "Scegli l'articolo corretto per nominativo, accusativo e dativo",
    icon: "tablecells",
  },
];

export function ExerciseHub({ onSelect }: ExerciseHubProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      <Text
        style={[
          textStyles.bodyLight,
          { color: colors.textMuted, marginBottom: 4 },
        ]}
      >
        Scegli un tipo di esercizio
      </Text>

      {OPTIONS.map((option) => (
        <Pressable
          key={option.type}
          onPress={() => onSelect(option.type)}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            opacity: pressed ? 0.75 : 1,
            borderWidth: option.type === "mix" ? 1.5 : 0,
            borderColor: option.type === "mix" ? colors.accent : "transparent",
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor:
                option.type === "mix" ? colors.accentLight : colors.borderLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SymbolView
              name={option.icon as SFSymbol}
              size={22}
              tintColor={
                option.type === "mix" ? colors.accent : colors.textSecondary
              }
              resizeMode="scaleAspectFit"
            />
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={[
                textStyles.body,
                {
                  fontWeight: "600",
                  fontSize: 15,
                  color: colors.textPrimary,
                },
              ]}
            >
              {option.title}
            </Text>
            <Text
              style={[
                textStyles.bodyLight,
                { color: colors.textMuted, fontSize: 13 },
              ]}
            >
              {option.description}
            </Text>
          </View>

          <SymbolView
            name="chevron.right"
            size={14}
            tintColor={colors.textHint}
            resizeMode="scaleAspectFit"
          />
        </Pressable>
      ))}
    </View>
  );
}
