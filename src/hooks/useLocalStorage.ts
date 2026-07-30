import { useState, useEffect, useCallback } from 'react';

/** Persist state to localStorage. */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored != null) return JSON.parse(stored) as T;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
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
