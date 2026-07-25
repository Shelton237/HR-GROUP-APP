const db = require("../../models");
const { ApiError, asyncHandler } = require("../../middlewares/error");
const absenceService = require("../../services/planning/absenceService");

const list = asyncHandler(async (req, res) => {
  const absences = await db.PlanningAbsence.findAll({
    include: [{ model: db.Employee }],
    order: [
      ["startDate", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  res.json(absences);
});

const create = asyncHandler(async (req, res) => {
  const { employee_id: employeeId, start_date: start, end_date: endDate, reason } = req.body || {};
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  if (!start) throw new ApiError(400, "start_date est requis.");
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");

  const absence = await absenceService.declareAbsence(employeeId, { start, end: endDate || start, reason });
  res.status(201).json(absence);
});

/** Manager : saisit une demande de permission pour un employé donné (règle des 48h, décision immédiate). */
const createPermission = asyncHandler(async (req, res) => {
  const { employee_id: employeeId, start_date: start, end_date: endDate, reason } = req.body || {};
  if (!employeeId) throw new ApiError(400, "employee_id est requis.");
  if (!start) throw new ApiError(400, "start_date est requis.");
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");

  const absence = await absenceService.submitPermission(employeeId, { start, end: endDate || start, reason });
  res.status(201).json(absence);
});

const destroy = asyncHandler(async (req, res) => {
  const absence = await db.PlanningAbsence.findByPk(req.params.id);
  if (!absence) throw new ApiError(404, "Absence introuvable.");
  await absence.destroy();
  res.json({ message: "ok" });
});

const approve = asyncHandler(async (req, res) => {
  const absence = await db.PlanningAbsence.findByPk(req.params.id);
  if (!absence) throw new ApiError(404, "Absence introuvable.");
  if (absence.status !== "en_attente") throw new ApiError(422, "Cette demande n'est plus en attente.");
  res.json(await absenceService.approve(absence));
});

const reject = asyncHandler(async (req, res) => {
  const absence = await db.PlanningAbsence.findByPk(req.params.id);
  if (!absence) throw new ApiError(404, "Absence introuvable.");
  if (absence.status !== "en_attente") throw new ApiError(422, "Cette demande n'est plus en attente.");
  res.json(await absenceService.reject(absence));
});

module.exports = { list, create, createPermission, destroy, approve, reject };
