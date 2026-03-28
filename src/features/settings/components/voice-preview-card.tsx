import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { fonts } from "@/features/shared/theme/typography";
import { hapticLight } from "@/features/shared/hooks/use-haptics";

interface VoicePreviewCardProps {
  onPress: () => void;
}

export function VoicePreviewCard({ onPress }: VoicePreviewCardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        borderCurve: "continuous",
        boxShadow: "0 1px 3px rgba(60, 42, 20, 0.06)",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: colors.accentLight,
          borderRadius: 12,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SymbolView
          name="speaker.wave.2.fill"
          size={24}
          tintColor={colors.accent}
          resizeMode="scaleAspectFit"
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 16,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
        >
          Voce tedesca
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textTertiary,
          }}
        >
          Tocca per ascoltare un esempio
        </Text>
      </View>
      <Pressable
        onPress={() => {
          hapticLight();
          onPress();
        }}
        style={{
          backgroundColor: colors.accentLight,
          borderRadius: 8,
          borderCurve: "continuous",
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: "600",
            color: colors.accent,
          }}
        >
          Prova
        </Text>
      </Pressable>
    </View>
  );
}
