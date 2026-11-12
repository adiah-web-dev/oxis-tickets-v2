import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "../lib/errors";
import { queryKeys } from "../lib/queryKeys";
import {
  createEvent,
  createTicketType,
  deleteEvent,
  deleteTicketType,
  getEvent,
  listEvents,
  listTicketTypes,
  updateEvent,
  updateTicketType,
} from "../services/eventService";

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.list,
    queryFn: listEvents,
    staleTime: 60_000,
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? ""),
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
}

export function useTicketTypes(eventId, options = {}) {
  return useQuery({
    queryKey: queryKeys.ticketTypes.list(eventId),
    queryFn: () => listTicketTypes(eventId),
    enabled: (options.enabled ?? true) && !!eventId,
  });
}

function useInvalidateEvents() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.events.all });
    client.invalidateQueries({ queryKey: queryKeys.ticketTypes.all });
  };
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (payload) => createEvent(payload),
    onSuccess: (event) => {
      invalidate();
      toast.success("Event created", { description: event.name });
    },
    onError: (error) =>
      toast.error("Could not create event", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, payload }) => updateEvent(id, payload),
    onSuccess: (event) => {
      invalidate();
      toast.success("Event updated", { description: event.name });
    },
    onError: (error) =>
      toast.error("Could not update event", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => {
      invalidate();
      toast.success("Event deleted");
    },
    onError: (error) =>
      toast.error("Could not delete event", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useSaveTicketType() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? updateTicketType(id, payload) : createTicketType(payload),
    onSuccess: (type, { id }) => {
      invalidate();
      toast.success(id ? "Ticket type updated" : "Ticket type added", {
        description: type.name,
      });
    },
    onError: (error) =>
      toast.error("Could not save ticket type", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useDeleteTicketType() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id) => deleteTicketType(id),
    onSuccess: () => {
      invalidate();
      toast.success("Ticket type deleted");
    },
    onError: (error) =>
      toast.error("Could not delete ticket type", {
        description: getApiErrorMessage(error),
      }),
  });
}
