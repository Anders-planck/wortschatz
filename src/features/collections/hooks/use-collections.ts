import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import type { CollectionWithStats } from "@/features/collections/types";
import { getCollections } from "@/features/shared/db/collections-repository";

export function useCollections() {
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getCollections();
      setCollections(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { collections, isLoading, refresh: load };
}
