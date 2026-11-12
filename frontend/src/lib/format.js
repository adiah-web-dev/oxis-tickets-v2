import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

export const CURRENCY = "TTD";

const currencyFormatter = new Intl.NumberFormat("en-TT", {
  style: "currency",
  currency: CURRENCY,
});
const numberFormatter = new Intl.NumberFormat("en-GB");

export function toNumber(value) {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value) {
  return currencyFormatter.format(toNumber(value));
}

export function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

export function formatDate(iso, pattern = "d MMM yyyy") {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso) {
  return formatDate(iso, "d MMM yyyy, HH:mm");
}

export function formatRelative(iso) {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function isPastDate(iso) {
  if (!iso) return false;
  try {
    return isPast(parseISO(iso));
  } catch {
    return false;
  }
}

export function initials(name) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function userDisplayName(user) {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
}

/** "2026-12-12T18:30:00Z" → value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null;
}
