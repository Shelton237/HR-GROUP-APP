import { api } from "./client";

/**
 * GET /users  (Admin only)
 * resp: Array<{ id, name, email, role, scope, active, mustChangePassword }>
 */
export function listUsers() {
  return api.get("/users");
}

/**
 * POST /users  (Admin only)
 * body: { name, email, role?, scope? }
 * resp: { id, name, email, role, scope, active, mustChangePassword, tempPassword }
 * tempPassword is returned once — the backend never stores or logs it in
 * plaintext afterwards, so it must be relayed to the new user immediately.
 */
export function createUser(body) {
  return api.post("/users", body);
}

/**
 * PUT /users/:id  (Admin only)
 * body: { name?, email?, role?, scope?, active? }
 */
export function updateUser(id, body) {
  return api.put(`/users/${id}`, body);
}

/** DELETE /users/:id  (Admin only) */
export function deleteUser(id) {
  return api.del(`/users/${id}`);
}

/**
 * POST /users/:id/reset-password  (Admin only)
 * resp: { id, name, email, role, scope, active, mustChangePassword, tempPassword }
 * Generates a new temporary password (mustChangePassword forced true) and
 * returns it once — same one-time-reveal pattern as createUser.
 */
export function resetUserPassword(id) {
  return api.post(`/users/${id}/reset-password`);
}
