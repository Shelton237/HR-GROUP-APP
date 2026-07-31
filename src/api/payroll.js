import { api } from "./client";

/**
 * GET /payroll/summary?companyId=&month=
 * resp: {
 *   companyId, month, currency,
 *   rows: Array<{
 *     employee: { id, firstName, lastName, poste },
 *     pay: { brut, ot, gainAll, retenues, empContrib, tax, net, emrContrib, cost },
 *     status: { validated, paid }
 *   }>,
 *   totals: { brut, net, cost }
 * }
 * Authoritative payroll table for the Payroll view — computed server-side.
 */
export function getPayrollSummary({ companyId, month } = {}) {
  return api.get("/payroll/summary", { companyId, month });
}

/**
 * PUT /payments/:employeeId/:month
 * body: { validated?, paid? } — upserts the payment status row for that
 * employee/month.
 * resp: updated payment row { employeeId, month, validated, paid }
 */
export function setPaymentStatus(employeeId, month, patch) {
  return api.put(`/payments/${employeeId}/${month}`, patch);
}

/**
 * GET /payroll/bulletins?month=
 * resp: {
 *   month, bulletins: Array<{
 *     employeeId, employeeName, companyId, companyName, countryFlag, currency,
 *     contractType, joursTravailles, joursTotal, net, validated, paid, exists
 *   }>
 * }
 * Cross-company individual payslip list ("Bulletins de paie" tab) — every
 * active employee in scope for the month, regardless of company.
 */
export function getBulletins(month) {
  return api.get("/payroll/bulletins", { month });
}

/**
 * POST /payroll/bulletins/generate  body: { month }
 * Bulk-creates the payment row (validated:false, paid:false) for every active
 * employee in scope who doesn't have one yet for that month.
 * resp: { month, total, created }
 */
export function generateBulletinsForPeriod(month) {
  return api.post("/payroll/bulletins/generate", { month });
}
