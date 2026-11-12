import {
  CalendarDays,
  LayoutDashboard,
  Mail,
  Receipt,
  ScanLine,
  Settings,
  Ticket,
  Wallet,
} from "lucide-react";

export const primaryNav = [
  {
    label: "Overview",
    to: "/",
    icon: LayoutDashboard,
    capability: "viewDashboard",
  },
  {
    label: "Events",
    to: "/events",
    icon: CalendarDays,
    capability: "viewEvents",
  },
  { label: "Orders", to: "/orders", icon: Receipt, capability: "viewOrders" },
  {
    label: "Payments",
    to: "/payments",
    icon: Wallet,
    capability: "viewPayments",
  },
  { label: "Tickets", to: "/tickets", icon: Ticket, capability: "viewTickets" },
  { label: "Scanner", to: "/scanner", icon: ScanLine, capability: "checkIn" },
  {
    label: "Email History",
    to: "/emails",
    icon: Mail,
    capability: "viewDeliveries",
  },
];

export const secondaryNav = [
  { label: "Settings", to: "/settings", icon: Settings },
];

/** Derives breadcrumbs (last item = page title) from the current path. */
export function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Overview" }];

  const section = [...primaryNav, ...secondaryNav].find(
    (item) => item.to === `/${segments[0]}`,
  );
  if (!section) return [{ label: "Not found" }];
  if (segments.length === 1) return [{ label: section.label }];

  const child =
    segments[0] === "orders" && segments[1] === "new"
      ? "Create order"
      : segments[0] === "orders"
        ? "Order details"
        : segments[0] === "payments"
          ? "Payment details"
          : segments[0] === "events"
            ? "Event details"
            : "Details";

  return [{ label: section.label, to: section.to }, { label: child }];
}
