import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";
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
  const handleSelect = (voiceId: string) => {
    hapticLight();
    onValueChange(voiceId);
    setTimeout(() => onPreview(PREVIEW_TEXT), 150);
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        Voce
      </Text>
      <View style={{ gap: 4 }}>
        {TTS_VOICES.map((voice) => {
          const isSelected = value === voice.id;
          return (
            <Pressable
              key={voice.id}
              onPress={() => handleSelect(voice.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: isSelected
                  ? colors.accentLight
                  : "transparent",
                borderRadius: 10,
                borderCurve: "continuous",
              }}
            >
              <Image
                source={`sf:${isSelected ? "checkmark.circle.fill" : "circle"}`}
                style={{ width: 20, height: 20 }}
                tintColor={isSelected ? colors.accent : colors.textHint}
              />
              <View style={{ flex: 1, gap: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 15,
                    color: isSelected
                      ? colors.textPrimary
                      : colors.textSecondary,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {voice.label}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textHint,
                  }}
                >
                  {voice.gender === "F" ? "Femminile" : "Maschile"}
                </Text>
              </View>
              {isSelected && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Pressable
                    onPress={() => onPreview(PREVIEW_TEXT)}
                    hitSlop={8}
                  >
                    <Image
                      source="sf:speaker.wave.2"
                      style={{ width: 18, height: 18 }}
                      tintColor={colors.accent}
                    />
                  </Pressable>
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
