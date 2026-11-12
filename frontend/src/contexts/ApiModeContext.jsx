import { createContext, useContext } from "react";

const ApiModeContext = createContext("live");

export function ApiModeProvider({ mode, children }) {
  return (
    <ApiModeContext.Provider value={mode}>{children}</ApiModeContext.Provider>
  );
}

export function useApiMode() {
  return useContext(ApiModeContext);
}
