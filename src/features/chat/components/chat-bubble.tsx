import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { useSpeech } from "@/features/shared/hooks/use-speech";
import type { ChatMessage, Correction } from "../types";
import { CorrectionBlock } from "./correction-block";

interface ChatBubbleProps {
  message: ChatMessage;
  corrections: Correction[];
  markedWords: string[];
  onWordTap: (word: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function RenderTextWithMarkedWords({
  text,
  markedWords,
  onWordTap,
  accentColor,
  textColor,
  fontFamily,
}: {
  text: string;
  markedWords: string[];
  onWordTap: (word: string) => void;
  accentColor: string;
  textColor: string;
  fontFamily: string;
}) {
  const pattern = useMemo(() => {
    if (markedWords.length === 0) return null;
    const escaped = markedWords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  }, [markedWords]);

  if (!pattern) {
    return (
      <Text
        style={{ fontFamily, fontSize: 15, color: textColor, lineHeight: 22 }}
      >
        {text}
      </Text>
    );
  }

  const parts = text.split(pattern);

  return (
    <Text
      style={{ fontFamily, fontSize: 15, color: textColor, lineHeight: 22 }}
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
  const { speak, isSpeaking } = useSpeech();
  const isUser = message.role === "user";
  const displayText = message.content;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        marginBottom: 12,
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
              color: colors.onAccent,
              lineHeight: 22,
            }}
          >
            {displayText}
          </Text>
        ) : (
          <>
            <RenderTextWithMarkedWords
              text={displayText}
              markedWords={markedWords}
              onWordTap={onWordTap}
              accentColor={colors.accent}
              textColor={colors.textPrimary}
              fontFamily={textStyles.body.fontFamily}
            />
            {corrections.map((c, i) => (
              <CorrectionBlock key={`${c.wrong}-${i}`} correction={c} />
            ))}
          </>
        )}
      </View>

      {/* Footer: time + speech */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
          alignSelf: isUser ? "flex-end" : "flex-start",
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontFamily: textStyles.mono.fontFamily,
            fontSize: 10,
            color: colors.textGhost,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(message.timestamp)}
        </Text>

        {displayText.length > 0 && (
          <Pressable
            onPress={() => speak(displayText)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <SymbolView
              name={isSpeaking ? "speaker.wave.3.fill" : "speaker.wave.2"}
              size={12}
              tintColor={colors.textGhost}
              resizeMode="scaleAspectFit"
            />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
});
