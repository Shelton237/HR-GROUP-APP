import { api } from "./client";

/**
 * Calls to the separate Control Room Planning app, proxied through our own
 * backend at /api/planning/* (see backend/src/routes/planning.routes.js) —
 * same contract as CONTROL-ROOM-PLANNING/docs/CONTRACT.md.
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

// ---------- Employees (room-scheduling specific — not RH's own employees) ----------
export function listPlanningEmployees(roomId) {
  return api.get("/planning/employees", roomId ? { room_id: roomId } : undefined);
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

// ---------- Diffusion ----------
export function getDiffusionPreview(roomId, week) {
  return api.get(`/planning/rooms/${roomId}/diffusion`, { week });
}

export function sendDiffusion(roomId, week) {
  return api.post(`/planning/rooms/${roomId}/diffusion/send`, { week });
}
