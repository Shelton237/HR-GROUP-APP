/*
 * Self-service agent — l'identité vient toujours de req.user.employeeId (posé par
 * requireSelfEmployee à partir du JWT vérifié), jamais d'un paramètre d'URL.
 */
const db = require("../../models");
const { ApiError, asyncHandler } = require("../../middlewares/error");
const engine = require("../../services/planning/planningEngine");
const scheduleService = require("../../services/planning/scheduleService");
const absenceService = require("../../services/planning/absenceService");

async function loadMyProfileOr404(employeeId) {
  const profile = await db.PlanningProfile.findOne({
    where: { employeeId },
    include: [{ model: db.Employee }, { model: db.PlanningRoom, as: "room" }],
  });
  if (!profile) throw new ApiError(404, "Aucun profil planning associé à ce compte.");
  return profile;
}

const schedule = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const profile = await loadMyProfileOr404(employeeId);
  const week = req.query.week || engine.mondayISOof(new Date().toISOString().slice(0, 10));

  const me = await scheduleService.meWeekSchedule(employeeId, week);
  const grid = me.grid;
  const coverage = engine.coverage({ [employeeId]: grid }, [employeeId]);

  res.json({
    dates: me.dates,
    roster: [
      {
        id: employeeId,
        room_id: profile.roomId,
        name: `${profile.Employee.firstName} ${profile.Employee.lastName}`.trim(),
        email: profile.Employee.email || null,
        type: profile.type,
        offset: profile.offset,
        binome: profile.binome,
        day_spec: profile.daySpecJson,
        alt_parity: profile.altParity,
        cross: false,
      },
    ],
    grid: { [employeeId]: grid },
    coverage,
    rooms: me.rooms,
  });
});

const absencesMine = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  await loadMyProfileOr404(employeeId);
  const absences = await db.PlanningAbsence.findAll({
    where: { employeeId },
    order: [
      ["startDate", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  res.json(absences);
});

const requestPermission = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  await loadMyProfileOr404(employeeId);
  const { start_date: start, end_date: endDate, reason } = req.body || {};
  if (!start) throw new ApiError(400, "start_date est requis.");
  const absence = await absenceService.requestPermission(employeeId, { start, end: endDate || start, reason });
  res.status(201).json(absence);
});

module.exports = { schedule, absencesMine, requestPermission };
