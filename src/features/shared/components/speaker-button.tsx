import { Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useEffect } from "react";
import { colors } from "@/features/shared/theme/colors";
import { useSpeech } from "@/features/shared/hooks/use-speech";

interface SpeakerButtonProps {
  text?: string;
  size?: "sm" | "md";
  onSpeakAll?: () => void;
  isHighlighted?: boolean;
}

const SIZES = {
  sm: { icon: 16, hitSlop: 8 },
  md: { icon: 22, hitSlop: 4 },
} as const;

export function SpeakerButton({
  text,
  size = "md",
  onSpeakAll,
  isHighlighted,
}: SpeakerButtonProps) {
  const { speak, stop, isSpeaking, isAvailable } = useSpeech();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSpeaking && !onSpeakAll) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isSpeaking, onSpeakAll, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isAvailable) return;
    if (isSpeaking && !onSpeakAll) {
      stop();
      return;
    }
    if (onSpeakAll) {
      onSpeakAll();
    } else if (text) {
      speak(text);
    }
  };

  const iconName = isAvailable ? "speaker.wave.2" : "speaker.slash";
  const iconColor = !isAvailable
    ? colors.textMuted
    : isSpeaking
      ? colors.accent
      : colors.textTertiary;

  const { icon: iconSize, hitSlop } = SIZES[size];

  return (
    <Pressable onPress={handlePress} hitSlop={hitSlop}>
      <Animated.View style={animatedStyle}>
        <Image
          source={`sf:${iconName}`}
          style={{ width: iconSize, height: iconSize }}
          tintColor={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}
