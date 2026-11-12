import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../lib/errors";
import { queryKeys } from "../lib/queryKeys";
import {
  getTicket,
  getTicketPdf,
  getTicketQr,
  listTickets,
} from "../services/ticketService";

export function useTickets(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: () => listTickets(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useTicket(id) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id ?? ""),
    queryFn: () => getTicket(id),
    enabled: !!id,
  });
}

/** Loads the PNG QR code as an object URL (binary, not JSON). */
export function useTicketQr(id, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.tickets.qr(id ?? ""),
    queryFn: () => getTicketQr(id),
    enabled: !!id && enabled,
    staleTime: Infinity,
  });
  const [url, setUrl] = (useState < string) | (null > null);
  useEffect(() => {
    if (!query.data) return;
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);
  return { url, isLoading: query.isLoading, error: query.error };
}

/** Fetches the ticket PDF and either opens it in a new tab or downloads it. */
export async function openTicketPdf(id, ticketCode, mode) {
  const pending = mode === "view" ? window.open("", "_blank") : null;
  try {
    const blob = await getTicketPdf(id);
    const url = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );
    if (mode === "view" && pending) {
      pending.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${ticketCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    pending?.close();
    toast.error("Ticket PDF could not be loaded", {
      description: getApiErrorMessage(error),
    });
  }
}
