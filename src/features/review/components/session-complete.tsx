import { Pressable, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

interface SessionCompleteProps {
  total: number;
  responses: number[];
  onDone: () => void;
}

export function SessionComplete({
  total,
  responses,
  onDone,
}: SessionCompleteProps) {
  const goodCount = responses.filter((r) => r >= 2).length;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 16,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 28,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: -0.5,
        }}
      >
        Fatto!
      </Text>

      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.textHint,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
        }}
      >
        {goodCount}/{total} correct · session complete
      </Text>

      <Pressable
        onPress={onDone}
        style={({ pressed }) => ({
          marginTop: 16,
          backgroundColor: colors.textPrimary,
          borderRadius: 4,
          borderCurve: "continuous",
          paddingHorizontal: 32,
          paddingVertical: 12,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: "500",
            color: "#FFFFFF",
          }}
        >
          Done
        </Text>
      </Pressable>
    </Animated.View>
  );
}
