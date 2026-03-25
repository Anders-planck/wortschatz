import { useState, useEffect } from "react";

export function useDebouncedSearch(query: string, delay = 400): string {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  return debounced;
}
