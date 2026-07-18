import { api } from "./client";

/**
 * GET /dashboard/alerts
 * resp: Array<{
 *   type: "essai"|"eval"|"dossier"|"contrat"|"doc",
 *   tone: "rose"|"amber"|"teal",
 *   who: string, company: string, text: string
 * }>
 * Replaces the old client-side computeAlerts(data) — now computed server-side
 * from real hire dates / evaluation history / checklist / document expiries.
 */
export function getAlerts() {
  return api.get("/dashboard/alerts");
}

function toRef(amount, currency, rates) {
  return (amount || 0) / (rates?.[currency] || 1);
}

/**
 * GET /dashboard/summary returns:
 * { month, refCurrency, activeHeadcount, consolidatedBrut, consolidatedCost,
 *   byCompany: [{ company:{id,name,countryCode}, country:{code,name,currency,flag}|null, count, brut, net, cost }],
 *   byCountry: [{ code, name, count }] }
 * — nested shapes, and per-company amounts only in local currency (no
 * refCurrency conversion per row, only in the consolidated totals). This
 * function reshapes it into what the Dashboard page expects (flat rows,
 * plus a per-row brutRef/costRef for the bar chart), fetching /settings
 * alongside it since the conversion rates aren't included in the summary
 * response itself.
 */
export async function getSummary() {
  const [raw, settings] = await Promise.all([api.get("/dashboard/summary"), api.get("/settings")]);
  const rates = settings?.rates || {};

  const byCompany = (raw.byCompany || []).map((r) => ({
    companyId: r.company.id,
    companyName: r.company.name,
    countryCode: r.company.countryCode,
    countryName: r.country?.name || r.company.countryCode,
    flag: r.country?.flag || "",
    currency: r.country?.currency || "",
    count: r.count,
    brut: r.brut,
    net: r.net,
    cost: r.cost,
    brutRef: toRef(r.brut, r.country?.currency, rates),
    costRef: toRef(r.cost, r.country?.currency, rates),
  }));
  const byCountry = (raw.byCountry || []).map((c) => ({ code: c.code, name: c.name, count: c.count }));

  return {
    refCurrency: raw.refCurrency,
    activeEmployees: raw.activeHeadcount,
    companiesCount: byCompany.length,
    countriesCount: byCountry.length,
    costRef: raw.consolidatedCost,
    brutRef: raw.consolidatedBrut,
    byCompany,
    byCountry,
  };
}
