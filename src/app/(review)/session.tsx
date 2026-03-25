import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { View, Text } from "react-native";

import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";
import { useReviewSession } from "@/features/review/hooks/use-review-session";
import { SessionProgress } from "@/features/review/components/session-progress";
import { ReviewCard } from "@/features/review/components/review-card";
import { ResponseButtons } from "@/features/review/components/response-buttons";
import { SessionComplete } from "@/features/review/components/session-complete";

export default function SessionScreen() {
  const router = useRouter();
  const {
    words,
    currentIndex,
    currentWord,
    isRevealed,
    isComplete,
    responses,
    total,
    startSession,
    reveal,
    respond,
  } = useReviewSession();

  useEffect(() => {
    startSession();
  }, [startSession]);

  if (words.length === 0) {
    return (
      <>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.bg,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textHint,
            }}
          >
            No words to review
          </Text>
        </View>
        <Stack.Screen.Title>Sessione</Stack.Screen.Title>
      </>
    );
  }

  if (isComplete) {
    return (
      <>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <SessionComplete
            total={total}
            responses={responses}
            onDone={() => router.back()}
          />
        </View>
        <Stack.Screen.Title>Completato</Stack.Screen.Title>
      </>
    );
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SessionProgress
          words={words}
          currentIndex={currentIndex}
          responses={responses}
        />
        {currentWord && (
          <ReviewCard
            word={currentWord}
            isRevealed={isRevealed}
            onReveal={reveal}
          />
        )}
        {isRevealed && <ResponseButtons onRespond={respond} />}
      </View>
      <Stack.Screen.Title>Sessione</Stack.Screen.Title>
    </>
  );
}
