import React from "react";
import { Pressable, View } from "react-native";

import { COLLECTION_COLORS } from "../types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export const ColorPicker = React.memo(function ColorPicker({
  selected,
  onSelect,
}: ColorPickerProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {COLLECTION_COLORS.map((color) => {
        const isSelected = color === selected;
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderCurve: "continuous",
              backgroundColor: color,
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? colors.accent : "transparent",
            }}
          />
        );
      })}
    </View>
  );
});
