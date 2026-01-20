import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for persisting state to localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  // Reset to default value
  const reset = useCallback(() => {
    setValue(defaultValue);
    localStorage.removeItem(key);
  }, [key, defaultValue]);

  return [value, setValue, reset];
}

/**
 * Hook specifically for managing app settings
 */
export function useSettings() {
  return useLocalStorage('steel-pricing-settings', null);
}

/**
 * Hook for managing calculation history
 */
export function useCalculationHistory<T>(maxItems: number = 10) {
  const [history, setHistory, resetHistory] = useLocalStorage<T[]>('steel-pricing-history', []);

  const addToHistory = useCallback((item: T) => {
    setHistory(prev => {
      const newHistory = [item, ...prev].slice(0, maxItems);
      return newHistory;
    });
  }, [setHistory, maxItems]);

  const clearHistory = useCallback(() => {
    resetHistory();
  }, [resetHistory]);

  return { history, addToHistory, clearHistory };
}

/**
 * Hook for managing saved scenarios
 */
export function useSavedScenarios<T>() {
  const [scenarios, setScenarios, resetScenarios] = useLocalStorage<T[]>('steel-pricing-scenarios', []);

  const saveScenario = useCallback((scenario: T) => {
    setScenarios(prev => [...prev, scenario]);
  }, [setScenarios]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter((s: any) => s.id !== id));
  }, [setScenarios]);

  const updateScenario = useCallback((id: string, updates: Partial<T>) => {
    setScenarios(prev => prev.map((s: any) =>
      s.id === id ? { ...s, ...updates } : s
    ));
  }, [setScenarios]);

  return { scenarios, saveScenario, deleteScenario, updateScenario, resetScenarios };
}
