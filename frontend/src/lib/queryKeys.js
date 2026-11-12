export const queryKeys = {
  me: ["auth", "me"],
  dashboard: (eventId) => ["dashboard", eventId ?? "all"],
  events: {
    all: ["events"],
    list: ["events", "list"],
    detail: (id) => ["events", "detail", id],
  },
  ticketTypes: {
    all: ["ticket-types"],
    list: (eventId) => ["ticket-types", "list", eventId ?? "all"],
  },
  orders: {
    all: ["orders"],
    list: (params) => ["orders", "list", params],
    detail: (id) => ["orders", "detail", id],
  },
  payments: {
    all: ["payments"],
    list: (params) => ["payments", "list", params],
  },
  tickets: {
    all: ["tickets"],
    list: (params) => ["tickets", "list", params],
    detail: (id) => ["tickets", "detail", id],
    qr: (id) => ["tickets", "qr", id],
  },
  deliveries: {
    all: ["deliveries"],
    list: (params) => ["deliveries", "list", params],
  },
};
