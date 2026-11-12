import { mockAdapter } from "./demo/mockAdapter";
import { SESSION_EXPIRED_EVENT, tokenStorage } from "./tokenStorage";
const env = (import.meta & { env }).env;

export const API_BASE_URL = env?.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json" },
  timeout: 20000,
});

const AUTH_PATHS = ["/api/auth/login/", "/api/auth/refresh/"];
const isAuthPath = (url) => !!url && AUTH_PATHS.some((p) => url.includes(p));

apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access && !isAuthPath(config.url))
    config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// Automatic access-token refresh (single-flight, rotation aware)

let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token");
  const { data } = await apiClient.post("/api/auth/refresh/", { refresh });
  // The backend returns a new refresh token and blacklists the old one.
  tokenStorage.set({ access: data.access, refresh: data.refresh });
  return data.access;
}

function expireSession() {
  tokenStorage.clear();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = (error.config & { _retried }) | undefined;
    if (
      !original ||
      error.response.status !== 401 ||
      original._retried ||
      isAuthPath(original.url)
    ) {
      throw error;
    }

    if (!tokenStorage.getRefresh()) {
      expireSession();
      throw error;
    }
    original._retried = true;
    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const access = await refreshInFlight;
      original.headers.Authorization = `Bearer ${access}`;
      return apiClient(original);
    } catch {
      expireSession();
      throw error;
    }
  },
);

// Data Source
const networkAdapter = apiClient.defaults.adapter;
let currentMode = "live";

// Switches between the real Django backend and the demo backend
export function setApiMode(mode) {
  tokenStorage.setNamespace(mode);
  if (mode === currentMode) return;
  currentMode = mode;
  apiClient.defaults.adapter = mode === "demo" ? mockAdapter : networkAdapter;
}

export function getApiMode() {
  return currentMode;
}
