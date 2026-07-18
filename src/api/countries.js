import { api } from "./client";

/**
 * The backend stores the config-heavy parts of a country (contributions, tax
 * brackets, checklist, holidays) as native JSON columns named
 * contributionsJson/taxBracketsJson/checklistJson/holidaysJson, updated via
 * dedicated sub-endpoints. The UI (Fiscalite page) works with the flat shape
 * the original single-file app used (employee/employer/tax/checklist/holidays)
 * — this module is the adapter between the two.
 */
function normalizeCountry(c) {
  if (!c) return c;
  return {
    code: c.code,
    name: c.name,
    currency: c.currency,
    flag: c.flag,
    validated: c.validated,
    leaveAccrual: c.leaveAccrual,
    minTax: c.minTax,
    employee: c.contributionsJson?.employee || [],
    employer: c.contributionsJson?.employer || [],
    tax: c.taxBracketsJson || [],
    checklist: c.checklistJson || [],
    holidays: c.holidaysJson || [],
  };
}

/** GET /countries -> Array<Country> (flat shape, see normalizeCountry) */
export function listCountries() {
  return api.get("/countries").then((list) => (list || []).map(normalizeCountry));
}

/** GET /countries/:code -> single Country (flat shape) */
export function getCountry(code) {
  return api.get(`/countries/${code}`).then(normalizeCountry);
}

/**
 * PUT /countries/:code
 * body: { validated?, leaveAccrual? } — base fields only; contributions/tax/
 * checklist/holidays are persisted through their own endpoints below.
 */
export function updateCountryBase(code, { validated, leaveAccrual }) {
  return api.put(`/countries/${code}`, { validated, leaveAccrual }).then(normalizeCountry);
}

/** PUT /countries/:code/contributions  body: { employee, employer } */
export function updateContributions(code, { employee, employer }) {
  return api.put(`/countries/${code}/contributions`, { employee, employer }).then(normalizeCountry);
}

/** PUT /countries/:code/tax  body: { brackets, minTax } */
export function updateTax(code, { tax, minTax }) {
  return api.put(`/countries/${code}/tax`, { brackets: tax, minTax }).then(normalizeCountry);
}

/** PUT /countries/:code/checklist  body: { checklist } */
export function updateChecklist(code, checklist) {
  return api.put(`/countries/${code}/checklist`, { checklist }).then(normalizeCountry);
}

/** PUT /countries/:code/holidays  body: { holidays } (server re-sorts by date) */
export function updateHolidays(code, holidays) {
  return api.put(`/countries/${code}/holidays`, { holidays }).then(normalizeCountry);
}
