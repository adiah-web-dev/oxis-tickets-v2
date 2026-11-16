import { apiClient } from "../lib/apiClient";

/** Page size used only when the backend returns an un-paginated list. */
export const CLIENT_PAGE_SIZE = 20;

/**
 * DRF may return a paginated envelope or a bare list depending on view config.
 * Bare lists are paginated client-side so the UI behaves the same either way.
 */
export function toPage(data, page = 1) {
  if (!Array.isArray(data)) return data;
  const start = (page - 1) * CLIENT_PAGE_SIZE;
  return {
    count: data.length,
    next: start + CLIENT_PAGE_SIZE < data.length ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results: data.slice(start, start + CLIENT_PAGE_SIZE),
  };
}

export function toList(data) {
  return Array.isArray(data) ? data : data.results;
}

/** Drops empty values so they are not sent as query params. */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

/** Follows DRF `next` links to collect every result (capped as a safety net). */
export async function fetchAll(url, params = {}, maxPages = 50) {
  const { data } = await apiClient.get(url, {
    params: cleanParams(params ?? {}),
  });
  if (Array.isArray(data)) return data;
  const results = [...(data?.results ?? [])];
  let next = data?.next;
  let pages = 1;
  while (next && pages < maxPages) {
    const res = await apiClient.get(next);
    results.push(...(res.data?.results ?? []));
    next = res.data?.next;
    pages++;
  }
  return results;
}

/** Binary endpoints return a Blob even on error; this extracts the JSON error so messages stay meaningful. */
export async function rethrowBlobError(error) {
  const response = error?.response;
  if (response?.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text());
    } catch {
      response.data = undefined;
    }
  }
  throw error;
}
