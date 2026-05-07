import { useState, useCallback } from "react";
import type { SortKey } from "../types";

const STORAGE_KEY = "surulist:defaultSort";

export function useSortPreference(): [SortKey, (v: SortKey) => void] {
  const [sort, setSortState] = useState<SortKey>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === "deadline" ? "deadline" : "registDate";
    } catch {
      return "registDate";
    }
  });

  const setSort = useCallback((value: SortKey) => {
    setSortState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return [sort, setSort];
}
