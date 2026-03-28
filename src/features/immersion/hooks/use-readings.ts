import { useState, useCallback } from "react";
import { generateReading } from "../services/immersion-ai-service";
import { saveReading, getReadings } from "../services/readings-repository";
import { getAllWords } from "@/features/shared/db/words-repository";
import type { SavedReading } from "../types";

export function useReadings() {
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReadings();
      setReadings(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generate = useCallback(async (level: string) => {
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
  }, []);

  return { readings, isLoading, isGenerating, load, generate };
}
