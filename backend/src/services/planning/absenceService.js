/*
 * Port fidèle de CONTROL-ROOM-PLANNING/backend/app/Support/AbsenceService.php :
 * règle des 48h pour les permissions — si l'écart entre maintenant et le début
 * de la permission est inférieur à 48h, la demande est refusée d'office.
 */
const db = require("../../models");

function hoursUntil(startDateIso) {
  const start = Date.parse(startDateIso + "T00:00:00");
  return (start - Date.now()) / 3600000;
}

function id(prefix) {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Absence déclarée par le manager : toujours "enregistree", effective immédiatement. */
async function declareAbsence(employeeId, { start, end, reason }) {
  return db.PlanningAbsence.create({
    id: id("pabs"),
    employeeId,
    startDate: start,
    endDate: end,
    type: "absence",
    reason: reason || null,
    status: "enregistree",
  });
}

/**
 * Permission soumise par le manager directement pour un employé : applique la
 * règle des 48h et décide immédiatement (pas d'étape d'approbation supplémentaire).
 */
async function submitPermission(employeeId, { start, end, reason }) {
  const hours = hoursUntil(start);
  const status = hours < 48 ? "refusee" : "enregistree";
  return db.PlanningAbsence.create({
    id: id("pabs"),
    employeeId,
    startDate: start,
    endDate: end,
    type: "permission",
    reason: reason || null,
    status,
  });
}

/**
 * Permission soumise par l'agent lui-même : la règle des 48h refuse d'office les
 * demandes trop tardives (définitif) ; sinon la demande reste "en_attente" jusqu'à
 * validation ou rejet explicite par le manager.
 */
async function requestPermission(employeeId, { start, end, reason }) {
  const hours = hoursUntil(start);
  const status = hours < 48 ? "refusee" : "en_attente";
  return db.PlanningAbsence.create({
    id: id("pabs"),
    employeeId,
    startDate: start,
    endDate: end,
    type: "permission",
    reason: reason || null,
    status,
  });
}

async function approve(absence) {
  absence.status = "enregistree";
  await absence.save();
  return absence;
}

async function reject(absence) {
  absence.status = "refusee";
  await absence.save();
  return absence;
}

module.exports = { hoursUntil, declareAbsence, submitPermission, requestPermission, approve, reject };
