import { z } from "zod";

export const orderItemSchema = z.object({
  ticket_type: z.string().min(1, "Choose a ticket type"),
  quantity: z
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Whole numbers only")
    .min(1, "At least 1")
    .max(100, "Too many for one order"),
});

export const orderFormSchema = z
  .object({
    event: z.string().min(1, "Select an event"),
    customer_name: z
      .string()
      .trim()
      .min(2, "Enter the customer’s full name")
      .max(150),
    customer_email: z
      .string()
      .trim()
      .min(1, "Enter an email address")
      .email("Enter a valid email address"),
    customer_phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .regex(
        /^[+\d][\d\s()-]{6,}$/,
        "Use digits, spaces and an optional leading +",
      ),
    items: z.array(orderItemSchema).min(1, "Add at least one ticket type"),
  })
  .superRefine((values, ctx) => {
    const seen = new Set();
    values.items.forEach((item, index) => {
      if (!item.ticket_type) return;
      if (seen.has(item.ticket_type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "ticket_type"],
          message:
            "This ticket type is already in the order — increase its quantity instead",
        });
      }
      seen.add(item.ticket_type);
    });
  });

export const emptyItem = { ticket_type: "", quantity: 1 };

/** Only ticket types and quantities are submitted — the backend prices the order. */
export function toOrderPayload(values) {
  return {
    event: values.event,
    customer_name: values.customer_name.trim(),
    customer_email: values.customer_email.trim(),
    customer_phone: values.customer_phone.trim(),
    items: values.items.map((i) => ({
      ticket_type: i.ticket_type,
      quantity: i.quantity,
    })),
  };
}
