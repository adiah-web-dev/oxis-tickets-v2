import { apiClient } from "../lib/apiClient";

/** POST /api/auth/login/ */
export async function login(email, password) {
  const { data } = await apiClient.post("/api/auth/login/", {
    email,
    password,
  });
  return data;
}

/** POST /api/auth/logout/ — blacklists the refresh token. */
export async function logout(refresh) {
  await apiClient.post("/api/auth/logout/", { refresh });
}

/** GET /api/auth/me/ */
export async function getCurrentUser() {
  const { data } = await apiClient.get("/api/auth/me/");
  return data;
}

/** PATCH /api/auth/me/ — editable fields are defined by the backend UserSerializer. */
export async function updateCurrentUser(payload) {
  const { data } = await apiClient.patch("/api/auth/me/", payload);
  return data;
}
