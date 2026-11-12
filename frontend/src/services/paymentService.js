import { apiClient } from "../lib/apiClient";
import { cleanParams, fetchAll, toPage } from "./normalize";

/** GET /api/payments/ */
export async function listPayments(params) {
  const { data } = await apiClient.get("/api/payments/", {
    params: cleanParams(params),
  });
  return toPage(data, params.page);
}

/** All payments recorded against one order. Filtered defensively in case `order` isn't a server-side filter. */
export async function listOrderPayments(orderId) {
  const all = await fetchAll("/api/payments/", { order: orderId });
  return all.filter((p) => String(p.order) === String(orderId));
}

/** GET /api/payments/{id}/ */
export async function getPayment(id) {
  const { data } = await apiClient.get(`/api/payments/${id}/`);
  return data;
}

/** POST /api/payments/create/ */
export async function recordPayment(payload) {
  const { data } = await apiClient.post("/api/payments/create/", payload);
  return data;
}

/** POST /api/payments/{id}/verify/ — event managers only. May confirm the order and trigger ticket generation. */
export async function verifyPayment(id) {
  const { data } = await apiClient.post(`/api/payments/${id}/verify/`);
  return data;
}

/** POST /api/payments/{id}/reject/ — event managers only. */
export async function rejectPayment(id) {
  const { data } = await apiClient.post(`/api/payments/${id}/reject/`);
  return data;
}
