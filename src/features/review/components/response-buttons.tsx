import { Pressable, Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { hapticMedium } from "@/features/shared/hooks/use-haptics";

type Response = 0 | 1 | 2 | 3;

interface ButtonConfig {
  label: string;
  icon: string;
  color: string;
}

interface ResponseButtonsProps {
  onRespond: (response: Response) => void;
  intervals?: string[];
}

export function ResponseButtons({
  onRespond,
  intervals = [],
}: ResponseButtonsProps) {
  const { colors, textStyles } = useAppTheme();

  const BUTTONS: Record<Response, ButtonConfig> = {
    0: {
      label: "Again",
      icon: "arrow.counterclockwise",
      color: colors.danger,
    },
    1: {
      label: "Hard",
      icon: "tortoise",
      color: colors.textTertiary,
    },
    2: {
      label: "Good",
      icon: "checkmark",
      color: colors.accent,
    },
    3: {
      label: "Easy",
      icon: "bolt",
      color: colors.success,
    },
  };

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      {([0, 1, 2, 3] as Response[]).map((response) => {
        const config = BUTTONS[response];
        const interval = intervals[response];
        return (
          <Pressable
            key={response}
            onPress={() => {
              hapticMedium();
              onRespond(response);
            }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              gap: 6,
              paddingVertical: 12,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={config.icon as SFSymbol}
              size={22}
              tintColor={config.color}
              resizeMode="scaleAspectFit"
            />
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 10,
                fontWeight: "600",
                color: config.color,
                letterSpacing: 0.5,
              }}
            >
              {config.label}
            </Text>
            {interval && (
              <Text
                style={{
                  fontFamily: textStyles.mono.fontFamily,
                  fontSize: 11,
                  fontWeight: "700",
                  color: config.color,
                  opacity: 0.7,
                }}
              >
                {interval}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
