import React from "react";
import { Pressable, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface SfIconPickerProps {
  icons: readonly string[];
  selected: string;
  onSelect: (icon: string) => void;
}

export const SfIconPicker = React.memo(function SfIconPicker({
  icons,
  selected,
  onSelect,
}: SfIconPickerProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {icons.map((icon) => {
        const isSelected = icon === selected;
        return (
          <Pressable
            key={icon}
            onPress={() => onSelect(icon)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSelected ? colors.accentLight : "transparent",
              borderWidth: isSelected ? 1.5 : 0,
              borderColor: isSelected ? colors.accent : "transparent",
            }}
          >
            <SymbolView
              name={icon as SFSymbol}
              size={22}
              tintColor={isSelected ? colors.accent : colors.textSecondary}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        );
      })}
    </View>
  );
});
