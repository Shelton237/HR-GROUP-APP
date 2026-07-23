const { Op } = require("sequelize");
const db = require("../models");
const { ApiError, asyncHandler } = require("../middlewares/error");
const { hasCompanyScope, scopedCompanyIds } = require("../middlewares/auth");
const { computePay } = require("../services/payroll.service");

const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function loadEmployeeOr404(id) {
  const employee = await db.Employee.findByPk(id);
  if (!employee) throw new ApiError(404, "Salarié introuvable.");
  return employee;
}

function assertScope(req, companyId) {
  if (!hasCompanyScope(req.user, companyId)) throw new ApiError(403, "Hors périmètre d'accès.");
}

// ------------------------------------------------------------------
// Core CRUD
// ------------------------------------------------------------------

const list = asyncHandler(async (req, res) => {
  const allowed = scopedCompanyIds(req.user);
  const where = {};
  if (allowed) where.companyId = { [Op.in]: allowed };
  if (req.query.companyId) {
    if (allowed && !allowed.includes(req.query.companyId)) throw new ApiError(403, "Hors périmètre d'accès.");
    where.companyId = req.query.companyId;
  }
  if (req.query.search) {
    const q = `%${req.query.search}%`;
    where[Op.or] = [{ firstName: { [Op.like]: q } }, { lastName: { [Op.like]: q } }, { poste: { [Op.like]: q } }];
  }
  const employees = await db.Employee.findAll({
    where,
    order: [["lastName", "ASC"]],
    // The list view needs each employee's checklist to show dossier
    // completeness (see EmployeeChecklistItem, "checklist" alias) without
    // an N+1 request per row.
    include: [{ model: db.EmployeeChecklistItem, as: "checklist" }],
  });
  res.json(employees);
});

const getOne = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const full = await db.Employee.findByPk(employee.id, {
    include: [
      { model: db.EmergencyContact, as: "emergencyContacts" },
      { model: db.EmployeeChecklistItem, as: "checklist" },
      { model: db.EmployeeEvaluation, as: "evaluations" },
      { model: db.EmployeeWarning, as: "warnings" },
      { model: db.EmployeeDocument, as: "documents" },
      { model: db.EmployeeOnboarding, as: "onboarding" },
    ],
  });
  res.json(full);
});

const ALLOWED_EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "poste",
  "contractType",
  "hireDate",
  "contractEndDate",
  "salaryBrut",
  "probationMonths",
  "status",
  "matricule",
  "gender",
  "maritalStatus",
  "dependents",
  "nationality",
  "birthDate",
  "cin",
  "socialNumber",
  "phone",
  "email",
  "address",
  "bankAccount",
  "mobileMoney",
  "managerId",
  "department",
  "site",
  "category",
  "leaveBalance",
  "companyId",
  "customJson",
  "exitDate",
  "exitReason",
  "exitNotes",
];

const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.firstName || !body.lastName) throw new ApiError(400, "Prénom et nom requis.");
  if (!body.companyId) throw new ApiError(400, "Société requise.");
  const company = await db.Company.findByPk(body.companyId);
  if (!company) throw new ApiError(400, "Société inconnue.");
  assertScope(req, company.id);

  const contractType = body.contractType || "Période d'essai";
  const employee = await db.Employee.create({
    id: uid("emp"),
    companyId: company.id,
    firstName: body.firstName,
    lastName: body.lastName,
    poste: body.poste || "",
    contractType,
    hireDate: body.hireDate || null,
    contractEndDate: body.contractEndDate || null,
    salaryBrut: Number(body.salaryBrut) || 0,
    probationMonths: body.probationMonths != null ? Number(body.probationMonths) : 3,
    status: contractType === "Période d'essai" ? "Période d'essai" : "Actif",
    department: body.department || "",
    site: body.site || "",
    category: body.category || "",
    leaveBalance: body.leaveBalance != null ? Number(body.leaveBalance) : 0,
  });

  // New hires inherit the destination country's checklist template (all unchecked).
  const country = await db.Country.findByPk(company.countryCode);
  if (country && Array.isArray(country.checklistJson)) {
    await db.EmployeeChecklistItem.bulkCreate(
      country.checklistJson.map((c) => ({ employeeId: employee.id, key: c.key, done: false }))
    );
  }
  await db.EmployeeOnboarding.create({ employeeId: employee.id, templateId: "", stepsJson: {}, decision: "" });

  res.status(201).json(employee);
});

const update = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const body = req.body || {};
  if (body.companyId && body.companyId !== employee.companyId) {
    const company = await db.Company.findByPk(body.companyId);
    if (!company) throw new ApiError(400, "Société inconnue.");
    assertScope(req, company.id);
  }
  for (const field of ALLOWED_EMPLOYEE_FIELDS) {
    if (body[field] !== undefined) employee[field] = body[field];
  }
  await employee.save();
  res.json(employee);
});

const remove = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  await employee.destroy();
  res.status(204).send();
});

// ------------------------------------------------------------------
// Checklist
// ------------------------------------------------------------------

const listChecklist = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const items = await db.EmployeeChecklistItem.findAll({ where: { employeeId: employee.id } });
  res.json(items);
});

const setChecklistItem = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { done } = req.body || {};
  const [item] = await db.EmployeeChecklistItem.findOrCreate({
    where: { employeeId: employee.id, key: req.params.key },
    defaults: { done: !!done },
  });
  item.done = !!done;
  await item.save();
  res.json(item);
});

// ------------------------------------------------------------------
// Evaluations
// ------------------------------------------------------------------

const listEvaluations = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const evals = await db.EmployeeEvaluation.findAll({
    where: { employeeId: employee.id },
    order: [["date", "DESC"]],
  });
  res.json(evals);
});

const addEvaluation = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { templateId, date, scores, total, decision, notes, evaluator } = req.body || {};
  if (!date) throw new ApiError(400, "Date requise.");
  const evaluation = await db.EmployeeEvaluation.create({
    id: uid("ev"),
    employeeId: employee.id,
    templateId: templateId || "",
    date,
    scoresJson: scores || {},
    total: total != null ? Number(total) : null,
    decision: decision || "",
    notes: notes || "",
    evaluator: evaluator || "",
  });
  // Mirrors App.jsx: a "Confirmation" decision during probation confirms the employee.
  if (decision === "Confirmation" && employee.status === "Période d'essai") {
    employee.status = "Actif";
    await employee.save();
  }
  res.status(201).json(evaluation);
});

// ------------------------------------------------------------------
// Warnings
// ------------------------------------------------------------------

const listWarnings = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const warnings = await db.EmployeeWarning.findAll({
    where: { employeeId: employee.id },
    order: [["date", "DESC"]],
  });
  res.json(warnings);
});

const addWarning = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { date, type, reason, notes } = req.body || {};
  if (!reason || !reason.trim()) throw new ApiError(400, "Motif requis.");
  const warning = await db.EmployeeWarning.create({
    id: uid("w"),
    employeeId: employee.id,
    date: date || new Date().toISOString().slice(0, 10),
    type: type || "Avertissement",
    reason,
    notes: notes || "",
  });
  res.status(201).json(warning);
});

// ------------------------------------------------------------------
// Documents (personnel file, archivage)
// ------------------------------------------------------------------

const listDocuments = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const docs = await db.EmployeeDocument.findAll({ where: { employeeId: employee.id } });
  res.json(docs);
});

const addDocument = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { name, category, expiryDate, dataUrl } = req.body || {};
  if (!name) throw new ApiError(400, "Nom du document requis.");
  const doc = await db.EmployeeDocument.create({
    id: uid("doc"),
    employeeId: employee.id,
    name,
    category: category || "Autre",
    expiryDate: expiryDate || null,
    dataUrl: dataUrl || null,
    uploadedAt: new Date(),
  });
  res.status(201).json(doc);
});

const removeDocument = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const doc = await db.EmployeeDocument.findOne({ where: { id: req.params.docId, employeeId: employee.id } });
  if (!doc) throw new ApiError(404, "Document introuvable.");
  await doc.destroy();
  res.status(204).send();
});

// ------------------------------------------------------------------
// Onboarding
// ------------------------------------------------------------------

const getOnboarding = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const [onboarding] = await db.EmployeeOnboarding.findOrCreate({
    where: { employeeId: employee.id },
    defaults: { templateId: "", stepsJson: {}, decision: "" },
  });
  res.json(onboarding);
});

const updateOnboarding = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { templateId, steps, decision } = req.body || {};
  const [onboarding] = await db.EmployeeOnboarding.findOrCreate({
    where: { employeeId: employee.id },
    defaults: { templateId: "", stepsJson: {}, decision: "" },
  });
  if (templateId !== undefined) {
    onboarding.templateId = templateId;
    onboarding.stepsJson = {};
    onboarding.decision = "";
  }
  if (steps !== undefined) onboarding.stepsJson = steps;
  if (decision !== undefined) {
    onboarding.decision = decision;
    // Mirrors App.jsx: confirming onboarding during probation activates the employee.
    if (decision === "Confirmation" && employee.status === "Période d'essai") {
      employee.status = "Actif";
      await employee.save();
    }
  }
  await onboarding.save();
  res.json(onboarding);
});

// ------------------------------------------------------------------
// Overtime (heures supplémentaires)
// ------------------------------------------------------------------

const listOvertime = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const where = { employeeId: employee.id };
  if (req.query.month) where.month = req.query.month;
  const entries = await db.EmployeeOvertime.findAll({ where, order: [["date", "ASC"]] });
  res.json(entries);
});

const addOvertime = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { month, date, method, hours, rate, amount } = req.body || {};
  if (!month) throw new ApiError(400, "Mois requis (YYYY-MM).");
  const entry = await db.EmployeeOvertime.create({
    id: uid("ot"),
    employeeId: employee.id,
    month,
    date: date || null,
    method: method === "forfait" ? "forfait" : "hourly",
    hours: hours != null ? Number(hours) : 0,
    rate: rate != null ? Number(rate) : 0,
    amount: amount != null ? Number(amount) : 0,
  });
  res.status(201).json(entry);
});

const removeOvertime = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const entry = await db.EmployeeOvertime.findOne({ where: { id: req.params.otId, employeeId: employee.id } });
  if (!entry) throw new ApiError(404, "Entrée introuvable.");
  await entry.destroy();
  res.status(204).send();
});

// ------------------------------------------------------------------
// Pay variables (primes, indemnités, retenues)
// ------------------------------------------------------------------

const listPayVars = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const where = { employeeId: employee.id };
  if (req.query.month) where.month = req.query.month;
  const entries = await db.EmployeePayVar.findAll({ where });
  res.json(entries);
});

const addPayVar = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const { month, label, kind, taxable, cotisable, amount } = req.body || {};
  if (!month || !label) throw new ApiError(400, "Mois et libellé requis.");
  const entry = await db.EmployeePayVar.create({
    id: uid("pv"),
    employeeId: employee.id,
    month,
    label,
    kind: kind === "retenue" ? "retenue" : "gain",
    taxable: !!taxable,
    cotisable: !!cotisable,
    amount: Number(amount) || 0,
  });
  res.status(201).json(entry);
});

const updatePayVar = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const entry = await db.EmployeePayVar.findOne({ where: { id: req.params.pvId, employeeId: employee.id } });
  if (!entry) throw new ApiError(404, "Entrée introuvable.");
  const { amount } = req.body || {};
  if (amount !== undefined) entry.amount = Number(amount) || 0;
  await entry.save();
  res.json(entry);
});

const removePayVar = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const entry = await db.EmployeePayVar.findOne({ where: { id: req.params.pvId, employeeId: employee.id } });
  if (!entry) throw new ApiError(404, "Entrée introuvable.");
  await entry.destroy();
  res.status(204).send();
});

// ------------------------------------------------------------------
// Emergency contacts
// ------------------------------------------------------------------

const listEmergencyContacts = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const contacts = await db.EmergencyContact.findAll({ where: { employeeId: employee.id } });
  res.json(contacts);
});

const addEmergencyContact = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const settings = await db.Settings.findByPk(1);
  const max = settings?.maxEmergencyContacts ?? 2;
  const count = await db.EmergencyContact.count({ where: { employeeId: employee.id } });
  if (count >= max) throw new ApiError(409, `Maximum ${max} contacts d'urgence.`);
  const { name, relationship, phone, phone2, address } = req.body || {};
  const contact = await db.EmergencyContact.create({
    employeeId: employee.id,
    name: name || "",
    relationship: relationship || "",
    phone: phone || "",
    phone2: phone2 || "",
    address: address || "",
  });
  res.status(201).json(contact);
});

const updateEmergencyContact = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const contact = await db.EmergencyContact.findOne({
    where: { id: req.params.contactId, employeeId: employee.id },
  });
  if (!contact) throw new ApiError(404, "Contact introuvable.");
  const { name, relationship, phone, phone2, address } = req.body || {};
  Object.assign(contact, {
    ...(name !== undefined && { name }),
    ...(relationship !== undefined && { relationship }),
    ...(phone !== undefined && { phone }),
    ...(phone2 !== undefined && { phone2 }),
    ...(address !== undefined && { address }),
  });
  await contact.save();
  res.json(contact);
});

const removeEmergencyContact = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const contact = await db.EmergencyContact.findOne({
    where: { id: req.params.contactId, employeeId: employee.id },
  });
  if (!contact) throw new ApiError(404, "Contact introuvable.");
  await contact.destroy();
  res.status(204).send();
});

// ------------------------------------------------------------------
// Payroll (single employee)
// ------------------------------------------------------------------

const payroll = asyncHandler(async (req, res) => {
  const employee = await loadEmployeeOr404(req.params.id);
  assertScope(req, employee.companyId);
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const company = await db.Company.findByPk(employee.companyId);
  const country = company ? await db.Country.findByPk(company.countryCode) : null;
  const settings = await db.Settings.findByPk(1);

  const overtimeRows = await db.EmployeeOvertime.findAll({ where: { employeeId: employee.id, month } });
  const payVarRows = await db.EmployeePayVar.findAll({ where: { employeeId: employee.id, month } });

  const employeeShape = {
    salaryBrut: employee.salaryBrut,
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
  const settingsShape = { legalMonthlyHours: settings?.legalMonthlyHours || 173.33 };

  const result = computePay(employeeShape, countryShape, month, settingsShape);
  res.json({ employeeId: employee.id, month, currency: country?.currency || null, ...result });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  listChecklist,
  setChecklistItem,
  listEvaluations,
  addEvaluation,
  listWarnings,
  addWarning,
  listDocuments,
  addDocument,
  removeDocument,
  getOnboarding,
  updateOnboarding,
  listOvertime,
  addOvertime,
  removeOvertime,
  listPayVars,
  addPayVar,
  updatePayVar,
  removePayVar,
  listEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  removeEmergencyContact,
  payroll,
};
