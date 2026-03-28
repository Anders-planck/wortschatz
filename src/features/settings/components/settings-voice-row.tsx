import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { fonts } from "@/features/shared/theme/typography";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { hapticLight } from "@/features/shared/hooks/use-haptics";
import { TTS_VOICES } from "../types";

const PREVIEW_TEXT = "Guten Tag, willkommen bei WortSchatz";

interface SettingsVoiceRowProps {
  value: string;
  onValueChange: (voice: string) => void;
  onPreview: (text: string) => void;
}

export function SettingsVoiceRow({
  value,
  onValueChange,
  onPreview,
}: SettingsVoiceRowProps) {
  const colors = useThemeColors();
  const handleSelect = (voiceId: string) => {
    hapticLight();
    onValueChange(voiceId);
    setTimeout(() => onPreview(PREVIEW_TEXT), 150);
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.textPrimary,
          }}
        >
          Voce
        </Text>
        <Pressable
          onPress={() => onPreview(PREVIEW_TEXT)}
          hitSlop={8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: colors.accentLight,
            borderRadius: 12,
            borderCurve: "continuous",
          }}
        >
          <SymbolView
            name="speaker.wave.2"
            size={14}
            tintColor={colors.accent}
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            Prova
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {TTS_VOICES.map((voice) => {
          const isSelected = value === voice.id;
          return (
            <Pressable
              key={voice.id}
              onPress={() => handleSelect(voice.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: isSelected ? colors.accentLight : colors.cream,
                borderRadius: 20,
                borderCurve: "continuous",
                borderWidth: isSelected ? 1.5 : 0,
                borderColor: isSelected ? colors.accent : "transparent",
              }}
            >
              <SymbolView
                name={
                  voice.gender === "F"
                    ? "person.crop.circle"
                    : "person.crop.circle.fill"
                }
                size={16}
                tintColor={isSelected ? colors.accent : colors.textMuted}
                resizeMode="scaleAspectFit"
              />
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {voice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
