/*
 * Récapitulatif automatique des alertes RH (dossiers incomplets, périodes
 * d'essai, évaluations, fins de CDD, documents expirants) — configuré dans
 * Paramètres > Notifications (destinataires, règles activées, fréquence).
 */
const cron = require("node-cron");
const db = require("../models");
const { computeAlerts } = require("../services/alerts.service");
const { buildAlertsData } = require("../controllers/dashboard.controller");
const mail = require("../services/mail.service");

const RULE_BY_TYPE = {
  essai: "probationEnd",
  eval: "evalDue",
  dossier: "incompleteDossier",
  contrat: "contractEnd",
  doc: "docExpiry",
};

function shouldRunToday(frequency, now = new Date()) {
  if (frequency === "Hebdomadaire (lundi matin)") {
    return now.getDay() === 1; // dimanche=0, lundi=1
  }
  // "Quotidienne" et "Immédiate + hebdomadaire" tournent toutes les deux comme
  // un récapitulatif quotidien — une vraie livraison "immédiate" (déclenchée à
  // chaque écriture) sortirait du cadre d'une tâche planifiée.
  return true;
}

function emailBody(alerts) {
  const lines = alerts.map((a) => `- ${a.who} (${a.company || "—"}) : ${a.text}`);
  return `Bonjour,

Voici le récapitulatif des dossiers et échéances RH à traiter :

${lines.join("\n")}

Cordialement,
Gestion RH Groupe`;
}

async function runDossierAlerts(now = new Date()) {
  const notifications = await db.Notifications.findByPk(1);
  if (!notifications) return;
  if (!shouldRunToday(notifications.frequency, now)) return;

  const recipients = (notifications.adminEmails || []).filter(Boolean);
  if (!recipients.length) return;

  const companies = await db.Company.findAll();
  const countries = await db.Country.findAll();
  const { data, companyById } = await buildAlertsData(companies, countries);
  const allAlerts = computeAlerts(data, companyById);

  const rules = notifications.rules || {};
  const enabledAlerts = allAlerts.filter((a) => rules[RULE_BY_TYPE[a.type]]);
  if (!enabledAlerts.length) return;

  try {
    await mail.sendMail(recipients, "Suivi RH — dossiers à compléter", emailBody(enabledAlerts));
    // eslint-disable-next-line no-console
    console.log(`[rh:notifications] ${enabledAlerts.length} alerte(s) envoyée(s) à ${recipients.join(", ")}`);
  } catch (e) {
    console.error("[rh:notifications] Échec de l'envoi :", e.message);
  }
}

function start() {
  // Tous les jours à 07:00, heure serveur — après la diffusion Planning (06:00).
  cron.schedule("0 7 * * *", () => {
    runDossierAlerts().catch((e) => console.error("[rh:notifications] Erreur job :", e.message));
  });
}

module.exports = { start, runDossierAlerts, shouldRunToday };
