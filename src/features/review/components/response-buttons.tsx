import { Pressable, Text, View } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";
import { hapticMedium } from "@/features/shared/hooks/use-haptics";

type Response = 0 | 1 | 2 | 3;

interface ButtonConfig {
  label: string;
  borderColor: string;
  textColor: string;
}

const BUTTONS: Record<Response, ButtonConfig> = {
  0: { label: "Again", borderColor: colors.die, textColor: "#8A6058" },
  1: {
    label: "Hard",
    borderColor: colors.border,
    textColor: colors.textTertiary,
  },
  2: { label: "Good", borderColor: colors.der, textColor: colors.akkText },
  3: { label: "Easy", borderColor: colors.das, textColor: colors.datText },
};

interface ResponseButtonsProps {
  onRespond: (response: Response) => void;
}

export function ResponseButtons({ onRespond }: ResponseButtonsProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      {([0, 1, 2, 3] as Response[]).map((response) => {
        const config = BUTTONS[response];
        return (
          <Pressable
            key={response}
            onPress={() => {
              hapticMedium();
              onRespond(response);
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderWidth: 1.5,
              borderColor: config.borderColor,
              borderRadius: 4,
              borderCurve: "continuous",
              paddingVertical: 12,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                fontWeight: "500",
                color: config.textColor,
              }}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
