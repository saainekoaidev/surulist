import { useState, useCallback } from "react";

const STORAGE_KEY = "surulist:showAllEnabled";

export function useShowAllPreference(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return [enabled, setEnabled];
}
