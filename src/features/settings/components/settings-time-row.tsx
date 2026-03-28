import { View, Text } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { fonts } from "@/features/shared/theme/typography";

interface SettingsTimeRowProps {
  label: string;
  value: Date;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  onChange: (date: Date) => void;
}

export function SettingsTimeRow({
  label,
  value,
  minuteInterval = 15,
  onChange,
}: SettingsTimeRowProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <DateTimePicker
        value={value}
        mode="time"
        minuteInterval={minuteInterval}
        onChange={(_event, selectedDate) => {
          if (selectedDate) onChange(selectedDate);
        }}
      />
    </View>
  );
}
