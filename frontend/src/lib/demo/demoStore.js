/**
 * DEMO DATA ONLY.
 * In-memory backend state used exclusively when the data source is "demo".
 * Nothing in this file is used when talking to the real Django API.
 */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
export const rand = seeded(20261112);
const pick = (items) => items[Math.floor(rand() * items.length)];
const hex = (n) =>
  Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join(
    "",
  );
export const uuid = () =>
  `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
export const ticketCode = () =>
  "OXB" +
  Array.from(
    { length: 9 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(rand() * 32)],
  ).join("");

const NOW = new Date();
export const at = (days, hours = 0, minutes = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};
const plusHours = (iso, h) =>
  new Date(new Date(iso).getTime() + h * 3600_000).toISOString();

const FIRST = [
  "Amelia",
  "Kwame",
  "Priya",
  "Mateo",
  "Aaliyah",
  "Ravi",
  "Sophia",
  "Jamal",
  "Chloe",
  "Arjun",
  "Nadia",
  "Marcus",
  "Leah",
  "Dexter",
  "Kayla",
  "Isaiah",
  "Shania",
  "Nikhil",
  "Tamara",
  "Elijah",
];
const LAST = [
  "Ramdial",
  "Mohammed",
  "Charles",
  "Ali",
  "Baptiste",
  "Persad",
  "Joseph",
  "Singh",
  "Williams",
  "Maharaj",
  "Thomas",
  "Lewis",
  "Rampersad",
  "Garcia",
  "Hosein",
  "Phillip",
];
const ERRORS = [
  "SMTP 550: Mailbox unavailable — recipient address rejected.",
  "SMTP 552: Message size exceeds limit (ticket PDFs too large).",
  "Connection timed out while contacting the mail server.",
];

export const DEMO_PASSWORD = "demo1234";

const mkUser = (role, first, last, email, is_superuser = false) => ({
  id: uuid(),
  email,
  first_name: first,
  last_name: last,
  role,
  is_superuser,
  password: DEMO_PASSWORD,
});

function build() {
  const users = [
    mkUser("event_manager", "Alicia", "Mendes", "manager@oxbridge.edu"),
    mkUser("cashier", "Brian", "Ramkissoon", "cashier@oxbridge.edu"),
    mkUser("scanner", "Carla", "Joseph", "scanner@oxbridge.edu"),
    mkUser("staff", "Devon", "Clarke", "staff@oxbridge.edu"),
  ];
  const manager = users[0];

  const baseEvent = (e) => ({
    id: uuid(),
    slug: e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: "",
    venue: "",
    end_date: plusHours(e.start_date, 5),
    sales_start: null,
    sales_end: null,
    status: "draft",
    created_by: manager.id,
    created_by_email: manager.email,
    banner_image: null,
    ticket_text_color: "#FFFFFF",
    ticket_overlay_opacity: 0.45,
    created_at: at(-45),
    updated_at: at(-45),
    ...e,
  });

  const events = [
    baseEvent({
      name: "Winter Gala 2026",
      start_date: at(30, 18, 30),
      status: "published",
      venue: "Great Hall",
      description:
        "Our annual winter celebration with dinner, live steelpan and the senior choir.",
      sales_start: at(-30, 8),
      sales_end: at(29, 23),
    }),
    baseEvent({
      name: "Spring Concert 2027",
      start_date: at(130, 17),
      status: "draft",
      venue: "Performing Arts Centre",
      description:
        "An evening of performances from the junior and senior music departments.",
      sales_start: at(90, 8),
      sales_end: at(129, 23),
    }),
    baseEvent({
      name: "Graduation Ball 2026",
      start_date: at(-5, 19),
      status: "completed",
      venue: "Hyatt Regency Ballroom",
      description:
        "A black-tie celebration for the graduating class and their families.",
      sales_start: at(-60, 8),
      sales_end: at(-6, 23),
    }),
  ];

  const tt = (event, name, price, quantity, max, description) => ({
    id: uuid(),
    event: event.id,
    name,
    price,
    quantity,
    max_per_order: max,
    description,
  });
  const ticketTypes = [
    tt(
      events[0],
      "Adult",
      "150.00",
      300,
      10,
      "Standard admission including dinner.",
    ),
    tt(events[0], "Student", "75.00", 200, 6, "For current Oxbridge students."),
    tt(
      events[0],
      "Child (under 12)",
      "50.00",
      100,
      6,
      "Children accompanied by an adult.",
    ),
    tt(
      events[0],
      "VIP Table Seat",
      "300.00",
      40,
      4,
      "Reserved seating with welcome drinks.",
    ),
    tt(events[1], "Adult", "100.00", 400, 10, ""),
    tt(events[1], "Student", "50.00", 300, 10, ""),
    tt(
      events[2],
      "Guest",
      "200.00",
      250,
      4,
      "Family and friends of graduates.",
    ),
    tt(events[2], "Graduate", "120.00", 120, 1, "One per graduating student."),
  ];

  const orders = [];
  const payments = [];
  const tickets = [];
  const deliveries = [];
  let seq = 1;

  const makeOrder = (event, created, status) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const types = ticketTypes.filter((t) => t.event === event.id);
    const chosen =
      rand() > 0.6 ? [types[0], pick(types.slice(1))] : [pick(types)];
    const items = Array.from(new Set(chosen)).map((type) => {
      const quantity = Math.min(
        type.max_per_order ?? 3,
        1 + Math.floor(rand() * 3),
      );
      return {
        id: uuid(),
        ticket_type: type.id,
        ticket_type_name: type.name,
        quantity,
        unit_price: type.price,
        line_total: (parseFloat(type.price) * quantity).toFixed(2),
      };
    });
    const total = items
      .reduce((s, i) => s + parseFloat(i.line_total), 0)
      .toFixed(2);
    const order = {
      id: uuid(),
      order_number: `OXB-${String(seq++).padStart(5, "0")}`,
      event: event.id,
      event_name: event.name,
      customer_name: `${first} ${last}`,
      customer_email: `${first}.${last}@example.com`.toLowerCase(),
      customer_phone: `868${Math.floor(2000000 + rand() * 7999999)}`,
      status,
      expires_at: status === "pending" ? plusHours(created, 48) : null,
      created_by: users[1].id,
      items,
      total,
      created_at: created,
      updated_at: status === "confirmed" ? plusHours(created, 3) : created,
    };
    orders.push(order);
    const method = pick(["cash", "cash", "bank_transfer", "card", "cheque"]);

    if (status === "confirmed") {
      payments.push({
        id: uuid(),
        order: order.id,
        order_number: order.order_number,
        amount: total,
        method,
        reference:
          method === "bank_transfer" ? `FT${Math.floor(rand() * 1e8)}` : "",
        notes: "Received at front office",
        status: "verified",
        created_at: plusHours(created, 1),
        recorded_by_email: users[1].email,
        verified_by_email: manager.email,
        verified_at: plusHours(created, 3),
      });
      const past = event.status === "completed";
      items.forEach((item) => {
        for (let q = 0; q < item.quantity; q++) {
          const used = past && rand() > 0.12;
          tickets.push({
            id: uuid(),
            ticket_code: ticketCode(),
            status: used ? "used" : "valid",
            order: order.id,
            event: event.id,
            ticket_type: item.ticket_type,
            issued_at: plusHours(created, 3),
            checked_in_at: used ? plusHours(event.start_date, rand()) : null,
            checked_in_by_email: used ? users[2].email : null,
          });
        }
      });
      const failed = rand() > 0.9;
      deliveries.push({
        id: uuid(),
        order: order.id,
        order_number: order.order_number,
        order_status: "confirmed",
        recipient_email: order.customer_email,
        status: failed ? "failed" : "sent",
        attempts: failed ? 3 : 1,
        sent_at: failed ? null : plusHours(created, 3),
        last_error: failed ? pick(ERRORS) : null,
        created_at: plusHours(created, 3),
        updated_at: plusHours(created, 3.2),
        event: event.id,
      });
    } else if (status === "pending" && rand() > 0.4) {
      payments.push({
        id: uuid(),
        order: order.id,
        order_number: order.order_number,
        amount: total,
        method: "bank_transfer",
        reference: `FT${Math.floor(rand() * 1e8)}`,
        notes: "Customer emailed transfer receipt",
        status: "pending",
        created_at: plusHours(created, 2),
        recorded_by_email: users[1].email,
        verified_by_email: null,
        verified_at: null,
      });
    }
  };

  for (let i = 0; i < 22; i++)
    makeOrder(
      events[2],
      at(-34 + Math.floor(i * 1.3), 9 + (i % 9), (i * 7) % 60),
      rand() > 0.92 ? "cancelled" : "confirmed",
    );
  for (let i = 0; i < 34; i++) {
    const roll = rand();
    const recent = i > 27;
    makeOrder(
      events[0],
      recent
        ? at(-1 + (i % 2), 8 + (i % 10), 15)
        : at(-26 + Math.floor(i * 0.8), 9 + (i % 9), 30),
      recent ? "pending" : roll > 0.92 ? "cancelled" : "confirmed",
    );
  }

  orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    users,
    events,
    ticketTypes,
    orders,
    payments,
    tickets,
    deliveries,
    blacklist: new Set(),
  };
}

export const db = build();

/* ---------- Serializers (shape responses like DRF) ---------- */

export function soldFor(typeId) {
  return db.orders
    .filter((o) => o.status !== "cancelled")
    .flatMap((o) => o.items)
    .filter((i) => i.ticket_type === typeId)
    .reduce((s, i) => s + i.quantity, 0);
}

export const serializeTicketType = (t) => ({
  ...t,
  quantity_sold: soldFor(t.id),
});

export const serializeEvent = (e) => ({
  ...e,
  ticket_types: db.ticketTypes
    .filter((t) => t.event === e.id)
    .map(serializeTicketType),
});

export function serializeTicket(t, detail = false) {
  const order = db.orders.find((o) => o.id === t.order);
  const type = db.ticketTypes.find((tt) => tt.id === t.ticket_type);
  const base = {
    id: t.id,
    ticket_code: t.ticket_code,
    status: t.status,
    order_number: order.order_number,
    customer_name: order.customer_name,
    event_name: order.event_name,
    ticket_type: type?.name ?? "Ticket",
    issued_at: t.issued_at,
  };
  return detail
    ? {
        ...base,
        customer_email: order.customer_email,
        checked_in_at: t.checked_in_at,
        checked_in_by_email: t.checked_in_by_email,
      }
    : base;
}

export function serializeDelivery(d) {
  const { event: _event, ...rest } = d;
  return rest;
}
