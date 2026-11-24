import { format, subDays } from "date-fns";
import { toNumber } from "../lib/format";
import { fetchAll } from "./normalize";

/**
 * The backend has no dashboard endpoint, so overview figures are composed from
 * GET /api/orders/ and GET /api/tickets/ (optionally scoped by event).
 */
export async function getDashboard(eventId) {
  const filter = eventId ? { event: eventId } : {};
  const [orders, tickets, payments] = await Promise.all([
    fetchAll("/api/orders/", filter),
    fetchAll("/api/tickets/", filter),
    fetchAll("/api/payments/"),
  ]);

  const revenuePayments = payments.filter(
    (p) =>
      p.status === "verified" &&
      !p.is_voided &&
      (!eventId || String(p.order_event) === String(eventId)),
  );
  const activeTickets = tickets.filter((t) => t.status !== "cancelled");
  const used = activeTickets.filter((t) => t.status === "used").length;

  const days = new Map();
  for (let i = 29; i >= 0; i--)
    days.set(format(subDays(new Date(), i), "yyyy-MM-dd"), {
      tickets: 0,
      revenue: 0,
    });
  activeTickets.forEach((t) => {
    const bucket = days.get(t.issued_at?.slice(0, 10));
    if (bucket) bucket.tickets += 1;
  });
  revenuePayments.forEach((p) => {
    const bucket = days.get(
      p.verified_at?.slice(0, 10) ?? p.received_at?.slice(0, 10),
    );
    if (bucket) bucket.revenue += toNumber(p.amount);
  });

  return {
    total_orders: orders.filter((o) => o.status !== "cancelled").length,
    pending_orders: orders.filter((o) => o.status === "pending").length,
    total_tickets: activeTickets.length,
    checked_in: used,
    remaining: activeTickets.length - used,
    revenue: revenuePayments.reduce((sum, p) => sum + toNumber(p.amount), 0),
    sales_over_time: Array.from(days.entries()).map(([date, v]) => ({
      date,
      ...v,
    })),
    recent_orders: [...orders]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6),
  };
}
