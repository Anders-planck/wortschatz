import React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";

import { COLLECTION_ICONS } from "../types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface SfIconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export const SfIconPicker = React.memo(function SfIconPicker({
  selected,
  onSelect,
}: SfIconPickerProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {COLLECTION_ICONS.map((icon) => {
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
            <Image
              source={`sf:${icon}`}
              style={{ width: 22, height: 22 }}
              tintColor={isSelected ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
});
