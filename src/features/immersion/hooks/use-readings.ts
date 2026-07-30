import { useState, useCallback } from "react";
import { generateReading } from "../services/immersion-ai-service";
import { saveReading, getReadings } from "../services/readings-repository";
import { getAllWords, getWordCount } from "@/features/shared/db/words-repository";
import type { SavedReading } from "../types";
import {
  PrerequisiteError,
  type PrerequisiteReason,
} from "@/features/shared/types/prerequisites";

export function useReadings() {
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedWordCount, setSavedWordCount] = useState(0);
  const [prerequisiteReason, setPrerequisiteReason] =
    useState<PrerequisiteReason | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, count] = await Promise.all([getReadings(), getWordCount()]);
      setReadings(data);
      setSavedWordCount(count);
      setPrerequisiteReason(count < 3 ? "needs_vocabulary" : null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generate = useCallback(async (level: string) => {
    if (savedWordCount < 3) {
      throw new PrerequisiteError("needs_vocabulary");
    }

    setIsGenerating(true);
    try {
      const words = await getAllWords(undefined, 20);
      // Pick 10-15 random words from vocabulary
      const shuffled = words.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(15, words.length));
      const terms = selected.map((w) => w.term);

      if (terms.length < 3) {
        throw new Error("Not enough vocabulary words");
      }

      const reading = await generateReading(terms, level);
      const id = await saveReading(reading);

      const saved: SavedReading = {
        id,
        ...reading,
        wordCount: reading.content.split(/\s+/).length,
        createdAt: new Date().toISOString(),
      };

      setReadings((prev) => [saved, ...prev]);
      return id;
    } finally {
      setIsGenerating(false);
    }
  }, [savedWordCount]);

  return {
    readings,
    isLoading,
    isGenerating,
    savedWordCount,
    prerequisiteReason,
    load,
    generate,
  };
}
