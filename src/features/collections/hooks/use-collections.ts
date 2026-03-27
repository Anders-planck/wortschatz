import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import type { CollectionWithStats } from "@/features/collections/types";
import {
  getCollections,
  getUnorganizedCount,
} from "@/features/shared/db/collections-repository";

export function useCollections() {
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [result, count] = await Promise.all([
        getCollections(),
        getUnorganizedCount(),
      ]);
      setCollections(result);
      setUnorganizedCount(count);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { collections, unorganizedCount, isLoading, refresh: load };
}
