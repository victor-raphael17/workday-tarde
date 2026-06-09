/**
 * Thin client for the CA Pharmacy API.
 *
 * The base URL comes from Vite's `VITE_API_BASE_URL` (see frontend/.env), with a
 * sensible localhost default so `npm run dev` works with `docker compose up`.
 * Every helper unwraps the `{ data: ... }` success envelope and throws an
 * `ApiError` carrying the server's `{ status, message, fields }` on failure.
 */

const API_BASE = (
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "http://localhost:8080"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, fields = null) {
    super(message || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

// ---------------------------------------------------------------------------
// Session / bearer-token storage
// ---------------------------------------------------------------------------

const SESSION_KEY = "ca_pharmacy_session";

/**
 * The signed-in session lives in localStorage ("Keep me signed in") or
 * sessionStorage (this tab only). `auth` reads from whichever holds it and
 * exposes the bearer token the API client attaches to every request.
 */
export const auth = {
  get session() {
    const raw =
      window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  get token() {
    return this.session?.token || null;
  },

  get user() {
    return this.session?.user || null;
  },

  save(session, remember = true) {
    this.clear();
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clear() {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  },

  /** Redirect to the sign-in page (relative to the current /pages/ file). */
  redirectToLogin() {
    window.location.replace("login.html");
  },
};

async function request(path, { method = "GET", body, query } = {}) {
  let url = `${API_BASE}${path}`;

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const token = auth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(0, `Cannot reach the API at ${API_BASE}. Is it running?`);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload && payload.error ? payload.error : {};
    // An expired/invalid session on any page but the login flow: clear and
    // bounce to sign-in so the user isn't stuck on a broken screen.
    if (response.status === 401 && path !== "/api/auth/login") {
      auth.clear();
      auth.redirectToLogin();
    }
    throw new ApiError(response.status, error.message, error.fields || null);
  }

  return payload ? payload.data : null;
}

export const api = {
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  dashboard: () => request("/api/dashboard"),

  medications: (query) => request("/api/medications", { query }),
  medication: (id) => request(`/api/medications/${id}`),
  createMedication: (body) => request("/api/medications", { method: "POST", body }),
  adjustStock: (id, delta, reason) =>
    request(`/api/medications/${id}/stock`, { method: "POST", body: { delta, reason } }),
  categories: () => request("/api/medications/categories"),

  patients: (search) => request("/api/patients", { query: { search } }),
  patient: (id) => request(`/api/patients/${id}`),
  createPatient: (body) => request("/api/patients", { method: "POST", body }),

  suppliers: () => request("/api/suppliers"),

  prescriptions: (query) => request("/api/prescriptions", { query }),
  createPrescription: (body) => request("/api/prescriptions", { method: "POST", body }),
  transitionPrescription: (id, state) =>
    request(`/api/prescriptions/${id}/state`, { method: "PATCH", body: { state } }),

  purchaseOrders: (query) => request("/api/purchase-orders", { query }),
  purchaseOrder: (id) => request(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (body) => request("/api/purchase-orders", { method: "POST", body }),
  transitionPurchaseOrder: (id, state) =>
    request(`/api/purchase-orders/${id}/state`, { method: "PATCH", body: { state } }),

  sales: (query) => request("/api/sales", { query }),
  createSale: (body) => request("/api/sales", { method: "POST", body }),
  voidSale: (id) => request(`/api/sales/${id}/void`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Shared presentation helpers
// ---------------------------------------------------------------------------

export const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Map a derived stock status to a status-badge tone class. */
export const STATUS_TONE = {
  in: "status-success",
  low: "status-warning",
  out: "status-danger",
  expiring: "status-warning",
  expired: "status-danger",
  recalled: "status-danger",
  controlled: "status-controlled",
  // prescription / order / sale states
  new: "status-neutral",
  verifying: "status-info",
  ready: "status-success",
  dispensed: "status-success",
  voided: "status-danger",
  draft: "status-neutral",
  submitted: "status-info",
  transit: "status-warning",
  received: "status-success",
  cancelled: "status-danger",
  completed: "status-success",
};

export function toneClass(key) {
  return STATUS_TONE[key] || "status-neutral";
}

/** "2026-08-12" -> "12 Aug 2026". Returns "—" for empty values. */
export function formatDate(iso) {
  if (!iso) {
    return "—";
  }
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(iso);
  }
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Initials for an avatar, e.g. "Amara Okafor" -> "AO". */
export function initials(name) {
  return String(name || "")
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
