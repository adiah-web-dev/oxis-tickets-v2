import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "oxbridge.selectedEventId";
const EventFilterContext = createContext(null);

export function EventFilterProvider({ children }) {
  const [selectedEventId, setState] = useState(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(STORAGE_KEY),
  );

  const setSelectedEventId = useCallback((id) => {
    setState(id);
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ selectedEventId, setSelectedEventId }),
    [selectedEventId, setSelectedEventId],
  );
  return (
    <EventFilterContext.Provider value={value}>
      {children}
    </EventFilterContext.Provider>
  );
}

export function useEventFilter() {
  const ctx = useContext(EventFilterContext);
  if (!ctx)
    throw new Error("useEventFilter must be used inside EventFilterProvider");
  return ctx;
}
