/* Date helpers for the Planning module — ported as-is from
 * CONTROL-ROOM-PLANNING/frontend/src/app/manager/date-utils.ts (itself
 * ported from docs/legacy-prototype.html, UTC-safe). */

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const DSHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ymd(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function todayISO() {
  return ymd(new Date());
}

export function isoUTC(iso) {
  return Date.parse(iso + "T00:00:00Z");
}

export function addDaysISO(iso, n) {
  return new Date(isoUTC(iso) + n * 864e5).toISOString().slice(0, 10);
}

export function dowISO(iso) {
  // 0 = Lundi ... 6 = Dimanche
  return (new Date(isoUTC(iso)).getUTCDay() + 6) % 7;
}

export function mondayISOof(iso) {
  return addDaysISO(iso, -dowISO(iso));
}

export function isoWeekNum(iso) {
  const d = new Date(isoUTC(iso));
  const dn = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dn + 3);
  const ft = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const ftd = (ft.getUTCDay() + 6) % 7;
  ft.setUTCDate(ft.getUTCDate() - ftd + 3);
  return 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 864e5));
}

export function weekParity(iso) {
  return isoWeekNum(iso) % 2;
}

export function fmtShort(iso) {
  const d = new Date(isoUTC(iso));
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function monthWeeks(anchorIso) {
  const ad = new Date(isoUTC(anchorIso));
  const y = ad.getUTCFullYear();
  const m = ad.getUTCMonth();
  const firstISO = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastISO = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
  let cur = mondayISOof(firstISO);
  const out = [];
  while (isoUTC(cur) <= isoUTC(lastISO) && out.length < 6) {
    out.push(cur);
    cur = addDaysISO(cur, 7);
  }
  return {
    weeks: out,
    monthName: ad.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export function shiftMonthAnchor(anchorIso, n) {
  const d = new Date(isoUTC(anchorIso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
