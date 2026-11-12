/**
 * DEMO DATA ONLY.
 * An Axios adapter that emulates the Oxbridge Django API (JWT auth, roles,
 * validation and the payment → ticket → email workflow) against in-memory
 * demo data. Attached only when the data source is "demo".
 */
import { AxiosError } from "axios";
import { hasCapability } from "../permissions";
import { demoQrPng, demoTicketPdf } from "./demoFiles";
import {
  db,
  serializeDelivery,
  serializeEvent,
  serializeTicket,
  serializeTicketType,
  soldFor,
  ticketCode,
  uuid,
} from "./demoStore";

const PAGE_SIZE = 10;
const ACCESS_TTL_MS = 10 * 60 * 1000;
const ok = (data, status = 200) => ({ status, data });
const fail = (status, data) => ({ status, data });
const notFound = () =>
  fail(404, { detail: "No object matches the given query." });
const now = () => new Date().toISOString();
const money = (n) => n.toFixed(2);

function paginate(items, path, params) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const start = (page - 1) * PAGE_SIZE;
  const link = (p) =>
    `${path}?${new URLSearchParams({ ...params, page: String(p) }).toString()}`;
  return {
    count: items.length,
    next: start + PAGE_SIZE < items.length ? link(page + 1) : null,
    previous: page > 1 ? link(page - 1) : null,
    results: items.slice(start, start + PAGE_SIZE),
  };
}

const contains = (q, ...fields) =>
  !q || fields.some((f) => f.toLowerCase().includes(q.toLowerCase().trim()));

/* ---------- JWT emulation ---------- */

function issueTokens(user) {
  return {
    access: `demo-access.${user.email}.${Date.now() + ACCESS_TTL_MS}`,
    refresh: `demo-refresh.${user.email}.${uuid()}`,
  };
}

function authenticate(config) {
  const header = String(config.headers?.Authorization ?? "");
  const match = header.match(/^Bearer demo-access\.(.+)\.(\d+)$/);
  if (!match)
    return fail(401, {
      detail: "Authentication credentials were not provided.",
    });
  if (Number(match[2]) < Date.now())
    return fail(401, {
      detail: "Given token not valid for any token type",
      code: "token_not_valid",
    });
  const user = db.users.find((u) => u.email === match[1]);
  return (
    user ?? fail(401, { detail: "User not found", code: "user_not_found" })
  );
}

const publicUser = (u) => {
  const { password: _pw, ...rest } = u;
  return rest;
};

/* ---------- Workflow helpers ---------- */

function confirmOrderIfPaid(order, verifier) {
  const verified = db.payments
    .filter((p) => p.order === order.id && p.status === "verified")
    .reduce((s, p) => s + parseFloat(p.amount), 0);
  if (Math.abs(verified - parseFloat(order.total)) > 0.001) return;
  order.status = "confirmed";
  order.expires_at = null;
  order.updated_at = now();
  order.items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      db.tickets.push({
        id: uuid(),
        ticket_code: ticketCode(),
        status: "valid",
        order: order.id,
        event: order.event,
        ticket_type: item.ticket_type,
        issued_at: now(),
        checked_in_at: null,
        checked_in_by_email: null,
      });
    }
  });
  db.deliveries.unshift({
    id: uuid(),
    order: order.id,
    order_number: order.order_number,
    order_status: "confirmed",
    recipient_email: order.customer_email,
    status: "sent",
    attempts: 1,
    sent_at: now(),
    last_error: null,
    created_at: now(),
    updated_at: now(),
    event: order.event,
  });
  void verifier;
}

function readEventBody(body) {
  const out = {};
  const keys = [
    "name",
    "description",
    "venue",
    "start_date",
    "end_date",
    "sales_start",
    "sales_end",
    "status",
    "ticket_text_color",
    "ticket_overlay_opacity",
  ];
  keys.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k] === "" ? null : body[k];
  });
  if (body.banner_image instanceof File)
    out.banner_image = URL.createObjectURL(body.banner_image);
  if (out.ticket_overlay_opacity !== undefined)
    out.ticket_overlay_opacity = Number(out.ticket_overlay_opacity);
  return out;
}

/* ---------- Router ---------- */

async function route(method, path, params, body, config) {
  let m;

  // Auth (unauthenticated)
  if (path === "/api/auth/login/" && method === "post") {
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === String(body.email ?? "").toLowerCase() &&
        u.password === body.password,
    );
    if (!user)
      return fail(401, {
        detail: "No active account found with the given credentials",
      });
    return ok({ ...issueTokens(user), user: publicUser(user) });
  }
  if (path === "/api/auth/refresh/" && method === "post") {
    const refresh = String(body.refresh ?? "");
    const email = refresh.match(/^demo-refresh\.(.+)\.[0-9a-f-]+$/)?.[1];
    const user = db.users.find((u) => u.email === email);
    if (!user || db.blacklist.has(refresh))
      return fail(401, {
        detail: "Token is blacklisted",
        code: "token_not_valid",
      });
    db.blacklist.add(refresh);
    return ok(issueTokens(user));
  }

  const auth = authenticate(config);
  if ("status" in auth) return auth;
  const user = auth;
  const deny = (cap) =>
    hasCapability(user, cap)
      ? null
      : fail(403, {
          detail: "You do not have permission to perform this action.",
        });

  if (path === "/api/auth/logout/" && method === "post") {
    db.blacklist.add(String(body.refresh ?? ""));
    return ok(undefined, 205);
  }
  if (path === "/api/auth/me/") {
    if (method === "patch") {
      if (typeof body.first_name === "string")
        user.first_name = body.first_name;
      if (typeof body.last_name === "string") user.last_name = body.last_name;
    }
    return ok(publicUser(user));
  }

  // Ticket types (must precede /api/events/{id}/)
  if (path === "/api/events/ticket-types/") {
    if (method === "get")
      return ok(
        db.ticketTypes
          .filter((t) => !params.event || t.event === params.event)
          .map(serializeTicketType),
      );
    const denied = deny("manageEvents");
    if (denied) return denied;
    if (!body.name) return fail(400, { name: ["This field is required."] });
    if (!db.events.some((e) => e.id === body.event))
      return fail(400, { event: ["Invalid pk - object does not exist."] });
    if (!/^\d+(\.\d{1,2})?$/.test(String(body.price ?? "")))
      return fail(400, { price: ["A valid number is required."] });
    const type = {
      id: uuid(),
      event: String(body.event),
      name: String(body.name),
      price: money(parseFloat(String(body.price))),
      description: String(body.description ?? ""),
      quantity: body.quantity == null ? null : Number(body.quantity),
      max_per_order:
        body.max_per_order == null ? null : Number(body.max_per_order),
    };
    db.ticketTypes.push(type);
    return ok(serializeTicketType(type), 201);
  }
  if ((m = path.match(/^\/api\/events\/ticket-types\/([^/]+)\/$/))) {
    const type = db.ticketTypes.find((t) => t.id === m[1]);
    if (!type) return notFound();
    if (method === "get") return ok(serializeTicketType(type));
    const denied = deny("manageEvents");
    if (denied) return denied;
    if (method === "delete") {
      if (soldFor(type.id) > 0)
        return fail(400, {
          detail: "This ticket type has orders and cannot be deleted.",
        });
      db.ticketTypes.splice(db.ticketTypes.indexOf(type), 1);
      return ok(undefined, 204);
    }
    Object.assign(
      type,
      body,
      body.price !== undefined
        ? { price: money(parseFloat(String(body.price))) }
        : {},
    );
    return ok(serializeTicketType(type));
  }

  // Events
  if (path === "/api/events/") {
    if (method === "get")
      return ok(
        [...db.events]
          .sort((a, b) => b.start_date.localeCompare(a.start_date))
          .map(serializeEvent),
      );
    const denied = deny("manageEvents");
    if (denied) return denied;
    const data = readEventBody(body);
    const errors = {};
    if (!data.name) errors.name = ["This field is required."];
    if (!data.start_date) errors.start_date = ["This field is required."];
    if (!data.end_date) errors.end_date = ["This field is required."];
    if (data.start_date && data.end_date && data.end_date < data.start_date)
      errors.end_date = ["End date must be after the start date."];
    if (Object.keys(errors).length) return fail(400, errors);
    const event = {
      id: uuid(),
      slug: String(data.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
      description: "",
      venue: "",
      end_date: "",
      sales_start: null,
      sales_end: null,
      status: "draft",
      banner_image: null,
      ticket_text_color: "#FFFFFF",
      ticket_overlay_opacity: 0.45,
      created_by: user.id,
      created_by_email: user.email,
      created_at: now(),
      updated_at: now(),
      name: "",
      start_date: "",
      ...data,
    };
    db.events.unshift(event);
    return ok(serializeEvent(event), 201);
  }
  if ((m = path.match(/^\/api\/events\/([^/]+)\/$/))) {
    const event = db.events.find((e) => e.id === m[1]);
    if (!event) return notFound();
    if (method === "get") return ok(serializeEvent(event));
    const denied = deny("manageEvents");
    if (denied) return denied;
    if (method === "delete") {
      if (db.orders.some((o) => o.event === event.id))
        return fail(400, {
          detail:
            "Events with orders cannot be deleted. Cancel the event instead.",
        });
      db.events.splice(db.events.indexOf(event), 1);
      return ok(undefined, 204);
    }
    Object.assign(event, readEventBody(body), { updated_at: now() });
    db.orders
      .filter((o) => o.event === event.id)
      .forEach((o) => (o.event_name = event.name));
    return ok(serializeEvent(event));
  }

  // Orders
  if (path === "/api/orders/" && method === "get") {
    const denied = deny("viewOrders");
    if (denied) return denied;
    const rows = db.orders.filter(
      (o) =>
        (!params.status || o.status === params.status) &&
        (!params.event || o.event === params.event) &&
        contains(
          params.search,
          o.order_number,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
        ),
    );
    return ok(paginate(rows, path, params));
  }
  if (path === "/api/orders/create/" && method === "post") {
    const denied = deny("createOrders");
    if (denied) return denied;
    const event = db.events.find((e) => e.id === body.event);
    if (!event)
      return fail(400, { event: ["Invalid pk - object does not exist."] });
    if (event.status !== "published")
      return fail(400, {
        event: ["Tickets can only be sold for published events."],
      });
    const t = now();
    if (
      (event.sales_start && t < event.sales_start) ||
      (event.sales_end && t > event.sales_end)
    )
      return fail(400, { event: ["Ticket sales are closed for this event."] });
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length)
      return fail(400, { items: ["Add at least one ticket."] });
    const items = [];
    for (const raw of rawItems) {
      const type = db.ticketTypes.find(
        (tt) => tt.id === raw.ticket_type && tt.event === event.id,
      );
      if (!type)
        return fail(400, {
          items: ["One of the ticket types does not belong to this event."],
        });
      const qty = Number(raw.quantity);
      if (!Number.isInteger(qty) || qty < 1)
        return fail(400, {
          items: [`Quantity for ${type.name} must be at least 1.`],
        });
      if (type.max_per_order && qty > type.max_per_order)
        return fail(400, {
          items: [
            `A maximum of ${type.max_per_order} ${type.name} ticket(s) can be bought per order.`,
          ],
        });
      if (type.quantity != null && soldFor(type.id) + qty > type.quantity)
        return fail(400, {
          items: [
            `Only ${Math.max(0, type.quantity - soldFor(type.id))} ${type.name} ticket(s) remain.`,
          ],
        });
      items.push({
        id: uuid(),
        ticket_type: type.id,
        ticket_type_name: type.name,
        quantity: qty,
        unit_price: type.price,
        line_total: money(parseFloat(type.price) * qty),
      });
    }
    if (!String(body.customer_name ?? "").trim())
      return fail(400, { customer_name: ["This field is required."] });
    const order = {
      id: uuid(),
      order_number: `OXB-${String(db.orders.length + 1).padStart(5, "0")}`,
      event: event.id,
      event_name: event.name,
      customer_name: String(body.customer_name),
      customer_email: String(body.customer_email),
      customer_phone: String(body.customer_phone),
      status: "pending",
      expires_at: new Date(Date.now() + 48 * 3600_000).toISOString(),
      created_by: user.id,
      items,
      total: money(items.reduce((s, i) => s + parseFloat(i.line_total), 0)),
      created_at: t,
      updated_at: t,
    };
    db.orders.unshift(order);
    return ok(order, 201);
  }
  if ((m = path.match(/^\/api\/orders\/([^/]+)\/$/)) && method === "get") {
    const denied = deny("viewOrders");
    if (denied) return denied;
    const order = db.orders.find((o) => o.id === m[1]);
    return order ? ok(order) : notFound();
  }
  if (
    (m = path.match(/^\/api\/orders\/([^/]+)\/cancel\/$/)) &&
    method === "post"
  ) {
    const denied = deny("cancelOrders");
    if (denied) return denied;
    const order = db.orders.find((o) => o.id === m[1]);
    if (!order) return notFound();
    if (order.status === "cancelled")
      return fail(400, { detail: "This order is already cancelled." });
    order.status = "cancelled";
    order.updated_at = now();
    db.tickets
      .filter((tk) => tk.order === order.id && tk.status === "valid")
      .forEach((tk) => (tk.status = "cancelled"));
    db.payments
      .filter((p) => p.order === order.id && p.status === "pending")
      .forEach((p) => (p.status = "rejected"));
    return ok(order);
  }

  // Payments
  if (path === "/api/payments/" && method === "get") {
    const denied = deny("viewPayments");
    if (denied) return denied;
    const rows = [...db.payments]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .filter(
        (p) =>
          (!params.status || p.status === params.status) &&
          (!params.order || p.order === params.order),
      );
    return ok(paginate(rows, path, params));
  }
  if (path === "/api/payments/create/" && method === "post") {
    const denied = deny("recordPayments");
    if (denied) return denied;
    const order = db.orders.find((o) => o.id === body.order);
    if (!order)
      return fail(400, { order: ["Invalid pk - object does not exist."] });
    if (order.status !== "pending")
      return fail(400, {
        order: [`Payments cannot be recorded for a ${order.status} order.`],
      });
    if (order.expires_at && order.expires_at < now())
      return fail(400, { order: ["This order has expired."] });
    const amount = parseFloat(String(body.amount ?? ""));
    if (!(amount > 0))
      return fail(400, { amount: ["Enter an amount greater than zero."] });
    const recorded = db.payments
      .filter(
        (p) =>
          p.order === order.id &&
          (p.status === "pending" || p.status === "verified"),
      )
      .reduce((s, p) => s + parseFloat(p.amount), 0);
    if (recorded + amount > parseFloat(order.total) + 0.001)
      return fail(400, {
        amount: [
          `Amount exceeds the outstanding balance of ${money(parseFloat(order.total) - recorded)}.`,
        ],
      });
    const payment = {
      id: uuid(),
      order: order.id,
      order_number: order.order_number,
      amount: money(amount),
      method: body.method,
      reference,
      notes,
      status: "pending",
      created_at: now(),
      recorded_by_email: user.email,
      verified_by_email: null,
      verified_at: null,
    };
    db.payments.unshift(payment);
    return ok(payment, 201);
  }
  if (
    (m = path.match(/^\/api\/payments\/([^/]+)\/(verify|reject)\/$/)) &&
    method === "post"
  ) {
    const denied = deny("verifyPayments");
    if (denied) return denied;
    const payment = db.payments.find((p) => p.id === m[1]);
    if (!payment) return notFound();
    if (payment.status !== "pending")
      return fail(400, {
        detail: `Only pending payments can be ${m[2] === "verify" ? "verified" : "rejected"}.`,
      });
    payment.status = m[2] === "verify" ? "verified" : "rejected";
    if (m[2] === "verify") {
      payment.verified_by_email = user.email;
      payment.verified_at = now();
      const order = db.orders.find((o) => o.id === payment.order);
      if (order) confirmOrderIfPaid(order, user);
    }
    return ok(payment);
  }
  if ((m = path.match(/^\/api\/payments\/([^/]+)\/$/)) && method === "get") {
    const denied = deny("viewPayments");
    if (denied) return denied;
    const payment = db.payments.find((p) => p.id === m[1]);
    return payment ? ok(payment) : notFound();
  }

  // Deliveries (must precede /api/tickets/{id}/)
  if (path === "/api/tickets/deliveries/" && method === "get") {
    const denied = deny("viewDeliveries");
    if (denied) return denied;
    const rows = db.deliveries.filter(
      (d) =>
        (!params.status || d.status === params.status) &&
        (!params.order || d.order === params.order) &&
        (!params.event || d.event === params.event),
    );
    return ok(paginate(rows.map(serializeDelivery), path, params));
  }
  if ((m = path.match(/^\/api\/tickets\/deliveries\/([^/]+)\/(retry\/)?$/))) {
    const denied = deny(m[2] ? "retryDeliveries" : "viewDeliveries");
    if (denied) return denied;
    const delivery = db.deliveries.find((d) => d.id === m[1]);
    if (!delivery) return notFound();
    if (!m[2]) return ok(serializeDelivery(delivery));
    if (delivery.status === "sent")
      return fail(400, { detail: "This delivery has already been sent." });
    if (delivery.status === "pending")
      return fail(400, {
        detail: "A delivery attempt is already in progress.",
      });
    delivery.attempts += 1;
    delivery.status = "sent";
    delivery.sent_at = now();
    delivery.last_error = null;
    delivery.updated_at = now();
    return ok(serializeDelivery(delivery));
  }

  // Tickets
  if (path === "/api/tickets/check-in/" && method === "post") {
    const denied = deny("checkIn");
    if (denied) return denied;
    const ticket = db.tickets.find(
      (t) =>
        t.ticket_code.toLowerCase() ===
        String(body.ticket_code ?? "")
          .toLowerCase()
          .trim(),
    );
    if (!ticket) return fail(404, { detail: "Ticket not found." });
    const order = db.orders.find((o) => o.id === ticket.order);
    if (order?.status !== "confirmed")
      return fail(400, { detail: "This ticket’s order is not confirmed." });
    if (ticket.status === "used")
      return fail(400, {
        detail: "Ticket has already been used.",
        ticket: serializeTicket(ticket, true),
      });
    if (ticket.status === "cancelled")
      return fail(400, { detail: "This ticket has been cancelled." });
    ticket.status = "used";
    ticket.checked_in_at = now();
    ticket.checked_in_by_email = user.email;
    return ok(serializeTicket(ticket, true));
  }
  if (path === "/api/tickets/" && method === "get") {
    const denied = deny("viewTickets");
    if (denied) return denied;
    const rows = db.tickets
      .filter(
        (t) =>
          (!params.event || t.event === params.event) &&
          (!params.order || t.order === params.order) &&
          (!params.status || t.status === params.status),
      )
      .map((t) => serializeTicket(t))
      .filter((t) =>
        contains(
          params.search,
          t.ticket_code,
          t.order_number,
          t.customer_name,
          db.orders.find((o) => o.order_number === t.order_number)
            ?.customer_email ?? "",
        ),
      )
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
    return ok(paginate(rows, path, params));
  }
  if (
    (m = path.match(/^\/api\/tickets\/([^/]+)\/(qr\/|pdf\/)?$/)) &&
    method === "get"
  ) {
    const denied = deny("viewTickets");
    if (denied) return denied;
    const ticket = db.tickets.find((t) => t.id === m[1]);
    if (!ticket) return notFound();
    const data = serializeTicket(ticket, true);
    if (m[2] === "qr/") return ok(await demoQrPng(ticket.ticket_code));
    if (m[2] === "pdf/") {
      const event = db.events.find((e) => e.id === ticket.event);
      return ok(
        demoTicketPdf(data.event_name, [
          `Date: ${event ? new Date(event.start_date).toLocaleString("en-GB") : ""}`,
          `Venue: ${event?.venue ?? ""}`,
          `Customer: ${data.customer_name}`,
          `Ticket type: ${data.ticket_type}`,
          `Ticket code: ${data.ticket_code}`,
          `Order: ${data.order_number}`,
        ]),
      );
    }
    return ok(data);
  }

  return notFound();
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const mockAdapter = async (config) => {
  await delay(220 + Math.random() * 300);
  const method = (config.method ?? "get").toLowerCase();
  const url = new URL(config.url ?? "/", "http://demo.local");
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  const params = Object.fromEntries(url.searchParams.entries());
  Object.entries(config.params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params[k] = String(v);
  });
  let body = {};
  if (config.data instanceof FormData)
    body = Object.fromEntries(config.data.entries());
  else if (typeof config.data === "string" && config.data)
    body = JSON.parse(config.data);
  else if (config.data && typeof config.data === "object") body = config.data;

  const result = await route(method, path, params, body, config);
  const isBinary = result.data instanceof Blob;
  // Clone JSON so cached query data never shares references with the mutable demo store.
  const data = isBinary
    ? result.data
    : result.data === undefined
      ? ""
      : JSON.parse(JSON.stringify(result.data));
  const response = {
    data,
    status: result.status,
    statusText: "",
    headers: {},
    config,
  };
  if (result.status >= 400)
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      String(result.status),
      config,
      null,
      response,
    );
  return response;
};
