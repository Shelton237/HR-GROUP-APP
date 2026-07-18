const { Op } = require("sequelize");
const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { scopedCompanyIds, hasCompanyScope } = require("../middlewares/auth");
const { daysBetween } = require("../services/payroll.service");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const daysOf = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, daysBetween(new Date(start), new Date(end)) + 1);
};

const list = asyncHandler(async (req, res) => {
  const allowed = scopedCompanyIds(req.user);
  const employeeWhere = {};
  if (allowed) employeeWhere.companyId = { [Op.in]: allowed };
  if (req.query.employeeId) employeeWhere.id = req.query.employeeId;

  const leaves = await db.Leave.findAll({
    include: [{ model: db.Employee, where: employeeWhere, attributes: ["id", "firstName", "lastName", "companyId"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(leaves);
});

const create = asyncHandler(async (req, res) => {
  const { employeeId, type, start, end, notes } = req.body || {};
  if (!employeeId || !type || !start || !end) {
    throw new ApiError(400, "Salarié, type et période (du/au) requis.");
  }
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  if (!hasCompanyScope(req.user, employee.companyId)) throw new ApiError(403, "Hors périmètre d'accès.");

  const leave = await db.Leave.create({
    id: uid("lv"),
    employeeId,
    type,
    start,
    end,
    days: daysOf(start, end),
    status: "Demandé",
    notes: notes || "",
  });
  res.status(201).json(leave);
});

const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!["Demandé", "Validé", "Refusé"].includes(status)) throw new ApiError(400, "Statut invalide.");

  const leave = await db.Leave.findByPk(req.params.id);
  if (!leave) throw new ApiError(404, "Demande de congé introuvable.");
  const employee = await db.Employee.findByPk(leave.employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  if (!hasCompanyScope(req.user, employee.companyId)) throw new ApiError(403, "Hors périmètre d'accès.");

  leave.status = status;
  await leave.save();

  // Mirrors setStatus() in App.jsx exactly: validating a paid leave type
  // decrements the employee's leave balance (floored at 0).
  if (status === "Validé") {
    const settings = await db.Settings.findByPk(1);
    const leaveType = (settings?.leaveTypes || []).find((t) => t.name === leave.type);
    if (leaveType?.paid) {
      employee.leaveBalance = Math.max(0, (employee.leaveBalance || 0) - leave.days);
      await employee.save();
    }
  }

  res.json({ leave, employee: { id: employee.id, leaveBalance: employee.leaveBalance } });
});

module.exports = { list, create, setStatus };
