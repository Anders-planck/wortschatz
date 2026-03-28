import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { ChatMessage, Correction } from "../types";
import { CorrectionBlock } from "./correction-block";

interface ChatBubbleProps {
  message: ChatMessage;
  corrections: Correction[];
  markedWords: string[];
  onWordTap: (word: string) => void;
}

function renderTextWithMarkedWords(
  text: string,
  markedWords: string[],
  onWordTap: (word: string) => void,
  accentColor: string,
  textColor: string,
  fontFamily: string,
) {
  if (markedWords.length === 0) {
    return (
      <Text
        style={{
          fontFamily,
          fontSize: 15,
          fontWeight: "400",
          color: textColor,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    );
  }

  // Build a regex to match any marked word (case-insensitive, word boundaries)
  const escaped = markedWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return (
    <Text
      style={{
        fontFamily,
        fontSize: 15,
        fontWeight: "400",
        color: textColor,
        lineHeight: 22,
      }}
    >
      {parts.map((part, i) => {
        const isMarked = markedWords.some(
          (w) => w.toLowerCase() === part.toLowerCase(),
        );
        if (isMarked) {
          return (
            <Text
              key={i}
              onPress={() => onWordTap(part)}
              style={{
                color: accentColor,
                textDecorationLine: "underline",
                fontWeight: "500",
              }}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export const ChatBubble = React.memo(function ChatBubble({
  message,
  corrections,
  markedWords,
  onWordTap,
}: ChatBubbleProps) {
  const { colors, textStyles } = useAppTheme();
  const isUser = message.role === "user";

  // Content is already clean — parsed.text is stored by the hook (Fix 2)
  const displayText = message.content;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        marginBottom: 8,
      }}
    >
      <View
        style={{
          backgroundColor: isUser ? colors.accent : colors.card,
          borderRadius: 16,
          borderCurve: "continuous",
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          boxShadow: isUser ? undefined : "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {isUser ? (
          <Text
            style={{
              fontFamily: textStyles.body.fontFamily,
              fontSize: 15,
              fontWeight: "400",
              color: "#FFFFFF",
              lineHeight: 22,
            }}
          >
            {displayText}
          </Text>
        ) : (
          <>
            {renderTextWithMarkedWords(
              displayText,
              markedWords,
              onWordTap,
              colors.accent,
              colors.textPrimary,
              textStyles.body.fontFamily,
            )}
            {corrections.map((c, i) => (
              <CorrectionBlock key={`${c.wrong}-${i}`} correction={c} />
            ))}
          </>
        )}
      </View>
    </Animated.View>
  );
});
