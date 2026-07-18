/* ============================ Format & date helpers ============================
 * Purely client-side display helpers. The authoritative alert / payroll
 * computation now comes from the API (`/dashboard/alerts`, `/employees/:id/payroll`,
 * `/payroll/summary`, `/dashboard/summary`) — these helpers are only used to
 * re-display values already computed server-side (currency formatting,
 * consolidated-currency conversion for display, "in X days" style text, etc).
 */

export function fmt(a, c) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(a || 0);
  } catch {
    return Math.round(a || 0).toLocaleString("fr-FR") + " " + c;
  }
}

// Converts an amount expressed in currency `c` into the settings' reference currency,
// using the indicative rates table `s.rates` (1 refCurrency = rates[c] units of c).
export const toRef = (a, c, s) => (a || 0) / (s.rates[c] || 1);

export const monthNow = () => new Date().toISOString().slice(0, 7);

export const addMonths = (s, m) => {
  const d = new Date(s);
  d.setMonth(d.getMonth() + m);
  return d;
};

export const daysBetween = (a, b) => Math.round((b - a) / 86400000);
