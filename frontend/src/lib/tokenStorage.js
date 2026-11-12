/** JWT persistence. Tokens are namespaced per data source so demo and live sessions never mix. */
let namespace = "live";

const key = (name) => `oxbridge.${namespace}.${name}`;

export const tokenStorage = {
  setNamespace(ns) {
    namespace = ns;
  },
  getAccess() {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(key("access"));
  },
  getRefresh() {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(key("refresh"));
  },
  set(tokens) {
    window.localStorage.setItem(key("access"), tokens.access);
    if (tokens.refresh)
      window.localStorage.setItem(key("refresh"), tokens.refresh);
  },
  clear() {
    window.localStorage.removeItem(key("access"));
    window.localStorage.removeItem(key("refresh"));
  },
};

export const SESSION_EXPIRED_EVENT = "oxbridge:session-expired";
