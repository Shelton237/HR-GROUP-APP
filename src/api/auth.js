import { api, setToken, getToken } from "./client";

/**
 * POST /auth/login
 * body:  { email: string, password: string }
 * resp:  { token: string, user: { id, name, email, role, scope }, mustChangePassword?: boolean }
 *
 * NOTE: the API contract fixes /auth/login and /auth/me, but does not list an
 * endpoint for the "must change password" follow-up. /auth/change-password is
 * this frontend's assumption — flag it to the backend dev for confirmation.
 */
export function login(email, password) {
  return api.post("/auth/login", { email, password });
}

/**
 * GET /auth/me
 * resp: { user: { id, name, email, role, scope } }
 */
export function me() {
  return api.get("/auth/me");
}

/**
 * POST /auth/change-password  (ASSUMPTION — not in the fixed contract list,
 * added because the spec requires prompting for a new password when the
 * backend flags mustChangePassword after login).
 * body: { newPassword: string }
 * resp: { ok: true }
 */
export function changePassword(newPassword) {
  return api.post("/auth/change-password", { newPassword });
}

export { setToken, getToken };
