import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

function BouncingDot({ delay }: { delay: number }) {
  const { colors } = useAppTheme();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.textMuted,
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingIndicator() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: colors.card,
        borderRadius: 16,
        borderCurve: "continuous",
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        gap: 5,
        marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <BouncingDot delay={0} />
      <BouncingDot delay={150} />
      <BouncingDot delay={300} />
    </View>
  );
}
