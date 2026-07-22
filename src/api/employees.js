import { api } from "./client";

/**
 * The backend returns Sequelize model instances as-is, so JSON-column fields
 * keep their JS attribute names (customJson, and nested onboarding.stepsJson)
 * and the checklist comes back as an array of { key, done } rows (one table
 * row per checklist item) rather than a { [key]: boolean } map. This adapter
 * reshapes an employee record into the flat shape the UI (InfosTab, OnboardTab,
 * EmployeeDetail's "dossier" tab) works with.
 */
function normalizeEmployee(e) {
  if (!e) return e;
  const { customJson, onboarding, checklist, evaluations, ...rest } = e;
  return {
    ...rest,
    custom: customJson || {},
    onboarding: onboarding ? { ...onboarding, steps: onboarding.stepsJson || {} } : onboarding,
    checklist: Array.isArray(checklist) ? Object.fromEntries(checklist.map((c) => [c.key, !!c.done])) : checklist || {},
    evaluations: Array.isArray(evaluations)
      ? evaluations.map(({ scoresJson, ...ev }) => ({ ...ev, scores: scoresJson || {} }))
      : evaluations,
  };
}

/**
 * GET /employees?companyId=&search=
 * resp: Array<Employee> — full employee records (including nested
 * checklist/evaluations/warnings/documents/onboarding/emergencyContacts) so
 * list & detail views can render without N+1 calls. (Overtime/pay-vars are
 * NOT embedded here — fetch them per month via listOvertime/listPayVars.)
 */
export function listEmployees(params) {
  return api.get("/employees", params).then((list) => (list || []).map(normalizeEmployee));
}

/** GET /employees/:id — full employee record (flat shape, see normalizeEmployee). */
export function getEmployee(id) {
  return api.get(`/employees/${id}`).then(normalizeEmployee);
}

/**
 * POST /employees
 * body: { companyId, firstName, lastName, poste, contractType, hireDate,
 *         salaryBrut, probationMonths, department, site, category, ... }
 * resp: created employee (with id, status, empty checklist/evaluations/etc.)
 */
export function createEmployee(body) {
  return api.post("/employees", body).then(normalizeEmployee);
}

/**
 * PUT /employees/:id
 * body: partial or full employee fields to update (e.g. infos tab fields,
 *       matricule, gender, contact info, department, managerId, salaryBrut...)
 * ("custom" is translated to the backend's "customJson" column name here.)
 * resp: updated employee
 */
export function updateEmployee(id, body) {
  const { custom, ...rest } = body;
  const payload = custom !== undefined ? { ...rest, customJson: custom } : rest;
  return api.put(`/employees/${id}`, payload).then(normalizeEmployee);
}

/** DELETE /employees/:id */
export function deleteEmployee(id) {
  return api.del(`/employees/${id}`);
}

/* ---- Checklist (dossier d'embauche) ---- */
/** GET /employees/:id/checklist -> Array<{ id, employeeId, key, done }> */
export function listChecklist(id) {
  return api.get(`/employees/${id}/checklist`);
}
/** PUT /employees/:id/checklist/:key  body: { done } (one item at a time) */
export function setChecklistItem(id, key, done) {
  return api.put(`/employees/${id}/checklist/${key}`, { done });
}

/* ---- Évaluations ---- */
/** GET /employees/:id/evaluations -> Array<Evaluation> */
export function listEvaluations(id) {
  return api.get(`/employees/${id}/evaluations`);
}
/**
 * POST /employees/:id/evaluations
 * body: { templateId, date, scores: {[criterionLabel]: number}, total, decision, notes, evaluator }
 * resp: created evaluation
 */
export function addEvaluation(id, body) {
  return api.post(`/employees/${id}/evaluations`, body);
}

/* ---- Avertissements ---- */
/** GET /employees/:id/warnings -> Array<Warning> */
export function listWarnings(id) {
  return api.get(`/employees/${id}/warnings`);
}
/**
 * POST /employees/:id/warnings
 * body: { date, type, reason, notes }
 * resp: created warning
 */
export function addWarning(id, body) {
  return api.post(`/employees/${id}/warnings`, body);
}

/* ---- Documents (archivage salarié) ---- */
/** GET /employees/:id/documents -> Array<Document> */
export function listDocuments(id) {
  return api.get(`/employees/${id}/documents`);
}
/**
 * POST /employees/:id/documents
 * body: { name, category, expiryDate, dataUrl } (base64 data URL — same
 * upload shape the old client-only version used; backend may swap this for
 * a proper file upload endpoint later)
 * resp: created document
 */
export function addDocument(id, body) {
  return api.post(`/employees/${id}/documents`, body);
}
/** DELETE /employees/:id/documents/:docId */
export function deleteDocument(id, docId) {
  return api.del(`/employees/${id}/documents/${docId}`);
}

/* ---- Onboarding ---- */
/**
 * GET /employees/:id/onboarding -> { templateId, stepsJson, decision }
 * (raw shape — prefer the normalized `onboarding.steps` embedded in
 * getEmployee()'s result; this raw getter isn't used elsewhere.)
 */
export function getOnboarding(id) {
  return api.get(`/employees/${id}/onboarding`);
}
/**
 * PUT /employees/:id/onboarding  body: { templateId, steps, decision } (full
 * replace; the backend accepts "steps" in the request body even though it
 * stores/returns it as "stepsJson").
 */
export function updateOnboarding(id, body) {
  return api.put(`/employees/${id}/onboarding`, body);
}

/* ---- Heures supplémentaires ---- */
/** GET /employees/:id/overtime?month=YYYY-MM -> Array<Overtime> */
export function listOvertime(id, month) {
  return api.get(`/employees/${id}/overtime`, { month });
}
/**
 * POST /employees/:id/overtime
 * body: { month, date, method: "hourly"|"forfait", hours?, rate?, amount? }
 * resp: created overtime entry
 */
export function addOvertime(id, body) {
  return api.post(`/employees/${id}/overtime`, body);
}
/** DELETE /employees/:id/overtime/:entryId */
export function deleteOvertime(id, entryId) {
  return api.del(`/employees/${id}/overtime/${entryId}`);
}

/* ---- Variables de paie (primes, indemnités, retenues) ---- */
/** GET /employees/:id/pay-vars?month=YYYY-MM -> Array<PayVar> */
export function listPayVars(id, month) {
  return api.get(`/employees/${id}/pay-vars`, { month });
}
/**
 * POST /employees/:id/pay-vars
 * body: { month, label, kind: "gain"|"retenue", taxable, cotisable, amount }
 * resp: created pay-var entry
 */
export function addPayVar(id, body) {
  return api.post(`/employees/${id}/pay-vars`, body);
}
/** PUT /employees/:id/pay-vars/:entryId  body: { amount } (or full entry) */
export function updatePayVar(id, entryId, body) {
  return api.put(`/employees/${id}/pay-vars/${entryId}`, body);
}
/** DELETE /employees/:id/pay-vars/:entryId */
export function deletePayVar(id, entryId) {
  return api.del(`/employees/${id}/pay-vars/${entryId}`);
}

/* ---- Contacts d'urgence ---- */
/** GET /employees/:id/emergency-contacts -> Array<EmergencyContact> */
export function listEmergencyContacts(id) {
  return api.get(`/employees/${id}/emergency-contacts`);
}
/** POST /employees/:id/emergency-contacts  body: { name, relationship, phone, phone2, address } */
export function addEmergencyContact(id, body) {
  return api.post(`/employees/${id}/emergency-contacts`, body);
}
/** PUT /employees/:id/emergency-contacts/:contactId  body: { name, relationship, phone, phone2, address } */
export function updateEmergencyContact(id, contactId, body) {
  return api.put(`/employees/${id}/emergency-contacts/${contactId}`, body);
}
/** DELETE /employees/:id/emergency-contacts/:contactId */
export function deleteEmergencyContact(id, contactId) {
  return api.del(`/employees/${id}/emergency-contacts/${contactId}`);
}

/**
 * GET /employees/:id/payroll?month=YYYY-MM
 * resp: { brut, ot, gainAll, retenues, empContrib, tax, net, emrContrib, cost }
 * Authoritative payroll simulation for one employee/month — replaces the old
 * client-side computePay(). The client no longer computes net/cost itself.
 */
export function getEmployeePayroll(id, month) {
  return api.get(`/employees/${id}/payroll`, { month });
}
