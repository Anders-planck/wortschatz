import React from "react";
import { COLLECTION_ICONS } from "../types";
import { SfIconPicker as SharedSfIconPicker } from "@/features/shared/components/sf-icon-picker";

interface SfIconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export const SfIconPicker = React.memo(function SfIconPicker({
  selected,
  onSelect,
}: SfIconPickerProps) {
  return (
    <SharedSfIconPicker
      icons={COLLECTION_ICONS}
      selected={selected}
      onSelect={onSelect}
    />
  );
});
