import { apiClient } from "../lib/apiClient";
import { fetchAll } from "./normalize";

/** GET /api/events/ (all pages). */
export async function listEvents() {
  // const events = await fetchAll("/api/events/");
  return fetchAll("/api/events/");
  // console.log("Events returned by api", events);
  // return events;
}

/** GET /api/events/{id}/ */
export async function getEvent(id) {
  const { data } = await apiClient.get(`/api/events/${id}/`);
  return data;
}

/** JSON normally; multipart/form-data when banner artwork is attached. */
function toRequestBody(payload) {
  const { banner_image, ...rest } = payload;
  if (!(banner_image instanceof File)) return rest;
  const form = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined)
      form.append(key, value === null ? "" : String(value));
  });
  form.append("banner_image", banner_image);
  return form;
}

/** POST /api/events/ — the creator is assigned by the backend. */
export async function createEvent(payload) {
  const { data } = await apiClient.post("/api/events/", toRequestBody(payload));
  return data;
}

/** PATCH /api/events/{id}/ */
export async function updateEvent(id, payload) {
  console.log("Banner Image:", payload.banner_image);
  console.log("Is File:", payload.banner_image instanceof File);

  const body = toRequestBody(payload);
  console.log("Request body is FormData:", body instanceof FormData);

  const { data } = await apiClient.patch(
    `/api/events/${id}/`,
    toRequestBody(payload),
  );
  return data;
}

/** DELETE /api/events/{id}/ */
export async function deleteEvent(id) {
  await apiClient.delete(`/api/events/${id}/`);
}

/** GET /api/events/ticket-types/?event={id} */
export async function listTicketTypes(eventId) {
  const all = await fetchAll(
    "/api/events/ticket-types/",
    eventId ? { event: eventId } : {},
  );
  // Defensive: keep only the requested event even if the filter isn't applied server-side.
  return eventId ? all.filter((t) => String(t.event) === String(eventId)) : all;
}

/** POST /api/events/ticket-types/ */
export async function createTicketType(payload) {
  const { data } = await apiClient.post("/api/events/ticket-types/", payload);
  return data;
}

/** PATCH /api/events/ticket-types/{id}/ */
export async function updateTicketType(id, payload) {
  const { data } = await apiClient.patch(
    `/api/events/ticket-types/${id}/`,
    payload,
  );
  return data;
}

/** DELETE /api/events/ticket-types/{id}/ */
export async function deleteTicketType(id) {
  await apiClient.delete(`/api/events/ticket-types/${id}/`);
}
