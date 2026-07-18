/* ============================ API client ============================
 * Thin fetch wrapper shared by every api/*.js module.
 * - Base URL comes from VITE_API_URL, defaulting to http://localhost:3010/api.
 * - Attaches `Authorization: Bearer <token>` from the token persisted by AuthContext.
 * - Parses JSON responses and throws a uniform ApiError on non-2xx / network failure.
 */

const DEFAULT_BASE_URL = "http://localhost:3010/api";
export const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

export const TOKEN_KEY = "hrgroup:token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path, params) {
  let url = path.startsWith("http") ? path : BASE_URL + (path.startsWith("/") ? path : "/" + path);
  if (params) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
    const qs = new URLSearchParams(entries).toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
}

async function request(path, { method = "GET", body, params, headers } = {}) {
  const url = buildUrl(path, params);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = { Accept: "application/json", ...headers };
  let finalBody = body;
  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { method, headers: finalHeaders, body: finalBody });
  } catch (e) {
    throw new ApiError("Impossible de contacter le serveur (" + e.message + ")", 0, null);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Erreur ${res.status}`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
};
