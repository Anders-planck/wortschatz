import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { hapticLight, hapticMedium } from "./use-haptics";

// Module-level cache for voice availability check
let voiceCheckPromise: Promise<boolean> | null = null;

function checkGermanVoice(): Promise<boolean> {
  if (!voiceCheckPromise) {
    voiceCheckPromise = Speech.getAvailableVoicesAsync().then((voices) =>
      voices.some((v) => v.language.startsWith("de")),
    );
  }
  return voiceCheckPromise;
}

interface UseSpeechOptions {
  speechRate?: number;
}

export function useSpeech(options?: UseSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  const sequenceRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check voice availability on mount
  useEffect(() => {
    checkGermanVoice().then(setIsAvailable);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getRate = useCallback(async () => {
    if (options?.speechRate !== undefined) return options.speechRate;
    return getSpeechRate();
  }, [options?.speechRate]);

  const speak = useCallback(
    async (text: string) => {
      if (!isAvailable) {
        hapticMedium();
        return;
      }

      // Cancel any running sequence
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrentSpeakingIndex(null);

      Speech.stop();
      const rate = await getRate();

      hapticLight();
      Speech.speak(text, {
        language: "de-DE",
        rate,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          setIsAvailable(false);
          hapticMedium();
        },
      });
    },
    [isAvailable, getRate],
  );

  const speakAll = useCallback(
    async (forms: string[], delayMs = 600) => {
      if (!isAvailable || forms.length === 0) {
        if (!isAvailable) hapticMedium();
        return;
      }

      // Cancel previous sequence
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Speech.stop();

      const sequence = { cancelled: false };
      sequenceRef.current = sequence;

      const rate = await getRate();
      hapticLight();

      for (let i = 0; i < forms.length; i++) {
        if (sequence.cancelled) break;

        setCurrentSpeakingIndex(i);

        await new Promise<void>((resolve) => {
          Speech.speak(forms[i], {
            language: "de-DE",
            rate,
            onStart: () => setIsSpeaking(true),
            onDone: () => {
              setIsSpeaking(false);
              resolve();
            },
            onStopped: () => {
              setIsSpeaking(false);
              resolve();
            },
            onError: () => {
              setIsSpeaking(false);
              setIsAvailable(false);
              resolve();
            },
          });
        });

        if (sequence.cancelled || i === forms.length - 1) break;

        // Delay between forms
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, delayMs);
        });
      }

      if (!sequence.cancelled) {
        setCurrentSpeakingIndex(null);
      }
    },
    [isAvailable, getRate],
  );

  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    Speech.stop();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, []);

  return {
    speak,
    speakAll,
    stop,
    isSpeaking,
    isAvailable,
    currentSpeakingIndex,
  };
}
