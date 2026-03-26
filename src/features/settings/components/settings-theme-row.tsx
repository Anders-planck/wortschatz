import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { fonts } from "@/features/shared/theme/typography";
import {
  useThemeColors,
  useThemeMode,
  type ThemeMode,
} from "@/features/shared/theme/theme-context";
import { hapticLight } from "@/features/shared/hooks/use-haptics";

const MODES: { id: ThemeMode; label: string; icon: string }[] = [
  { id: "system", label: "Auto", icon: "circle.lefthalf.filled" },
  { id: "light", label: "Chiaro", icon: "sun.max" },
  { id: "dark", label: "Scuro", icon: "moon" },
];

export function SettingsThemeRow() {
  const colors = useThemeColors();
  const { mode, setMode } = useThemeMode();

  const handleSelect = (next: ThemeMode) => {
    hapticLight();
    setMode(next);
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        Tema
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {MODES.map((m) => {
          const isSelected = mode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => handleSelect(m.id)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                backgroundColor: isSelected ? colors.accentLight : colors.cream,
                borderRadius: 12,
                borderCurve: "continuous",
                borderWidth: isSelected ? 1.5 : 0,
                borderColor: isSelected ? colors.accent : "transparent",
              }}
            >
              <Image
                source={`sf:${m.icon}`}
                style={{ width: 16, height: 16 }}
                tintColor={isSelected ? colors.accent : colors.textMuted}
              />
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
