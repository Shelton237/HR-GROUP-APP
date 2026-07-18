/**
 * Ported 1:1 from app/src/App.jsx `computeAlerts`. Pure function: takes the
 * same shape of "data" object (employees, countries) plus a companyById
 * lookup function, returns an array of alert objects.
 *
 *   data: { employees: [...], countries: [...] }
 *   companyById: (id) => company | undefined
 */
const { addMonths, daysBetween } = require("./payroll.service");

function computeAlerts(data, companyById) {
  const now = new Date();
  const out = [];
  data.employees
    .filter((e) => e.status !== "Sorti")
    .forEach((e) => {
      const comp = companyById(e.companyId);
      const who = `${e.firstName} ${e.lastName}`;

      if (e.status === "Période d'essai" && e.hireDate) {
        const d = daysBetween(now, addMonths(e.hireDate, e.probationMonths || 3));
        if (d <= 21) {
          out.push({
            type: "essai",
            tone: d < 0 ? "rose" : "amber",
            who,
            company: comp?.name,
            text:
              d < 0
                ? `Période d'essai dépassée de ${-d} j — décision requise`
                : `Fin de période d'essai dans ${d} j`,
          });
        }
      }

      let ed = e.evaluations.length
        ? addMonths(e.evaluations[e.evaluations.length - 1].date, 12)
        : e.hireDate
        ? addMonths(e.hireDate, e.probationMonths || 3)
        : null;
      if (ed) {
        const d = daysBetween(now, ed);
        if (d <= 21) {
          out.push({
            type: "eval",
            tone: d < 0 ? "rose" : "teal",
            who,
            company: comp?.name,
            text: d < 0 ? `Évaluation en retard de ${-d} j` : `Évaluation à réaliser dans ${d} j`,
          });
        }
      }

      const missing = (
        data.countries.find((c) => c.code === comp?.countryCode)?.checklist || []
      ).filter((c) => !e.checklist[c.key]);
      if (missing.length) {
        out.push({
          type: "dossier",
          tone: "amber",
          who,
          company: comp?.name,
          text: `Dossier incomplet : ${missing.map((m) => m.label).join(", ")}`,
        });
      }

      if (e.contractEndDate) {
        const d = daysBetween(now, new Date(e.contractEndDate));
        if (d >= 0 && d <= 30) {
          out.push({
            type: "contrat",
            tone: "amber",
            who,
            company: comp?.name,
            text: `Fin de CDD dans ${d} j`,
          });
        }
      }

      (e.documents || []).forEach((doc) => {
        if (doc.expiryDate) {
          const d = daysBetween(now, new Date(doc.expiryDate));
          if (d <= 30) {
            out.push({
              type: "doc",
              tone: d < 0 ? "rose" : "amber",
              who,
              company: comp?.name,
              text: d < 0 ? `${doc.name} expiré` : `${doc.name} expire dans ${d} j`,
            });
          }
        }
      });
    });
  return out;
}

module.exports = { computeAlerts };
