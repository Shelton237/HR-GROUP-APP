const { Op } = require("sequelize");
const db = require("../models");
const { daysOverlappingMonth } = require("./payroll.service");

/**
 * Nombre de jours, dans le mois donné, de congés VALIDÉS dont le type est
 * marqué "retenue sur paie" (Paramètres > Listes > Types de congé) — ex.
 * "Absence injustifiée". Un congé qui chevauche le mois n'est compté que
 * pour ses jours réellement dans ce mois.
 */
async function getUnjustifiedAbsenceDays(employeeId, month, settings) {
  const deductibleTypes = (settings?.leaveTypes || []).filter((t) => t.deductFromPay).map((t) => t.name);
  if (!deductibleTypes.length) return 0;

  const leaves = await db.Leave.findAll({
    where: { employeeId, status: "Validé", type: { [Op.in]: deductibleTypes } },
  });
  return leaves.reduce((sum, l) => sum + daysOverlappingMonth(l.start, l.end, month), 0);
}

module.exports = { getUnjustifiedAbsenceDays };
