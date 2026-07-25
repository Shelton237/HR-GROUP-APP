const { ApiError } = require("../middlewares/error");

/**
 * Thin proxy to the separate Control Room Planning app (Laravel, its own
 * MySQL database, own users/auth — see CONTROL-ROOM-PLANNING/docs/CONTRACT.md).
 * We don't re-implement its scheduling logic (J/N/R cycle, 48h rule,
 * coverage, diffusion) — that stays in the already-deployed, tested Laravel
 * app. This module just logs in once as a service account and forwards
 * requests, so the browser only ever talks to our own domain (no CORS, no
 * second set of credentials exposed client-side).
 */

const BASE_URL = (process.env.PLANNING_API_URL || "").replace(/\/+$/, "");
const SERVICE_EMAIL = process.env.PLANNING_API_EMAIL;
const SERVICE_PASSWORD = process.env.PLANNING_API_PASSWORD;

let cachedToken = null;

async function login() {
  if (!BASE_URL || !SERVICE_EMAIL || !SERVICE_PASSWORD) {
    throw new ApiError(503, "Intégration Planning non configurée (PLANNING_API_URL/EMAIL/PASSWORD).");
  }
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
  });
  if (!res.ok) throw new ApiError(502, "Connexion au service Planning impossible.");
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken;
}

/**
 * Forwards one request to the Planning API, retrying once with a fresh
 * login if the cached token was rejected (expired/revoked).
 */
async function planningFetch(method, path, body) {
  if (!cachedToken) await login();

  const doFetch = async (token) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(cachedToken);
  if (res.status === 401) {
    await login();
    res = await doFetch(cachedToken);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || "Erreur de l'API Planning.");
  }
  return data;
}

module.exports = { planningFetch };
