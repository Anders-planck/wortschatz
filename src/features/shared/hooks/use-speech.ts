import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { getSpeechRate } from "@/features/settings/services/settings-repository";
import { getAudio } from "@/features/shared/services/tts-service";
import { hapticLight } from "./use-haptics";

interface UseSpeechOptions {
  speechRate?: number;
}

export function useSpeech(options?: UseSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  const sequenceRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const player = useAudioPlayer(null);

  useEffect(() => {
    return () => {
      player.pause();
      Speech.stop();
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (listenerRef.current) listenerRef.current.remove();
    };
  }, [player]);

  const getRate = useCallback(async () => {
    if (options?.speechRate !== undefined) return options.speechRate;
    return getSpeechRate();
  }, [options?.speechRate]);

  const playAudio = useCallback(
    async (text: string): Promise<void> => {
      const rate = await getRate();
      const path = await getAudio(text, rate);

      if (path) {
        if (listenerRef.current) listenerRef.current.remove();

        player.replace({ uri: path });
        setIsSpeaking(true);

        return new Promise<void>((resolve) => {
          const subscription = player.addListener(
            "playbackStatusUpdate",
            (status) => {
              if (status.didJustFinish) {
                setIsSpeaking(false);
                subscription.remove();
                listenerRef.current = null;
                resolve();
              }
            },
          );
          listenerRef.current = subscription;
          player.play();
        });
      }

      return new Promise<void>((resolve) => {
        Speech.speak(text, {
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
            resolve();
          },
        });
      });
    },
    [player, getRate],
  );

  const speak = useCallback(
    async (text: string) => {
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrentSpeakingIndex(null);

      player.pause();
      Speech.stop();

      hapticLight();
      await playAudio(text);
    },
    [player, playAudio],
  );

  const speakAll = useCallback(
    async (forms: string[], delayMs = 600) => {
      if (forms.length === 0) return;

      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      player.pause();
      Speech.stop();

      const sequence = { cancelled: false };
      sequenceRef.current = sequence;

      hapticLight();

      for (let i = 0; i < forms.length; i++) {
        if (sequence.cancelled) break;

        setCurrentSpeakingIndex(i);
        await playAudio(forms[i]);

        if (sequence.cancelled || i === forms.length - 1) break;

        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, delayMs);
        });
      }

      if (!sequence.cancelled) {
        setCurrentSpeakingIndex(null);
      }
    },
    [player, playAudio],
  );

  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (listenerRef.current) {
      listenerRef.current.remove();
      listenerRef.current = null;
    }
    player.pause();
    Speech.stop();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, [player]);

  return {
    speak,
    speakAll,
    stop,
    isSpeaking,
    isAvailable: true,
    currentSpeakingIndex,
  };
}
