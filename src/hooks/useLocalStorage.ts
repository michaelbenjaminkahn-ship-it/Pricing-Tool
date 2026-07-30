import { useState, useEffect, useCallback } from 'react';

/**
 * Persist state to localStorage.
 *
 * `migrate` runs on whatever was loaded from storage — which may have been
 * written by an older version of the app and be missing keys this one needs.
 * Use it to merge stored data over current defaults so a stale shape can never
 * crash the UI.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
  migrate?: (stored: unknown) => T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored != null) {
        const parsed = JSON.parse(stored) as unknown;
        return migrate ? migrate(parsed) : (parsed as T);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    const fallback = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    return migrate ? migrate(fallback) : fallback;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set];
}
