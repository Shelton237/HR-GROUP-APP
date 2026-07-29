/**
 * Pure payroll calculation functions, ported 1:1 from the original React
 * prototype (app/src/App.jsx, "Calculs" section). No DB access here so
 * these are trivial to unit test in isolation.
 *
 * Shapes expected (plain JS objects, not Sequelize instances):
 *   employee: { salaryBrut, overtime: { [month]: [...] }, payVars: { [month]: [...] } }
 *   country:  { employee: [{label, rate, ceiling?}], employer: [...], tax: [{upTo, rate}], minTax }
 *   settings: { legalMonthlyHours }
 */

function addMonths(s, m) {
  const d = new Date(s);
  d.setMonth(d.getMonth() + m);
  return d;
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

/** Nombre de jours d'un intervalle [start, end] qui tombent dans le mois "YYYY-MM" donné. */
function daysOverlappingMonth(start, end, month) {
  const [y, m] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0));
  const s = new Date(start);
  const e = new Date(end);
  const overlapStart = s > monthStart ? s : monthStart;
  const overlapEnd = e < monthEnd ? e : monthEnd;
  if (overlapEnd < overlapStart) return 0;
  return daysBetween(overlapStart, overlapEnd) + 1;
}

function contribTotal(list, base) {
  return (list || []).reduce(
    (s, c) => s + (c.ceiling ? Math.min(base, c.ceiling) : base) * (c.rate / 100),
    0
  );
}

function progressiveTax(taxable, brackets, minTax) {
  let tax = 0;
  let prev = 0;
  for (const b of brackets || []) {
    const cap = b.upTo == null ? Infinity : b.upTo;
    if (taxable > prev) tax += (Math.min(taxable, cap) - prev) * (b.rate / 100);
    prev = cap;
    if (taxable <= cap) break;
  }
  if (minTax && tax > 0 && tax < minTax) tax = minTax;
  return tax;
}

function overtimeTotal(e, month, legalHours) {
  const list = (e.overtime && e.overtime[month]) || [];
  return list.reduce((s, o) => {
    if (o.method === "forfait") return s + (Number(o.amount) || 0);
    const hourly = e.salaryBrut / (legalHours || 173.33);
    return s + (Number(o.hours) || 0) * hourly * (1 + (Number(o.rate) || 0) / 100);
  }, 0);
}

function computePay(e, country, month, settings) {
  const baseSalary = e.salaryBrut || 0;
  // Absences non justifiées (validées) : réduisent le brut au prorata des
  // jours ouvrés du mois, AVANT cotisations/impôt — pas une simple retenue
  // sur le net, la base de calcul elle-même est réduite.
  const legalMonthlyDays = (settings && settings.legalMonthlyHours ? settings.legalMonthlyHours : 173.33) / 8;
  const absenceDays = e.unjustifiedAbsenceDays || 0;
  const absenceDeduction =
    legalMonthlyDays > 0 ? Math.min(baseSalary, (baseSalary / legalMonthlyDays) * absenceDays) : 0;
  const brut = Math.max(0, baseSalary - absenceDeduction);

  const ot = overtimeTotal(e, month, settings && settings.legalMonthlyHours);
  const vars = (e.payVars && e.payVars[month]) || [];
  let gainTax = ot,
    gainCot = ot,
    gainAll = ot,
    retenues = 0; // heures supp : imposables + cotisables par défaut
  vars.forEach((v) => {
    const a = Number(v.amount) || 0;
    if (v.kind === "retenue") retenues += a;
    else {
      gainAll += a;
      if (v.taxable) gainTax += a;
      if (v.cotisable) gainCot += a;
    }
  });
  const cotBase = brut + gainCot;
  const empContrib = country ? contribTotal(country.employee, cotBase) : 0;
  const taxable = brut + gainTax - empContrib;
  const tax = country ? progressiveTax(taxable, country.tax, country.minTax) : 0;
  const emrContrib = country ? contribTotal(country.employer, cotBase) : 0;
  const net = brut + gainAll - empContrib - tax - retenues;
  const cost = brut + gainAll + emrContrib;
  return { baseSalary, absenceDays, absenceDeduction, brut, ot, gainAll, retenues, empContrib, tax, net, emrContrib, cost };
}

module.exports = {
  addMonths,
  daysBetween,
  daysOverlappingMonth,
  contribTotal,
  progressiveTax,
  overtimeTotal,
  computePay,
};
