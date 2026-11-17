import { apiClient } from "../lib/apiClient";
import { cleanParams, toPage } from "./normalize";

/** GET /api/orders/ — filters: status, event, search. */
export async function listOrders(params) {
  const { data } = await apiClient.get("/api/orders/", {
    params: cleanParams(params),
  });
  return toPage(data, params.page);
}

/** GET /api/orders/{id}/ */
export async function getOrder(id) {
  const { data } = await apiClient.get(`/api/orders/${id}/`);
  return data;
}

/**
 * POST /api/orders/create/
 * Only ticket types and quantities are sent — prices and totals are calculated by the backend.
 */
export async function createOrder(payload) {
  const { data } = await apiClient.post("/api/orders/create/", payload);
  return data;
}

/** POST /api/orders/{id}/cancel/ */
export async function cancelOrder(id) {
  const { data } = await apiClient.post(`/api/orders/${id}/cancel/`);
  return data && typeof data === "object" && "id" in data ? data : undefined;
}
