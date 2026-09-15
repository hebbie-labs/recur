import { useEffect, useRef } from "react";

function useFormCache<T>(
  key: string,
  values: T,
  setValues: (values: T) => void
) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;

    const cached = localStorage.getItem(key);

    if (cached) {
      setValues(JSON.parse(cached));
    }

    loaded.current = true;
  }, [key, setValues]);

  useEffect(() => {
    if (!loaded.current) return;

    // Caching the draft is a convenience, not essential - values has been
    // observed to transiently hold non-serializable data (seemingly tied to
    // React's dev-mode double-invoke effects on mount), so a failed
    // serialization should be skipped rather than crash the whole app.
    try {
      localStorage.setItem(key, JSON.stringify(values));
    } catch {
      // ignore
    }
  }, [key, values]);

  return {
    clearCache: () => localStorage.removeItem(key),
  };
}

export default useFormCache;