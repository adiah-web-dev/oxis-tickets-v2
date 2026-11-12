import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { hasCapability } from "../lib/permissions";
import { queryClient } from "../lib/queryClient";
import { SESSION_EXPIRED_EVENT, tokenStorage } from "../lib/tokenStorage";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [status, setStatus] = useState("loading");

  // Restore an existing session (the client refreshes the access token automatically if needed).
  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
      setStatus("unauthenticated");
      return;
    }
    authService
      .getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setUserState(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUserState(null);
      setStatus((current) => {
        if (current === "authenticated")
          toast.error("Your session has expired", {
            description: "Please sign in again.",
          });
        return "unauthenticated";
      });
      queryClient.clear();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    tokenStorage.set({ access: result.access, refresh: result.refresh });
    const me = result.user ?? (await authService.getCurrentUser());
    queryClient.clear();
    setUserState(me);
    setStatus("authenticated");
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) await authService.logout(refresh);
    } catch {
      // The session ends locally even if the blacklist request fails.
    }
    tokenStorage.clear();
    queryClient.clear();
    setUserState(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
      setUser: setUserState,
      can: (cap) => hasCapability(user, cap),
    }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
