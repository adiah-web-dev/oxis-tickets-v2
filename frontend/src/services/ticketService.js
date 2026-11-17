import { apiClient } from "../lib/apiClient";
import { cleanParams, rethrowBlobError, toPage } from "./normalize";

/** GET /api/tickets/ — filters: event, order, status, search. */
export async function listTickets(params) {
  const { data } = await apiClient.get("/api/tickets/", {
    params: cleanParams(params),
  });
  return toPage(data, params.page);
}

/** GET /api/tickets/{id}/ */
export async function getTicket(id) {
  const { data } = await apiClient.get(`/api/tickets/${id}/`);
  return data;
}

/** Finds a ticket by its exact code via the list search (used for previewing a scan). */
export async function findTicketByCode(code) {
  const { results } = await listTickets({ search: code });
  return (
    results.find((t) => t.ticket_code.toLowerCase() === code.toLowerCase()) ??
    null
  );
}

/** POST /api/tickets/check-in/ — the backend validates and marks the ticket as used. */
export async function checkInTicket(ticketCode) {
  const { data } = await apiClient.post("/api/tickets/check-in/", {
    ticket_code: ticketCode,
  });
  if (data && "ticket_code" in data) return data;
  if (data && "ticket" in data && data.ticket) return data.ticket;
  return null;
}

/** GET /api/tickets/{id}/qr/ — PNG image. */
export async function getTicketQr(id) {
  try {
    const { data } = await apiClient.get(`/api/tickets/${id}/qr/`, {
      responseType: "blob",
      // headers: { Accept: "image/png" },
      headers: { Accept: "application/json" },
    });
    return data;
  } catch (error) {
    return rethrowBlobError(error);
  }
}

/** GET /api/tickets/{id}/pdf/ — PDF attachment. */
export async function getTicketPdf(id) {
  try {
    const { data } = await apiClient.get(`/api/tickets/${id}/pdf/`, {
      responseType: "blob",
      // headers: { Accept: "application/pdf" },
      headers: { Accept: "application/json" },
    });
    return data;
  } catch (error) {
    return rethrowBlobError(error);
  }
}
