import { api } from "./client";

/**
 * GET /leaves?employeeId=&status=
 * resp: Array<{ id, employeeId, type, start, end, days, status, notes }>
 */
export function listLeaves(params) {
  return api.get("/leaves", params);
}

/**
 * POST /leaves
 * body: { employeeId, type, start, end, notes }
 * resp: created leave request — { id, ..., days, status: "Demandé" }
 * (day count + initial status computed server-side)
 */
export function createLeave(body) {
  return api.post("/leaves", body);
}

/**
 * PUT /leaves/:id/status
 * body: { status: "Validé" | "Refusé" | "Demandé" }
 * resp: { leave, employee: { id, leaveBalance } }. Backend decrements the
 * employee's leaveBalance when a paid leave type transitions to "Validé".
 */
export function patchLeaveStatus(id, status) {
  return api.put(`/leaves/${id}/status`, { status });
}
