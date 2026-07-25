/*
 * Port fidèle de CONTROL-ROOM-PLANNING/backend/app/Support/PlanningEngine.php :
 * cycle continu J-N-R ancré sur REF, jours fixes avec parité de semaine ISO,
 * couverture J/N, et génération du corps d'e-mail de diffusion.
 *
 * "Employee-like" objects here are plain roster objects assembled by
 * scheduleService.js from PlanningProfile + RH Employee (id, name, type,
 * offset, binome, daySpec, altParity) — not raw Sequelize model instances.
 */
const { DAYS, DSHORT, isoUTC, dowISO, mondayISOof, weekDatesOf, isoWeekNum, weekParity, fmtShort } = (() => {
  const d = require("./dates");
  return {
    ...d,
    weekDatesOf: (monIso) => {
      const out = [];
      for (let i = 0; i < 7; i++) out.push(d.addDaysISO(monIso, i));
      return out;
    },
  };
})();

const CYCLE = ["J", "N", "R"];
const REF = "2026-01-01";
const HOURS = { J: "07h30 – 17h30", N: "17h30 – 07h30 (lendemain)" };

function dayNum(iso) {
  return Math.round((isoUTC(iso) - isoUTC(REF)) / 864e5);
}

function weekDates(monIso) {
  return weekDatesOf(monIso);
}

function defaultSpec() {
  const s = Array(7).fill("off");
  for (let i = 0; i < 6; i++) s[i] = "on";
  return s;
}

function workingDaysFor(employee, monIso) {
  const spec = employee.daySpec && employee.daySpec.length === 7 ? employee.daySpec : defaultSpec();
  const parity = weekParity(monIso);
  const out = [];
  spec.forEach((v, d) => {
    if (v === "on") out.push(d);
    else if (v === "alt" && parity === (employee.altParity ?? 0)) out.push(d);
  });
  return out;
}

function autoStatus(employee, iso, monIso) {
  if (employee.type === "rotation") {
    let n = (dayNum(iso) + (employee.offset ?? 0)) % 3;
    n = ((n % 3) + 3) % 3;
    return CYCLE[n];
  }
  const workingDays = workingDaysFor(employee, monIso);
  const dow = dowISO(iso);
  return workingDays.includes(dow) ? "J" : "R";
}

/**
 * Statuts auto de tous les agents rotation d'une salle pour un jour donné, en tenant
 * compte de l'agent jour fixe ("contrôle") s'il y en a un. Jamais plus de 2 agents
 * simultanément en J, ni plus de 2 en N — voir PlanningEngine.php pour le détail de
 * la règle (le binôme naturellement en J se scinde uniquement quand le contrôle
 * travaille, en alternant lequel des 2 membres perd son J tous les 3 jours).
 *
 * @param {Array} rotating agents type=rotation de la salle (hors agents prêtés)
 * @param {object|null} control agent fixed_day "contrôle", ou null
 * @param {string[]} awayEmployeeIds
 */
function autoStatusesForRotation(rotating, control, iso, monIso, awayEmployeeIds = []) {
  const statuses = {};
  rotating.forEach((e) => {
    statuses[e.id] = autoStatus(e, iso, monIso);
  });

  const byBinomeMap = new Map();
  rotating.forEach((e) => {
    const key = e.binome ?? 0;
    if (!byBinomeMap.has(key)) byBinomeMap.set(key, []);
    byBinomeMap.get(key).push(e);
  });
  const byBinome = [...byBinomeMap.keys()]
    .sort((a, b) => a - b)
    .map((k) => byBinomeMap.get(k));
  // The downgrade below is evaluated per-binôme (each pair's own natural phase
  // vs. the control agent), independently of how many other binômes exist —
  // it holds for the standard 3-binômes room (legacy shape) and equally for
  // the current standard shape of 1 binôme + 1 contrôle (max 3 people/salle).
  // Other counts are left to the raw per-employee cycle (no coverage guarantee).
  if (byBinome.length !== 1 && byBinome.length !== 3) return statuses;

  const controlWorks = !!control && workingDaysFor(control, monIso).includes(dowISO(iso));
  if (!controlWorks) return statuses;

  const n = dayNum(iso);
  // intdiv(n, 3) en PHP tronque vers zéro (contrairement à Math.floor pour n<0).
  const downgradeIndex = ((Math.trunc(n / 3) % 2) + 2) % 2;

  for (const pair of byBinome) {
    const members = pair;
    if (members.length !== 2 || statuses[members[0].id] !== "J" || statuses[members[1].id] !== "J") continue;

    const presentCount = members.filter((m) => !awayEmployeeIds.includes(m.id)).length;
    if (presentCount <= 1) continue;

    const loser = members[downgradeIndex];
    statuses[loser.id] = "R";
  }

  return statuses;
}

function offsetForRank(rank) {
  return Math.trunc(rank / 2) % 3;
}

function binomeForRank(rank) {
  return offsetForRank(rank) + 1;
}

function coverage(grid, employeeIds) {
  const J = [];
  const N = [];
  for (let d = 0; d < 7; d++) {
    let j = 0;
    let n = 0;
    for (const id of employeeIds) {
      const s = (grid[id] || [])[d] ?? "";
      if (s === "J") j++;
      if (s === "N") n++;
    }
    J.push(j);
    N.push(n);
  }
  return { J, N };
}

function emailBody(employee, room, dates, values) {
  const lines = values.map((s, d) => {
    const txt = s === "J" ? "Jour   " + HOURS.J : s === "N" ? "Nuit   " + HOURS.N : s === "ABS" ? "Absence" : "Repos";
    const dayLabel = DAYS[d].padEnd(9);
    const dateLabel = fmtShort(dates[d]).padEnd(9);
    return `  ${dayLabel} ${dateLabel}  ${txt}`;
  });
  const linesStr = lines.join("\n");
  const nb = values.filter((s) => s === "J" || s === "N").length;
  const firstName = (employee.name || "").split(" ")[0];
  const roomName = room.name;
  const sep = "─────────────────────────────────────────";

  return `Bonjour ${firstName},

Voici votre planning – Control Room ${roomName}
Semaine du ${dates[0]} au ${dates[6]} (${nb} vacations)
${sep}
${linesStr}
${sep}
Jour = 07h30–17h30   ·   Nuit = 17h30–07h30

Toute demande de permission doit être soumise au moins 48 h à l'avance.
Merci de confirmer la bonne réception.

Cordialement,
Thara Services Madagascar
(+261) 32 72 336 43 – contact@thara-services.mg`;
}

module.exports = {
  CYCLE,
  REF,
  DAYS,
  DSHORT,
  HOURS,
  dowISO,
  mondayISOof,
  dayNum,
  isoWeekNum,
  weekParity,
  weekDates,
  fmtShort,
  workingDaysFor,
  defaultSpec,
  autoStatus,
  autoStatusesForRotation,
  offsetForRank,
  binomeForRank,
  coverage,
  emailBody,
};
