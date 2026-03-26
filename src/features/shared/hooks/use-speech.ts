import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
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
  const playerRef = useRef<AudioPlayer | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const cleanup = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current.remove();
      listenerRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      Speech.stop();
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cleanup]);

  const getRate = useCallback(async () => {
    if (options?.speechRate !== undefined) return options.speechRate;
    return getSpeechRate();
  }, [options?.speechRate]);

  const playAudio = useCallback(
    async (text: string): Promise<void> => {
      const rate = await getRate();
      const path = await getAudio(text, rate);

      if (path) {
        cleanup();

        const newPlayer = createAudioPlayer({ uri: path });
        playerRef.current = newPlayer;

        return new Promise<void>((resolve) => {
          const subscription = newPlayer.addListener(
            "playbackStatusUpdate",
            (status) => {
              if (status.didJustFinish) {
                setIsSpeaking(false);
                subscription.remove();
                listenerRef.current = null;
                try {
                  newPlayer.remove();
                } catch {}
                if (playerRef.current === newPlayer) playerRef.current = null;
                resolve();
              }
            },
          );
          listenerRef.current = subscription;
          setIsSpeaking(true);
          newPlayer.play();
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
    [getRate, cleanup],
  );

  const speak = useCallback(
    async (text: string) => {
      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrentSpeakingIndex(null);

      cleanup();
      Speech.stop();

      hapticLight();
      await playAudio(text);
    },
    [playAudio, cleanup],
  );

  const speakAll = useCallback(
    async (forms: string[], delayMs = 600) => {
      if (forms.length === 0) return;

      sequenceRef.current.cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cleanup();
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
    [playAudio, cleanup],
  );

  const stop = useCallback(() => {
    sequenceRef.current.cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cleanup();
    Speech.stop();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, [cleanup]);

  return {
    speak,
    speakAll,
    stop,
    isSpeaking,
    isAvailable: true,
    currentSpeakingIndex,
  };
}
