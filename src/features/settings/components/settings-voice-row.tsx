import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { fonts } from "@/features/shared/theme/typography";
import { colors } from "@/features/shared/theme/colors";
import { TTS_VOICES } from "../types";

interface SettingsVoiceRowProps {
  value: string;
  onValueChange: (voice: string) => void;
}

export function SettingsVoiceRow({
  value,
  onValueChange,
}: SettingsVoiceRowProps) {
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
      <View style={{ gap: 6 }}>
        {TTS_VOICES.map((voice) => {
          const isSelected = value === voice.id;
          return (
            <Pressable
              key={voice.id}
              onPress={() => onValueChange(voice.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: isSelected
                  ? colors.accentLight
                  : "transparent",
                borderRadius: 8,
                borderCurve: "continuous",
              }}
            >
              <Image
                source={`sf:${isSelected ? "checkmark.circle.fill" : "circle"}`}
                style={{ width: 20, height: 20 }}
                tintColor={isSelected ? colors.accent : colors.textHint}
              />
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? "600" : "400",
                  flex: 1,
                }}
              >
                {voice.label}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  color: colors.textHint,
                }}
              >
                {voice.gender === "F" ? "Femminile" : "Maschile"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
