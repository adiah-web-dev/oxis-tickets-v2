import { apiClient } from "../lib/apiClient";
import { cleanParams, toPage } from "./normalize";

/** GET /api/tickets/deliveries/ — filters: status, order, event. Event managers only. */
export async function listDeliveries(params) {
  const { data } = await apiClient.get("/api/tickets/deliveries/", {
    params: cleanParams(params),
  });
  return toPage(data, params.page);
}

/** GET /api/tickets/deliveries/{id}/ */
export async function getDelivery(id) {
  const { data } = await apiClient.get(`/api/tickets/deliveries/${id}/`);
  return data;
}

/** POST /api/tickets/deliveries/{id}/retry/ — only for failed deliveries. */
export async function retryDelivery(id) {
  const { data } = await apiClient.post(`/api/tickets/deliveries/${id}/retry/`);
  return data;
}
