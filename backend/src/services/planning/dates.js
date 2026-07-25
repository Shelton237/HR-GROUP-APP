/* Date helpers for the Planning module — backend copy of
 * src/lib/planningDates.js (itself ported from
 * CONTROL-ROOM-PLANNING/frontend/src/app/manager/date-utils.ts), UTC-safe,
 * no DOM dependency so it runs as-is under Node. */

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DSHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function isoUTC(iso) {
  return Date.parse(iso + "T00:00:00Z");
}

function addDaysISO(iso, n) {
  return new Date(isoUTC(iso) + n * 864e5).toISOString().slice(0, 10);
}

function dowISO(iso) {
  // 0 = Lundi ... 6 = Dimanche
  return (new Date(isoUTC(iso)).getUTCDay() + 6) % 7;
}

function mondayISOof(iso) {
  return addDaysISO(iso, -dowISO(iso));
}

function isoWeekNum(iso) {
  const d = new Date(isoUTC(iso));
  const dn = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dn + 3);
  const ft = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const ftd = (ft.getUTCDay() + 6) % 7;
  ft.setUTCDate(ft.getUTCDate() - ftd + 3);
  return 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 864e5));
}

function weekParity(iso) {
  return isoWeekNum(iso) % 2;
}

function fmtShort(iso) {
  const d = new Date(isoUTC(iso));
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { DAYS, DSHORT, isoUTC, addDaysISO, dowISO, mondayISOof, isoWeekNum, weekParity, fmtShort, todayISO };
