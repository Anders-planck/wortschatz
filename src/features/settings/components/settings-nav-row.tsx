import { Pressable, Text } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { fonts } from "@/features/shared/theme/typography";

interface SettingsNavRowProps {
  label: string;
  icon?: string;
  onPress: () => void;
}

export function SettingsNavRow({ label, icon, onPress }: SettingsNavRowProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && (
        <SymbolView
          name={icon as SFSymbol}
          size={20}
          tintColor={colors.accent}
          resizeMode="scaleAspectFit"
        />
      )}
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <SymbolView
        name="chevron.right"
        size={12}
        tintColor={colors.textGhost}
        resizeMode="scaleAspectFit"
      />
    </Pressable>
  );
}
