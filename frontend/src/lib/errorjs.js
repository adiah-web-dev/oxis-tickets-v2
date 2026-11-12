import { AxiosError } from "axios";

export function getHttpStatus(error) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

function flatten(value) {
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (value && typeof value === "object")
    return Object.values(value).map(flatten).join(" ");
  return String(value);
}

/** Flattens DRF validation payloads ({"field": ["msg"]}, {"detail": "..."}, ["msg"]) into one sentence. */
export function flattenDrfErrors(body) {
  if (!body) return null;
  if (typeof body === "string")
    return body.length < 300 && !body.trim().startsWith("<") ? body : null;
  if (Array.isArray(body)) return body.map(flatten).join(" ");
  if (typeof body.detail === "string") return body.detail;
  const messages = Object.entries(body)
    .filter(([field]) => field !== "code")
    .map(([field, value]) =>
      field === "non_field_errors"
        ? flatten(value)
        : `${field.replace(/_/g, " ")}: ${flatten(value)}`,
    );
  return messages.length ? messages.join(" · ") : null;
}

/** Field-level errors from a DRF 400 response, for mapping onto form fields. */
export function getFieldErrors(error) {
  if (!(error instanceof AxiosError) || error.response?.status !== 400)
    return {};
  const body = error.response.data;
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  return Object.fromEntries(
    Object.entries(body)
      .filter(([field]) => field !== "detail" && field !== "non_field_errors")
      .map(([field, value]) => [field, flatten(value)]),
  );
}

/** Turns any thrown value into a human-readable message for toasts and error states. */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof AxiosError) {
    if (!error.response)
      return "Unable to reach the server. Check your connection and the API URL.";
    const fromBody = flattenDrfErrors(error.response.data);
    const status = error.response.status;
    if (status === 403)
      return fromBody ?? "Your role does not have permission to do this.";
    if (fromBody) return fromBody;
    if (status === 404) return "The requested record could not be found.";
    if (status === 401)
      return "Your session has expired. Please sign in again.";
    if (status >= 500)
      return "The server encountered an error. Please try again shortly.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
