const { Op } = require("sequelize");
const db = require("../models");
const { asyncHandler } = require("../middlewares/error");
const { scopedCompanyIds } = require("../middlewares/auth");
const { computePay } = require("../services/payroll.service");
const { computeAlerts } = require("../services/alerts.service");

const monthNow = () => new Date().toISOString().slice(0, 7);
const toRef = (amount, currency, rates) => (amount || 0) / (rates[currency] || 1);

async function loadScopedCompaniesAndCountries(req) {
  const allowed = scopedCompanyIds(req.user);
  const companyWhere = allowed ? { id: { [Op.in]: allowed } } : {};
  const companies = await db.Company.findAll({ where: companyWhere });
  const countries = await db.Country.findAll();
  return { companies, countries, companyIds: companies.map((c) => c.id) };
}

// Builds the plain-object "data" shape computeAlerts() expects, scoped to the
// companies the requesting user may see.
async function buildAlertsData(companies, countries) {
  const companyIds = companies.map((c) => c.id);
  const employees = await db.Employee.findAll({
    where: { companyId: { [Op.in]: companyIds.length ? companyIds : ["__none__"] }, status: { [Op.ne]: "Sorti" } },
    include: [
      { model: db.EmployeeEvaluation, as: "evaluations" },
      { model: db.EmployeeChecklistItem, as: "checklist" },
      { model: db.EmployeeDocument, as: "documents" },
    ],
  });

  const employeeShapes = employees.map((e) => ({
    firstName: e.firstName,
    lastName: e.lastName,
    companyId: e.companyId,
    status: e.status,
    hireDate: e.hireDate,
    probationMonths: e.probationMonths,
    contractEndDate: e.contractEndDate,
    evaluations: e.evaluations.map((ev) => ({ date: ev.date })).sort((a, b) => a.date.localeCompare(b.date)),
    checklist: Object.fromEntries(e.checklist.map((c) => [c.key, c.done])),
    documents: e.documents.map((d) => ({ name: d.name, expiryDate: d.expiryDate })),
  }));

  const countryShapes = countries.map((c) => ({ code: c.code, checklist: c.checklistJson }));
  const companyById = (id) => companies.find((c) => c.id === id);

  return { data: { employees: employeeShapes, countries: countryShapes }, companyById };
}

// GET /api/dashboard/alerts
const alerts = asyncHandler(async (req, res) => {
  const { companies, countries } = await loadScopedCompaniesAndCountries(req);
  const { data, companyById } = await buildAlertsData(companies, countries);
  res.json(computeAlerts(data, companyById));
});

// GET /api/dashboard/summary
// KPIs matching the Dashboard view: active headcount, consolidated brut/cost
// (via settings.rates / settings.refCurrency), per-company and per-country breakdown.
const summary = asyncHandler(async (req, res) => {
  const { companies, countries } = await loadScopedCompaniesAndCountries(req);
  const settings = await db.Settings.findByPk(1);
  const month = req.query.month || monthNow();
  const rates = settings?.rates || {};
  const refCurrency = settings?.refCurrency || "EUR";
  const settingsShape = { legalMonthlyHours: settings?.legalMonthlyHours || 173.33 };

  const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));

  const byCompany = [];
  let activeCount = 0;
  const byCountryCount = {};

  for (const comp of companies) {
    const country = countryByCode[comp.countryCode];
    const employees = await db.Employee.findAll({
      where: { companyId: comp.id, status: { [Op.ne]: "Sorti" } },
    });
    let brut = 0,
      net = 0,
      cost = 0;
    for (const e of employees) {
      const overtimeRows = await db.EmployeeOvertime.findAll({ where: { employeeId: e.id, month } });
      const payVarRows = await db.EmployeePayVar.findAll({ where: { employeeId: e.id, month } });
      const employeeShape = {
        salaryBrut: e.salaryBrut,
        overtime: { [month]: overtimeRows.map((o) => o.toJSON()) },
        payVars: { [month]: payVarRows.map((v) => v.toJSON()) },
      };
      const countryShape = country
        ? {
            employee: country.contributionsJson.employee,
            employer: country.contributionsJson.employer,
            tax: country.taxBracketsJson,
            minTax: country.minTax,
          }
        : null;
      const p = computePay(employeeShape, countryShape, month, settingsShape);
      brut += e.salaryBrut;
      net += p.net;
      cost += p.cost;
      byCountryCount[comp.countryCode] = (byCountryCount[comp.countryCode] || 0) + 1;
    }
    activeCount += employees.length;
    byCompany.push({
      company: { id: comp.id, name: comp.name, countryCode: comp.countryCode },
      country: country ? { code: country.code, name: country.name, currency: country.currency, flag: country.flag } : null,
      count: employees.length,
      brut,
      net,
      cost,
    });
  }

  const costRef = byCompany.reduce(
    (s, r) => s + toRef(r.cost, r.country?.currency, rates),
    0
  );
  const brutRef = byCompany.reduce(
    (s, r) => s + toRef(r.brut, r.country?.currency, rates),
    0
  );
  const byCountry = Object.entries(byCountryCount).map(([code, count]) => ({
    code,
    name: countryByCode[code]?.name || code,
    count,
  }));

  res.json({
    month,
    refCurrency,
    activeHeadcount: activeCount,
    consolidatedBrut: brutRef,
    consolidatedCost: costRef,
    byCompany,
    byCountry,
  });
});

module.exports = { alerts, summary };
