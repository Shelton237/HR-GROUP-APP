const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { hasCompanyScope } = require("../middlewares/auth");
const { computePay } = require("../services/payroll.service");

// GET /api/payroll/summary?companyId=&month=
// Mirrors the Payroll view in App.jsx: per-company, per-month payroll table
// with brut/net/cost per active employee plus validated/paid status.
const summary = asyncHandler(async (req, res) => {
  const { companyId } = req.query;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  if (!companyId) throw new ApiError(400, "companyId requis.");
  if (!hasCompanyScope(req.user, companyId)) throw new ApiError(403, "Hors périmètre d'accès.");

  const company = await db.Company.findByPk(companyId);
  if (!company) throw new ApiError(404, "Société introuvable.");
  const country = await db.Country.findByPk(company.countryCode);
  const settings = await db.Settings.findByPk(1);

  const employees = await db.Employee.findAll({ where: { companyId, status: { [db.Sequelize.Op.ne]: "Sorti" } } });

  const countryShape = country
    ? {
        employee: country.contributionsJson.employee,
        employer: country.contributionsJson.employer,
        tax: country.taxBracketsJson,
        minTax: country.minTax,
      }
    : null;
  const settingsShape = { legalMonthlyHours: settings?.legalMonthlyHours || 173.33 };

  const rows = [];
  const totals = { brut: 0, net: 0, cost: 0 };
  for (const e of employees) {
    const overtimeRows = await db.EmployeeOvertime.findAll({ where: { employeeId: e.id, month } });
    const payVarRows = await db.EmployeePayVar.findAll({ where: { employeeId: e.id, month } });
    const employeeShape = {
      salaryBrut: e.salaryBrut,
      overtime: { [month]: overtimeRows.map((o) => o.toJSON()) },
      payVars: { [month]: payVarRows.map((v) => v.toJSON()) },
    };
    const p = computePay(employeeShape, countryShape, month, settingsShape);
    const [payment] = await db.Payment.findOrCreate({
      where: { employeeId: e.id, month },
      defaults: { validated: false, paid: false },
    });
    totals.brut += p.brut;
    totals.net += p.net;
    totals.cost += p.cost;
    rows.push({
      employee: { id: e.id, firstName: e.firstName, lastName: e.lastName, poste: e.poste },
      pay: p,
      status: { validated: payment.validated, paid: payment.paid },
    });
  }

  res.json({ companyId, month, currency: country?.currency || null, rows, totals });
});

// PUT /api/payments/:employeeId/:month  { validated?, paid? }
// Mirrors setStatus() in the Payroll view (upserts data.payments[`${month}|${id}`]).
const setStatus = asyncHandler(async (req, res) => {
  const { employeeId, month } = req.params;
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  if (!hasCompanyScope(req.user, employee.companyId)) throw new ApiError(403, "Hors périmètre d'accès.");

  const { validated, paid } = req.body || {};
  const [payment] = await db.Payment.findOrCreate({
    where: { employeeId, month },
    defaults: { validated: false, paid: false },
  });
  if (validated !== undefined) payment.validated = !!validated;
  if (paid !== undefined) payment.paid = !!paid;
  await payment.save();
  res.json(payment);
});

module.exports = { summary, setStatus };
