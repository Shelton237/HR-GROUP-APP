const db = require("../../models");
const { ApiError, asyncHandler } = require("../../middlewares/error");
const engine = require("../../services/planning/planningEngine");
const scheduleService = require("../../services/planning/scheduleService");
const { loadRoomOr404 } = require("./rooms.controller");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const VALUES = ["J", "N", "R", ""];

function rosterEntryToJson(e, roomId) {
  return {
    id: e.id,
    room_id: roomId,
    name: e.name,
    email: e.email,
    type: e.type,
    offset: e.offset,
    binome: e.binome,
    day_spec: e.daySpec,
    alt_parity: e.altParity,
    cross: e.cross || false,
  };
}

async function buildPayload(room, week) {
  const result = await scheduleService.weekSchedule(room, week);
  return {
    dates: result.dates,
    roster: result.roster.map((e) => rosterEntryToJson(e, room.id)),
    grid: result.grid,
    coverage: result.coverage,
  };
}

const show = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const week = req.query.week || engine.mondayISOof(new Date().toISOString().slice(0, 10));
  res.json(await buildPayload(room, week));
});

const update = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const { week, employee_id: employeeId, day_index: dayIndexRaw } = req.body || {};
  let { value } = req.body || {};
  if (!week) throw new ApiError(400, "week est requis.");
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  const dayIndex = Number(dayIndexRaw);
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) throw new ApiError(400, "day_index doit être entre 0 et 6.");
  value = value ?? "";
  if (!VALUES.includes(value)) throw new ApiError(400, "value doit être J, N, R ou vide.");

  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");

  const weekStart = engine.mondayISOof(week);

  const [override] = await db.PlanningScheduleOverride.findOrCreate({
    where: { roomId: room.id, weekStart, employeeId, dayIndex },
    defaults: { id: uid("povr"), value },
  });
  if (override.value !== value) {
    override.value = value;
    await override.save();
  }

  res.json(await buildPayload(room, weekStart));
});

const reset = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const { week } = req.body || {};
  if (!week) throw new ApiError(400, "week est requis.");
  const weekStart = engine.mondayISOof(week);
  await db.PlanningScheduleOverride.destroy({ where: { roomId: room.id, weekStart } });
  res.json({ message: "ok" });
});

const addLoan = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const { week, employee_id: employeeId } = req.body || {};
  if (!week) throw new ApiError(400, "week est requis.");
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  const weekStart = engine.mondayISOof(week);

  const [loan] = await db.PlanningRoomWeekLoan.findOrCreate({
    where: { roomId: room.id, weekStart, employeeId },
    defaults: { id: uid("ploan") },
  });
  res.status(201).json(loan);
});

const removeLoan = asyncHandler(async (req, res) => {
  const room = await loadRoomOr404(req.params.id);
  const { week, employee_id: employeeId } = req.body || {};
  if (!week) throw new ApiError(400, "week est requis.");
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  const weekStart = engine.mondayISOof(week);

  await db.PlanningRoomWeekLoan.destroy({ where: { roomId: room.id, weekStart, employeeId } });
  await db.PlanningScheduleOverride.destroy({ where: { roomId: room.id, weekStart, employeeId } });
  res.json({ message: "ok" });
});

module.exports = { show, update, reset, addLoan, removeLoan, buildPayload };
