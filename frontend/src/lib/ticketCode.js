/**
 * Extracts a ticket identifier from scanned QR content.
 * Supports raw codes ("TKT-100023"), numeric IDs and URLs such as
 * "https://school.example/tickets/TKT-100023/" or "...?ticket=TKT-100023".
 */
export function parseTicketCode(raw) {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const fromQuery =
      url.searchParams.get("ticket") ??
      url.searchParams.get("code") ??
      url.searchParams.get("id");
    if (fromQuery) return fromQuery.trim();
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? value;
  } catch {
    return value;
  }
}
