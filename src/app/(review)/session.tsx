import { useEffect } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import { useThemeColors } from "@/features/shared/theme/theme-context";
import { useReviewSession } from "@/features/review/hooks/use-review-session";
import { SessionProgress } from "@/features/review/components/session-progress";
import { ReviewCard } from "@/features/review/components/review-card";
import { ResponseButtons } from "@/features/review/components/response-buttons";
import { SessionComplete } from "@/features/review/components/session-complete";
import { SessionEmpty } from "@/features/review/components/session-empty";

export default function SessionScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
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
  } = useReviewSession(collectionId ? Number(collectionId) : undefined);

  useEffect(() => {
    startSession();
  }, [startSession]);

  if (words.length === 0) {
    return (
      <>
        <SessionEmpty />
        <Stack.Screen.Title>Sessione</Stack.Screen.Title>
      </>
    );
  }

  if (isComplete) {
    return (
      <>
        <SessionComplete
          total={total}
          responses={responses}
          onDone={() => router.back()}
        />
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
