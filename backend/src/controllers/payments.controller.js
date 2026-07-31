const { Op } = require("sequelize");
const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { hasCompanyScope, scopedCompanyIds } = require("../middlewares/auth");
const { computePay } = require("../services/payroll.service");
const { getUnjustifiedAbsenceDays } = require("../services/absenceDeduction.service");
const { logActionForReq } = require("../services/audit.service");

const daysInMonth = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

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

  // Only "Actif" — unlike other views (Dashboard, alerts), Paie excludes
  // "Période d'essai" too, not just "Sorti"/archivés.
  const employees = await db.Employee.findAll({ where: { companyId, status: "Actif", archived: false } });

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
    const unjustifiedAbsenceDays = await getUnjustifiedAbsenceDays(e.id, month, settings);
    const employeeShape = {
      salaryBrut: e.salaryBrut,
      overtime: { [month]: overtimeRows.map((o) => o.toJSON()) },
      payVars: { [month]: payVarRows.map((v) => v.toJSON()) },
      unjustifiedAbsenceDays,
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
  const wasPaid = payment.paid;
  const wasValidated = payment.validated;
  if (validated !== undefined) payment.validated = !!validated;
  if (paid !== undefined) payment.paid = !!paid;
  await payment.save();

  const who = `${employee.firstName} ${employee.lastName} — ${month}`;
  if (paid !== undefined && payment.paid !== wasPaid) {
    await logActionForReq(req, {
      action: "Paiement",
      entityType: "Bulletins",
      entityId: employeeId,
      detail: `${who} — ${payment.paid ? "marqué payé" : "paiement annulé"}`,
    });
  }
  if (validated !== undefined && payment.validated !== wasValidated) {
    await logActionForReq(req, {
      action: "Changement statut",
      entityType: "Bulletins",
      entityId: employeeId,
      detail: `${who} — ${payment.validated ? "validé" : "validation annulée"}`,
    });
  }
  res.json(payment);
});

// GET /api/payroll/bulletins?month=
// Cross-company, cross-country individual payslip list ("Bulletins de paie"
// tab) — unlike summary() which is scoped to one selected company, this
// spans every company the user can see at once (mirrors usra-care's payslip
// list). Net amounts are computed live via the same payroll engine, never
// stored/frozen — a bulletin's only persisted state is validated/paid
// (the Payment row), exactly like the existing per-company Payroll view.
const bulletins = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const allowed = scopedCompanyIds(req.user);
  let companies = await db.Company.findAll({ where: allowed ? { id: { [Op.in]: allowed } } : {} });
  // Filters only ever narrow the already-scoped company list above — an
  // Operateur limited to Madagascar companies can pass ?countryCode=CM all
  // they want, it will just yield zero rows, never a leak outside scope.
  if (req.query.companyId) companies = companies.filter((c) => c.id === req.query.companyId);
  if (req.query.countryCode) companies = companies.filter((c) => c.countryCode === req.query.countryCode);
  const countries = await db.Country.findAll();
  const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));
  const settings = await db.Settings.findByPk(1);
  const settingsShape = { legalMonthlyHours: settings?.legalMonthlyHours || 173.33 };
  const totalDays = daysInMonth(month);

  const rows = [];
  for (const comp of companies) {
    const country = countryByCode[comp.countryCode];
    const employees = await db.Employee.findAll({ where: { companyId: comp.id, status: { [Op.ne]: "Sorti" }, archived: false } });
    const countryShape = country
      ? {
          employee: country.contributionsJson.employee,
          employer: country.contributionsJson.employer,
          tax: country.taxBracketsJson,
          minTax: country.minTax,
        }
      : null;
    for (const e of employees) {
      const overtimeRows = await db.EmployeeOvertime.findAll({ where: { employeeId: e.id, month } });
      const payVarRows = await db.EmployeePayVar.findAll({ where: { employeeId: e.id, month } });
      const unjustifiedAbsenceDays = await getUnjustifiedAbsenceDays(e.id, month, settings);
      const employeeShape = {
        salaryBrut: e.salaryBrut,
        overtime: { [month]: overtimeRows.map((o) => o.toJSON()) },
        payVars: { [month]: payVarRows.map((v) => v.toJSON()) },
        unjustifiedAbsenceDays,
      };
      const p = computePay(employeeShape, countryShape, month, settingsShape);
      const payment = await db.Payment.findOne({ where: { employeeId: e.id, month } });
      rows.push({
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        companyId: comp.id,
        companyName: comp.name,
        countryCode: comp.countryCode,
        countryName: country?.name || comp.countryCode,
        countryFlag: country?.flag || "",
        currency: country?.currency || "",
        contractType: e.contractType,
        joursTravailles: Math.max(0, totalDays - unjustifiedAbsenceDays),
        joursTotal: totalDays,
        net: p.net,
        validated: payment?.validated || false,
        paid: payment?.paid || false,
        exists: !!payment,
      });
    }
  }

  res.json({ month, bulletins: rows });
});

// POST /api/payroll/bulletins/generate  body: { month }
// Bulk-creates the (empty, validated:false/paid:false) Payment row for every
// active employee in scope who doesn't have one yet for that month — the
// same findOrCreate() that already happens lazily one row at a time when
// Payroll/bulletins is viewed, just triggered explicitly and in bulk.
const generateBulletins = asyncHandler(async (req, res) => {
  const month = (req.body && req.body.month) || new Date().toISOString().slice(0, 7);
  const allowed = scopedCompanyIds(req.user);
  const companies = await db.Company.findAll({ where: allowed ? { id: { [Op.in]: allowed } } : {} });
  const companyIds = companies.map((c) => c.id);
  const employees = await db.Employee.findAll({
    where: { companyId: { [Op.in]: companyIds.length ? companyIds : ["__none__"] }, status: { [Op.ne]: "Sorti" }, archived: false },
  });

  let created = 0;
  for (const e of employees) {
    const [, wasCreated] = await db.Payment.findOrCreate({ where: { employeeId: e.id, month }, defaults: { validated: false, paid: false } });
    if (wasCreated) created += 1;
  }

  await logActionForReq(req, {
    action: "Création",
    entityType: "Bulletins",
    entityId: null,
    detail: `Génération auto période ${month} — ${created} nouveau(x) bulletin(s) sur ${employees.length} salarié(s)`,
  });
  res.locals.auditLogged = true;

  res.json({ month, total: employees.length, created });
});

module.exports = { summary, setStatus, bulletins, generateBulletins };
