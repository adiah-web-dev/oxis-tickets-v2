import { z } from "zod";

/**
 * Ticket type form.
 * ⚠️ Field names below (description, quantity, max_per_order) must match the backend
 * TicketTypeSerializer. Adjust here if the serializer uses different names — the
 * form, table and payload all read from this one place.
 */
export const ticketTypeSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(100),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a price such as 150.00"),
  description: z.string().trim().max(500),
  quantity: z.string().trim().regex(/^\d*$/, "Whole numbers only"),
  max_per_order: z.string().trim().regex(/^\d*$/, "Whole numbers only"),
});

export const TICKET_TYPE_FIELDS = [
  "name",
  "price",
  "description",
  "quantity",
  "max_per_order",
];

export const toNullableInt = (v) => (v === "" ? null : parseInt(v, 10));
