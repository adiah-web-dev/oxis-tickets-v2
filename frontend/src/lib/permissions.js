/**
 * Frontend capabilities derived from the user's role. These only shape the UI —
 * the Django backend remains the authority and may still return 403.
 */
const ALL = [
  "viewDashboard",
  "viewEvents",
  "manageEvents",
  "viewOrders",
  "createOrders",
  "cancelOrders",
  "viewPayments",
  "recordPayments",
  "verifyPayments",
  "viewTickets",
  "downloadTickets",
  "checkIn",
  "viewDeliveries",
  "retryDeliveries",
];

const ROLE_CAPABILITIES = {
  event_manager: ALL,
  cashier: [
    "viewDashboard",
    "viewEvents",
    "viewOrders",
    "createOrders",
    "cancelOrders",
    "viewPayments",
    "recordPayments",
    "viewTickets",
    "downloadTickets",
  ],
  scanner: ["viewEvents", "checkIn"],
  staff: ["viewEvents"],
};

export const roleLabels = {
  event_manager: "Event manager",
  cashier: "Cashier",
  scanner: "Scanner",
  staff: "Staff",
};

export function hasCapability(user, capability) {
  if (!user) return false;
  if (user.is_superuser) return true;
  return ROLE_CAPABILITIES[user.role]?.includes(capability) ?? false;
}

/** Best landing page for a user's role. */
export function homePathFor(user) {
  if (hasCapability(user, "viewDashboard")) return "/";
  if (hasCapability(user, "checkIn")) return "/scanner";
  return "/events";
}
