import { useCallback, useState } from "react";

const STORAGE_KEY = "oxbridge.scannerPreferences";
const DEFAULTS = { autoCheckIn: false, sound: true };

function read() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return {
      ...DEFAULTS,
      ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
    };
  } catch {
    return DEFAULTS;
  }
}

export function useScannerPreferences() {
  const [prefs, setPrefs] = useState(read);
  const update = useCallback((patch) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return [prefs, update];
}
