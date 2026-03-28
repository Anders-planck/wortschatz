import { useEffect } from "react";
import { Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ToastProps {
  message: string;
  icon?: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  message,
  icon = "checkmark.circle.fill",
  visible,
  onDismiss,
  duration = 2000,
}: ToastProps) {
  const { colors, textStyles } = useAppTheme();
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={{
        position: "absolute",
        bottom: bottom + 16,
        left: 24,
        right: 24,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderCurve: "continuous",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <SymbolView
        name={icon as SFSymbol}
        size={20}
        tintColor={colors.accent}
        resizeMode="scaleAspectFit"
      />
      <Text
        style={{
          fontFamily: textStyles.heading.fontFamily,
          fontSize: 14,
          fontWeight: "600",
          color: colors.textPrimary,
          flex: 1,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
