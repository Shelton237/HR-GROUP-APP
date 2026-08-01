import { api } from "./client";

/**
 * Module Planning (Control Room) — logique et données 100% natives à RH
 * (backend/src/{services,controllers,routes}/planning*), sous /api/planning/*.
 * Les agents sont des salariés RH existants (see AgentsTab.jsx) — plus une
 * identité séparée comme dans l'ancien proxy vers l'app Laravel autonome.
 */

// ---------- Rooms ----------
export function listRooms() {
  return api.get("/planning/rooms");
}
export function createRoom(name) {
  return api.post("/planning/rooms", { name });
}
export function updateRoom(id, name) {
  return api.patch(`/planning/rooms/${id}`, { name });
}
export function deleteRoom(id) {
  return api.del(`/planning/rooms/${id}`);
}

// ---------- Agents (planning profile attached to an existing RH employee) ----------
export function listPlanningAgents(roomId) {
  return api.get("/planning/agents", roomId ? { room_id: roomId } : undefined);
}
export function createPlanningAgent(payload) {
  return api.post("/planning/agents", payload);
}
export function updatePlanningAgent(profileId, payload) {
  return api.patch(`/planning/agents/${profileId}`, payload);
}
export function deletePlanningAgent(profileId) {
  return api.del(`/planning/agents/${profileId}`);
}
export function createAgentAccount(profileId) {
  return api.post(`/planning/agents/${profileId}/account`);
}
/**
 * GET /planning/employee-candidates -> Array<{ id, firstName, lastName }>
 * Minimal, name-only employee list for the "add agent" picker — usable by
 * every role that manages Planning (RH, Manager, Planificateur), unlike
 * GET /employees which Planificateur has no access to at all.
 */
export function listEmployeeCandidates() {
  return api.get("/planning/employee-candidates");
}

// ---------- Schedule ----------
export function getRoomSchedule(roomId, week) {
  return api.get(`/planning/rooms/${roomId}/schedule`, { week });
}

export function patchScheduleCell(roomId, week, employeeId, dayIndex, value) {
  return api.patch(`/planning/rooms/${roomId}/schedule`, { week, employee_id: employeeId, day_index: dayIndex, value });
}

export function resetWeek(roomId, week) {
  return api.post(`/planning/rooms/${roomId}/schedule/reset`, { week });
}

export function addLoan(roomId, week, employeeId) {
  return api.post(`/planning/rooms/${roomId}/schedule/loans`, { week, employee_id: employeeId });
}

export function removeLoan(roomId, week, employeeId) {
  return api.del(`/planning/rooms/${roomId}/schedule/loans`, { week, employee_id: employeeId });
}

// ---------- Absences / permissions (manager) ----------
export function listAbsences() {
  return api.get("/planning/absences");
}
export function createAbsence(payload) {
  return api.post("/planning/absences", payload);
}
export function createPermission(payload) {
  return api.post("/planning/permissions", payload);
}
export function deleteAbsence(id) {
  return api.del(`/planning/absences/${id}`);
}
export function approveAbsence(id) {
  return api.post(`/planning/absences/${id}/approve`);
}
export function rejectAbsence(id) {
  return api.post(`/planning/absences/${id}/reject`);
}

// ---------- Diffusion ----------
export function getDiffusionPreview(roomId, week) {
  return api.get(`/planning/rooms/${roomId}/diffusion`, { week });
}

export function sendDiffusion(roomId, week) {
  return api.post(`/planning/rooms/${roomId}/diffusion/send`, { week });
}

// ---------- Agent self-service ----------
export function getMySchedule(week) {
  return api.get("/planning/me/schedule", { week });
}
export function getMyAbsences() {
  return api.get("/planning/me/absences");
}
export function requestMyPermission(payload) {
  return api.post("/planning/me/permissions", payload);
}
