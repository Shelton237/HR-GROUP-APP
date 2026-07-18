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
